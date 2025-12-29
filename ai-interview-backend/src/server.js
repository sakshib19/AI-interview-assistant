// server.js - Revised: unified AI client, normalized fields, small bugfixes & logging
require("dotenv").config();
const { getProfileDashboard } = require("../Controller/profile");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require('path');
const multer = require("multer");
const FormData = require("form-data");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
// Import auth functions - adjust path as needed
const { signupUser, loginUser, verifyToken } = require("../Controller/auth");

const app = express();

// Import models - adjust paths as needed
const User = require("../models/User");
const Session = require("../models/Session");
const QA = require("../models/QA");
const Resume = require("../models/Resume");
const Decision = require("../models/Decision");
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));// ---------- CONFIG ----------
const corsOrigins = process.env.CORS_ORIGIN ?
  process.env.CORS_ORIGIN.split(",") :
  ["http://localhost:3000", "http://localhost:4000"];

const AI_URL = (process.env.AI_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const AI_API_KEY = process.env.AI_API_KEY || null;

// If AI expects raw base64 (without data:image/... prefix), set this.
// If your AI expects full data URLs, set to false.
const AI_EXPECTS_RAW_BASE64 = false;

// ---------- MIDDLEWARE ----------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
// Increased limit to 50mb to handle base64 image strings from camera
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ip=${req.ip}`);
  next();
});
function inferSemanticType(parsed) {
  if (parsed?.type) return parsed.type;
  if (parsed?.coding_challenge) return "dsa";
  if (parsed?.target_project) return "project_discussion";
  return "conceptual";
}

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || "300", 10),
});
app.use(limiter);
// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExt = [".pdf", ".docx", ".txt"];
    const allowedMime = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    const name = (file.originalname || "").toLowerCase();
    const okName = allowedExt.some(ext => name.endsWith(ext));
    const okMime = allowedMime.includes(file.mimetype);
    if (okName && okMime) cb(null, true);
    else {
      const msg = `Only PDF, DOCX or TXT files are allowed. Got '${file.originalname}' (${file.mimetype})`;
      console.warn("🚫 Upload rejected:", msg);
      cb(new Error(msg));
    }
  },
});

// ---------- AI CLIENT (axios instance) ----------
const aiClient = axios.create({
  baseURL: AI_URL,
  timeout: 60000,
  headers: AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}
});

// ---------- IMAGE VALIDATION / NORMALIZATION HELPERS ----------
const DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/]+=*)$/i;
function isValidDataImage(str, minLen = 300) {
  if (!str || typeof str !== "string") return false;
  if (str.length < minLen) return false;
  if (!str.toLowerCase().startsWith("data:image/")) return false;
  return DATA_IMAGE_RE.test(str);
}
function stripDataPrefix(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const m = dataUrl.match(DATA_IMAGE_RE);
  if (!m) return null;
  return m[2]; // base64 payload only
}

// helper wrapper with retries (keeps previous behaviour)
// NOTE: instrumented to log image payload samples before forwarding to AI
async function callWithRetry(path, payload, opts = {}, attempts = 2, backoffMs = 300) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      console.log(`📡 Calling AI endpoint: ${path}`);
      // If calling with an image, print a short sample so debugging shows whether a bad value is forwarded
      if (payload && (payload.image || payload.current_image || payload.reference_image)) {
        try {
          const imgField = payload.image ? 'image' : (payload.current_image ? 'current_image' : 'reference_image');
          const sample = String(payload[imgField]).substring(0, 80);
          console.warn(`   → payload.${imgField} sample: ${sample}... (len=${String(payload[imgField]).length})`);
        } catch (e) { /* ignore sample logging errors */ }
      }
      const resp = await aiClient.post(path, payload, { timeout: opts.timeout || 60000 });
      return resp.data;
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️ AI call failed (${path}) attempt ${i + 1}/${attempts}:`, err.message);
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, backoffMs * (i + 1)));
      }
    }
  }
  throw lastErr;
}

async function callAiGenerateQuestion(payload) { return callWithRetry("/generate_question", payload, {}, 2, 600); }
async function callAiScoreAnswer(payload) { return callWithRetry("/score_answer", payload, {}, 2, 300); }
async function callAiProbe(payload) { return callWithRetry("/probe", payload, {}, 2, 300); }
async function callAiFinalizeDecision(payload) { return callWithRetry("/finalize_decision", payload, {}, 2, 300); }
// NEW: AI face registration call
async function callAiRegisterFace(payload) {
  // Face registration can be faster, use a shorter timeout
  return callWithRetry("/interview/register-face", payload, { timeout: 20000 }, 1, 0);
}

// ---------------- DB ----------------
// ---------------- DB ----------------
async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/interviewdb";
  try {
    await mongoose.connect(uri, { 
      autoIndex: false,             // Don't build indexes on every boot (prod best practice)
      maxPoolSize: 10,              // Maintain up to 10 socket connections
      minPoolSize: 2,               // Keep at least 2 connections open
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000,       // Close sockets after 45 seconds of inactivity
    });
    console.log("✅ Connected to MongoDB:", uri);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

// DB helpers (kept largely as-is)
async function createSessionDB(userId = null, metadata = {}) {
  const sessionId = uuidv4();
  const s = await Session.create({
    sessionId,
    userId: userId || null,
    metadata,
    status: "active",
    qaIds: [],
    events: [],
    startedAt: new Date()
  });
  return s.toObject ? s.toObject() : s;
}

async function getSessionByIdDB(sessionId) {
  return Session.findOne({ sessionId }).lean();
}

async function markSessionCompletedDB(sessionId, extras = {}) {
  return Session.findOneAndUpdate(
    { sessionId },
    { $set: { status: "completed", endedAt: new Date(), ...extras } },
    { new: true }
  ).lean();
}

// Ensure expectedAnswerType field name is consistent here
async function createQARecordDB(sessionId, questionText, ideal_outline = null, expectedAnswerType = "short", difficulty = "medium", userId = null, metadata = {}) {
  const qaId = uuidv4();
  const questionId = uuidv4();
  const rec = await QA.create({
    qaId,
    questionId,
    sessionId,
    userId: userId || null,
    questionText,
    ideal_outline,
    expectedAnswerType,
    difficulty,
    metadata,
    askedAt: new Date(),
  });
  await Session.updateOne({ sessionId }, { $push: { qaIds: qaId } });
  return rec.toObject ? rec.toObject() : rec;
}

async function updateQARecordDB(qaId, patch) {
  const updated = await QA.findOneAndUpdate({ qaId }, { $set: patch }, { new: true });
  return updated ? (updated.toObject ? updated.toObject() : updated) : null;
}

async function getQAByQaId(qaId) {
  return QA.findOne({ qaId }).lean();
}async function buildQuestionHistory(sessionId, excludeQaId = null) {
  try {
    const query = { sessionId: sessionId };
    
    if (excludeQaId) {
        query.qaId = { $ne: excludeQaId };
    }


    // ✅ FIX: Added 'improvement' and 'rationale' to the selection string
  const qaDocs = await QA.find(query)
      .select("questionText candidateAnswer score verdict ideal_outline improvement rationale technical_diagnosis metadata.target_project metadata.type metadata.is_probe metadata.round expectedAnswerType askedAt playback_history")
      .sort({ askedAt: 1 })
      .lean();

    console.log(`📜 History built for ${sessionId}: ${qaDocs.length} items.`);

    return qaDocs.map(r => {
      let qType = r.metadata?.type;
      
      // Fallback inference (kept from your logic)
      if (!qType || qType === "conceptual") {
        const text = (r.questionText || "").toLowerCase();
        if (r.expectedAnswerType === "code" || text.includes("function") || text.includes("code")) {
          qType = "coding_challenge";
        } else if (r.target_project || r.metadata?.target_project || text.includes("project")) {
          qType = "project_discussion";
        }
      }

      return {
        question: r.questionText,
        answer: r.candidateAnswer || "",
        score: typeof r.score === "number" ? r.score : 0,
        verdict: r.verdict || null,
        ideal_outline: r.ideal_outline || "",
        type: qType || "conceptual",
        target_project: r.metadata?.target_project || r.target_project || null,
        is_probe: r.metadata?.is_probe || false,
        round: r.metadata?.round || null,
        // ✅ These fields will now be populated with actual data
        improvement: r.improvement || r.metadata?.improvement || "", 
        rationale: r.rationale || "",
        technical_diagnosis: r.technical_diagnosis || {},
        playback_history: r.playback_history || []
      };
    });
  } catch (error) {
    console.error("❌ Error building history:", error);
    return [];
  }
}
// ---------------- AUTH MIDDLEWARE ----------------
// verifyToken is expected to behave like express middleware (req, res, next)
function requireAuth(req, res, next) {
  return verifyToken(req, res, next);
}

// ---------- ROUTES ----------

//ProfileDashboard
// ================= PROFILE DASHBOARD =================

app.get("/profile/dashboard", requireAuth, getProfileDashboard);

// Health
app.get("/health", (req, res) => {
  res.json({
    status: "backend running",
    ai_service: AI_URL,
    timestamp: new Date().toISOString()
  });
});

app.get("/test", (req, res) => res.json({ message: "Server is working!" }));
app.post("/interview/roadmap", requireAuth, async(req,res)=>{
  try {
    const {sessionId} = req.body;
    if (!sessionId) return res.status(400).json({error: "sessionId required"});
    const history = await buildQuestionHistory(sessionId);
    const aiPayload = {
      session_id: sessionId,
      user_id: req.userId,
question_history: history.map(h => ({
        question: h.question,
        score: h.score,
        // Ensure we pass feedback if it exists (check rationale or improvement fields)
        feedback: h.feedback || h.rationale || h.improvement || "",
        type: h.type,
    technical_diagnosis: h.technical_diagnosis || {},
        result: { 
            improvement: h.feedback || h.improvement || "",
            technical_diagnosis: h.technical_diagnosis || {} 
        }
          }))
    };
console.log(`🗺️ Generating roadmap for session ${sessionId}...`);  
const aiResp = await aiClient.post("/generate_roadmap", aiPayload, {timeout: 45000});
return res.json(aiResp.data);
} catch (err) {
    console.error("❌ Roadmap generation failed:", err.message);
    const details = err?.response?.data ?? err?.message;
    return res.status(502).json({ error: "roadmap_generation_failed", details });
  }
})
app.post("/run-code", requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    console.log("💻 Executing code for user:", req.userId);

    // --- 1) Determine test cases (support many shapes) ---
    // Priority: explicit coding_challenge.test_cases -> test_cases -> testCases -> single legacy fields
    const challenge = payload.coding_challenge || payload.codingChallenge || null;
    const candidateLists = [
      challenge?.test_cases,
      payload.test_cases,
      payload.testCases,
      payload.tests,
      challenge?.tests,
      challenge?.cases,
      challenge?.examples && Array.isArray(challenge.examples)
        ? challenge.examples.map((ex) => ({ input: ex.input, expected: ex.output || ex.expected }))
        : null,
    ].filter(Boolean);

    let rawCases = [];
    for (const c of candidateLists) {
      if (Array.isArray(c) && c.length > 0) {
        rawCases = c;
        break;
      }
    }

    // Legacy single-field fallback
    if (rawCases.length === 0 && (payload.stdin || payload.stdin === "" || payload.expected_output || payload.expected)) {
      rawCases.push({
        input: payload.stdin ?? payload.stdin_received ?? payload.input ?? "",
        expected: payload.expected_output ?? payload.expected ?? ""
      });
    } else if (rawCases.length === 0 && challenge && (challenge.test_case_input || challenge.test_case)) {
      rawCases.push({
        input: challenge.test_case_input ?? challenge.test_case,
        expected: challenge.expected_output ?? challenge.expected
      });
    }

    // Safety: limit number of tests to avoid DoS or runaway cost
    const MAX_TESTS = 25;
    if (rawCases.length > MAX_TESTS) {
      console.warn(`Trimming test cases from ${rawCases.length} to ${MAX_TESTS}`);
      rawCases = rawCases.slice(0, MAX_TESTS);
    }

    // Helper: normalize a single testcase -> { stdin, expected, raw }
    const normalizeTestCase = (tc) => {
      // Accept shapes like { input, expected } or { stdin, expected_output } etc.
      const inVal = tc.input ?? tc.stdin ?? tc.stdin_input ?? tc.args ?? "";
      const expVal = tc.expected ?? tc.expected_output ?? tc.expectedOutput ?? tc.out ?? tc.output ?? "";

      const safeStringify = (v) => {
        if (v === null || v === undefined) return "";
        if (typeof v === "string") return v;
        try { return JSON.stringify(v); } catch (e) { return String(v); }
      };

      let stdin = safeStringify(inVal);
      let expected = safeStringify(expVal);

      // Cap very long inputs to avoid forwarding multi-MB strings
      const MAX_STDIN_LEN = 200 * 1024; // 200 KB
      if (stdin.length > MAX_STDIN_LEN) {
        console.warn("Trimming very large stdin payload for safety");
        stdin = stdin.slice(0, MAX_STDIN_LEN);
      }

      return { stdin, expected, raw: tc };
    };

    // If we have multiple testcases, run them all
    if (rawCases.length > 0) {
      const results = [];

      for (const tcRaw of rawCases) {
        const tc = normalizeTestCase(tcRaw);

        // Build run payload for Python service (keeps expected around for logging/grading)
        const runPayload = {
          language: (payload.language || "python").toLowerCase(),
          code: payload.code || "",
          stdin: tc.stdin,
          expected_output: tc.expected,
          // forward compact test_cases context so Python can access whole set if it wants
          test_cases: rawCases.map(normalizeTestCase)
        };

        // call AI python run_code endpoint - catch per-test errors and continue
        try {
          const aiResp = await aiClient.post("/run_code", runPayload, { timeout: 30000 });
          const r = aiResp.data || {};

          results.push({
            input: tc.raw?.input ?? tc.raw?.stdin ?? tc.stdin,
            expected: tc.raw?.expected ?? tc.raw?.expected_output ?? tc.expected,
            stdout: typeof r.output === "string" ? r.output : (r.output ? String(r.output) : null),
            success: !!r.success,
            passed: !!r.passed,
            error: r.error ?? null,
            debug: r.debug ?? null,
            raw: r
          });
        } catch (testErr) {
          console.warn("❌ run_code test failed:", testErr?.message || testErr);
          results.push({
            input: tc.stdin,
            expected: tc.expected,
            stdout: null,
            success: false,
            passed: false,
            error: testErr?.message ?? String(testErr),
            debug: null,
            raw: null
          });
        }
      }

      const allPassed = results.length > 0 && results.every((r) => r.passed === true);

      return res.json({
        success: true,
        allPassed,
        results
      });
    }

    // No testcases found -> fallback single-run behavior
    // Use the body as-is but ensure stdin is a string
    const singleStdin = (payload.stdin ?? payload.stdin_received ?? payload.stdinInput ?? "");
    const singleRunPayload = {
      language: (payload.language || "python").toLowerCase(),
      code: payload.code || "",
      stdin: typeof singleStdin === "string" ? singleStdin : JSON.stringify(singleStdin),
      expected_output: payload.expected_output ?? payload.expected ?? null,
      test_cases: [] // none provided
    };

    try {
      const singleResp = await aiClient.post("/run_code", singleRunPayload, { timeout: 30000 });
      return res.json(singleResp.data || { success: false, output: null });
    } catch (singleErr) {
      console.error("❌ Code execution failed (single-run):", singleErr?.message || singleErr);
      const details = singleErr?.response?.data ?? singleErr?.message ?? String(singleErr);
      return res.status(500).json({
        error: "code_execution_failed",
        details: process.env.NODE_ENV === "production" ? undefined : details
      });
    }
  } catch (err) {
    console.error("❌ Code execution failed (route):", err?.message || err);
    const details = err?.response?.data ?? err?.message ?? String(err);
    return res.status(500).json({
      error: "code_execution_failed",
      details: process.env.NODE_ENV === "production" ? undefined : details
    });
  }
});

// Auth
app.post("/auth/signup", async (req, res) => {
  try {
    console.log("📝 Signup request:", req.body?.email);
    const { name, email, password } = req.body;
    const user = await signupUser({ name, email, password });
    const { token } = await loginUser({ email, password });
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("❌ Signup error:", err.message);
    return res.status(400).json({ message: err.message || "signup failed" });
  }
});

// Register face (explicit endpoint used by frontend)
// Body: { sessionId, image }
// Replace the whole /interview/register-face handler with this:
app.post("/interview/register-face", requireAuth, async (req, res) => {
  try {
    const { sessionId, image } = req.body || {};
    if (!sessionId || !image) return res.status(400).json({ error: "sessionId and image required" });

    // Quick client-side sanity check
    if (!isValidDataImage(image, 200)) {
      console.warn(`🚫 register-face rejected: invalid image (len=${String(image).length}) sample=${String(image).substring(0,36)}`);
      return res.status(400).json({ error: "invalid_image", message: "Image must be a data:image/...;base64 string" });
    }

    const session = await Session.findOne({ sessionId }).lean();
    if (!session) return res.status(404).json({ error: "session_not_found" });

    // 1) First, call AI service to validate/register the reference image.
    //    Only if the AI confirms registration do we persist the reference image locally.
    try {
      const aiPayload = {
        sessionId,
        image: AI_EXPECTS_RAW_BASE64 ? stripDataPrefix(image) : image
      };
      console.log(`📸 register-face: calling AI for session ${sessionId} (imageLen=${image.length})`);
      const aiResp = await callAiRegisterFace(aiPayload);

      // aiResp shape varies by implementation; check common success cases
      // Accept if aiResp.status === 'registered' or aiResp.ok === true
      const registered = (aiResp && (aiResp.status === "registered" || aiResp.ok === true || aiResp.result === "registered"));

      if (!registered) {
        // If AI rejected the image, return 400 and include reason if available
        const reason = aiResp?.message || aiResp?.detail || aiResp?.error || "AI rejected the reference image";
        console.warn(`⚠️ AI register-face rejected image for session ${sessionId}:`, reason);
        return res.status(400).json({ ok: false, error: "ai_rejected_image", message: String(reason) });
      }

      // 2) Only persist the reference image after AI accepted it
      await Session.updateOne({ sessionId }, { $set: { "metadata.referenceFace": image, "metadata.referenceRegisteredAt": new Date() } });

      // Response: success
      console.log(`✅ Reference face registered and persisted for session ${sessionId}`);
      return res.json({ ok: true, status: "registered", message: "Reference image registered and saved" });

    } catch (aiErr) {
      // If AI call failed (network / service error), return 502 so frontend knows it's an external error
      console.warn("AI register-face failed:", aiErr?.message || aiErr);
      return res.status(502).json({ ok: false, error: "ai_service_error", message: "Failed to register face with verification service" });
    }

  } catch (err) {
    console.error("register-face error:", err);
    return res.status(500).json({ error: "register_face_failed", details: err?.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    console.log("🔐 Login request:", req.body?.email);
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    return res.status(401).json({ message: err.message || "invalid credentials" });
  }
});

// Resume processing
app.post("/process-resume", requireAuth, upload.single("file"), async (req, res) => {
  try {
    console.log("📄 Processing resume:", req.file?.originalname);
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype || "application/octet-stream",
      knownLength: req.file.size,
    });

    const aiResp = await aiClient.post("/parse_resume", form, {
      headers: { ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000,
    });

    const parsed = aiResp.data?.parsed ?? aiResp.data ?? null;
    console.log("✅ Resume parsed successfully");

    try {
      const resumeDoc = await Resume.create({
        userId: req.userId || null,
        sourceUrl: null,
        parsed,
        redactionLog: parsed?.redaction_log || [],
        rawTextStored: false,
        createdAt: new Date()
      });
      return res.status(201).json({ parsed, resumeId: resumeDoc._id });
    } catch (e) {
      console.warn("⚠️ Resume save failed:", e.message);
      return res.json({ parsed });
    }
  } catch (err) {
    console.error("❌ Parse Resume Error:", err.message);
    const details = err?.response?.data ?? err?.message ?? String(err);
    return res.status(500).json({
      error: "failed_to_parse_resume",
      details: process.env.NODE_ENV === "production" ? undefined : details
    });
  }
});

// Interview start
app.post("/interview/start", requireAuth, async (req, res) => {
    // FIX 1: Define 'session' outside the try block so it's accessible in the catch block
    let session = null; 
    
    try {
        console.log("🎬 Starting interview for user:", req.userId);
        const body = req.body || {};
        const userId = req.userId || null;
        const referenceImage = body.referenceImage || null; // Capture reference image from frontend body

        // --- STEP 1: VALIDATION ---
        if (!referenceImage || !isValidDataImage(referenceImage, 200)) {
            console.warn(`🚫 /interview/start: REJECTED - Missing or invalid referenceImage (len=${String(referenceImage).length})`);
            return res.status(400).json({ error: "invalid_reference_image", message: "A valid reference image is required to start the interview." });
        }

        // --- STEP 2: CREATE TEMPORARY SESSION & TRY AI REGISTRATION ---
        // Assign to 'session' defined above
        session = await createSessionDB(userId, {
            from: "frontend",
            // Store reference image locally immediately, assuming client-side check passed
            referenceFace: referenceImage,
 current_round: "screening",
            round_progress: {
                screening: { questions: 0, status: "in_progress" },
                technical: { questions: 0, status: "not_started" },
                behavioral: { questions: 0, status: "not_started" }
            }

        });
        console.log("📝 Created session:", session.sessionId);

        try {
            const aiRegPayload = {
                sessionId: session.sessionId,
                image: AI_EXPECTS_RAW_BASE64 ? stripDataPrefix(referenceImage) : referenceImage
            };
            console.log(`📸 start: calling AI register-face for session ${session.sessionId} (imageLen=${referenceImage.length})`);

            // This MUST throw on 400 or other errors from the AI service!
            const aiRegResp = await callAiRegisterFace(aiRegPayload); 
            
            // Check for explicit failure status from AI response body (in case AI service returns 200 but status: failed)
            if (aiRegResp?.status === 'failed' || aiRegResp?.ok === false || aiRegResp?.result === 'rejected') {
                 const reason = aiRegResp?.message || aiRegResp?.detail || aiRegResp?.error || "AI explicitly rejected the reference image";
                 throw new Error(reason); // Treat explicit rejection as failure
             }

            console.log("📸 AI Face Registration Status: registered");
            
            // Update DB to mark registration time (optional, but good practice)
            await Session.updateOne({ sessionId: session.sessionId }, { $set: { "metadata.referenceRegisteredAt": new Date() } });

        } catch (aiErr) {
            // CRITICAL BLOCK: If AI registration fails (e.g., DeepFace enforce_detection error 400)
            console.warn("⚠️ AI registration failed. ABORTING START.", aiErr?.message || aiErr);
            
            // Return a 400 error to the client with the failure reason
            const reason = aiErr?.response?.data?.message || aiErr?.message || "AI failed to detect face or register image.";
            
            // Mark the session as terminated/invalid (using session.sessionId safely)
            await Session.updateOne({ sessionId: session.sessionId }, { $set: { status: "aborted", endedReason: "AI registration failed" } });

            return res.status(400).json({ 
                error: "face_registration_failed", 
                message: `Cannot start interview: ${reason}` 
            });
        }
        // --- STEP 3: IF WE REACH HERE, REGISTRATION WAS SUCCESSFUL. PROCEED TO QUESTION GENERATION. ---

        const aiPayload = {
            request_id: uuidv4(),
            session_id: session.sessionId,
            user_id: userId || "anonymous",
            mode: "first",
            resume_summary: body.resume_summary || (body.parsed_resume?.summary) || "",
            retrieved_chunks: body.retrieved_chunks || [],
            conversation: [],
question_history: await buildQuestionHistory(session.sessionId),
            token_budget: 3000,
            allow_pii: !!body.allow_pii,
            options: { 
                return_prompt: false, 
                temperature: 0.1,
                company_style: body.company_style || "FAANG", // From frontend
                role_title: body.role_title || "Backend Engineer" // From frontend
            }
        };

        const aiResp = await callAiGenerateQuestion(aiPayload);
        const parsed = aiResp.parsed || {};
const metadata = aiResp.metadata || {}; 
        // ... (rest of the question generation logic remains the same)

        const questionText = parsed.question || parsed.questionText ||
            "Tell me about the most technically challenging project on your resume. What specific problem did you solve, and how did you approach it?";
let normalizedType = parsed.type || "text";
        if (normalizedType === "coding_challenge") normalizedType = "code";
        if (normalizedType === "system_design") normalizedType = "system_design";
        const semanticType = inferSemanticType(parsed);

        const qaMetadata = {
   type: semanticType,
            target_project: parsed.target_project,
            technology_focus: parsed.technology_focus,
            red_flags: parsed.red_flags || [],
            confidence: parsed.confidence,
round: metadata.current_round || "screening",
            is_probe: false

        };

    const qaDoc = await createQARecordDB(
            session.sessionId,
            questionText,
            parsed.ideal_answer_outline || parsed.ideal_outline || "",
            // 👇 CHANGE THIS LINE 👇
            normalizedType, 
            parsed.difficulty || "hard",
            userId,
           {
    ...qaMetadata,
    type: semanticType      // ✅ THIS is what Python needs
  }
        );

        console.log("✅ Interview started with question ID:", qaDoc.questionId);

      return res.json({
            sessionId: session.sessionId,
            firstQuestion: {
                qaId: qaDoc.qaId,
                questionId: qaDoc.questionId,
                questionText: qaDoc.questionText,
                target_project: parsed.target_project,
                technology_focus: parsed.technology_focus,
                // 👇 CHANGE THIS LINE TOO 👇
                expectedAnswerType: normalizedType,
                difficulty: qaDoc.difficulty,
                ideal_outline: qaDoc.ideal_outline || parsed.ideal_outline,
                red_flags: parsed.red_flags,
                // Pass coding challenge details to frontend
                coding_challenge: parsed.coding_challenge || null ,
                 round: metadata.current_round || "screening",
            },
            proctoring: {
                referenceRegistered: true, // Now guaranteed to be true if we reached here
                aiRegistrationStatus: "registered"
            },
    round_info: {
                current: metadata.current_round || "screening",
                progress: metadata.round_progress || {}
            }
        });
    } catch (err) {
        // FIX 2: Ensure logging uses session.sessionId only if session exists
        const logId = session ? session.sessionId : 'N/A (Pre-session)';
        console.error(`❌ Interview start error for session ${logId}:`, err.message);

        // Generic server error handling (500)
        const details = err?.response?.data ?? err?.message ?? String(err);
        return res.status(500).json({
            error: "failed_to_start_interview",
            details: process.env.NODE_ENV === "production" ? undefined : details
        });
    }
});

// Interview answer
// =========================================================================
// REPLACE YOUR EXISTING app.post("/interview/answer" ...) WITH THIS BLOCK
// =========================================================================
app.post("/interview/answer", requireAuth, async (req, res) => {
  try {
    console.log("💬 Processing answer for session:", req.body.sessionId);

    const { sessionId, qaId, questionId, questionText } = req.body || {};
    const userId = req.userId || null;

    // --- 1. GET SESSION STATE FROM DB (Fixes the "0 Questions" bug) ---
    // We need the existing progress in case this request is a Probe (which returns no new stats)
    const sessionDoc = await Session.findOne({ sessionId }).lean();
    if (!sessionDoc) return res.status(404).json({ error: "session_not_found" });

    // Initialize roundInfo from the DB so we don't start with 0s
    let roundInfo = {
      current_round: sessionDoc.metadata?.current_round || "screening",
      round_progress: sessionDoc.metadata?.round_progress || {
         screening: { questions: 0, status: "in_progress" },
         technical: { questions: 0, status: "not_started" },
         behavioral: { questions: 0, status: "not_started" }
      }
    };

    // --- UNIFIED VARIABLE NAME ---
    let candidateAnswerRaw = req.body.candidateAnswer || req.body.candidate_answer;
    let candidateAnswer = "";
    let questionType = req.body.question_type || "text";
    let codeExecutionResult = req.body.code_execution_result || null;
let whiteboardData = req.body.whiteboard_data || req.body.whiteboardElements || null;
let whiteboardSnapshot = req.body.whiteboard_snapshot || null;
let userTimeComplexity = req.body.user_time_complexity || req.body.userTimeComplexity || null;
    let userSpaceComplexity = req.body.user_space_complexity || req.body.userSpaceComplexity || null;
    let playbackHistory = req.body.playback_history || [];
    if (typeof candidateAnswerRaw === "object" && candidateAnswerRaw !== null) {
      candidateAnswer = candidateAnswerRaw.answer || candidateAnswerRaw.candidateAnswer || "";
      if (candidateAnswerRaw.question_type) questionType = candidateAnswerRaw.question_type;
      if (candidateAnswerRaw.code_execution_result) codeExecutionResult = candidateAnswerRaw.code_execution_result;
      if (candidateAnswerRaw.user_time_complexity) userTimeComplexity = candidateAnswerRaw.user_time_complexity;
      if (candidateAnswerRaw.user_space_complexity) userSpaceComplexity = candidateAnswerRaw.user_space_complexity;
      if (candidateAnswerRaw.playback_history) playbackHistory = candidateAnswerRaw.playback_history;
    } else {
      candidateAnswer = String(candidateAnswerRaw || "");
    }

    if (!qaId && !questionId) return res.status(400).json({ error: "missing qaId or questionId" });

    // Find QA Record
    let qaRec = null;
    if (qaId) qaRec = await getQAByQaId(qaId);
    else qaRec = await QA.findOne({ questionId, sessionId }).lean();

    if (!qaRec) return res.status(404).json({ error: "qa_record_not_found" });

    // Save answer
    await updateQARecordDB(qaRec.qaId, {
      candidateAnswer,
      answeredAt: new Date(),
      playback_history: playbackHistory
    });

    // Build history (excluding current)
    const questionHistory = await buildQuestionHistory(sessionId, qaRec.qaId);
const hintUsed = qaRec.metadata?.hint_used || false;
    // Score payload
    const scorePayload = {
      request_id: uuidv4(),
      session_id: sessionId,
      user_id: userId || "anonymous",
      question_text: questionText || qaRec.questionText,
      ideal_outline: qaRec.ideal_outline || "",
      candidate_answer: candidateAnswer,
      resume_summary: req.body.resume_summary || "",
      retrieved_chunks: req.body.retrieved_chunks || [],
      question_history: questionHistory,
      token_budget: 1200,
      allow_pii: !!req.body.allow_pii,
      options: { temperature: 0.0 },
      question_type: questionType,
      code_execution_result: codeExecutionResult,
      whiteboard_elements: whiteboardData,
      whiteboard_snapshot: whiteboardSnapshot,
      hint_used: hintUsed,
      user_time_complexity: userTimeComplexity,
      user_space_complexity: userSpaceComplexity,
      playback_history: playbackHistory
    };
    console.log(`📤 Sending Score Payload. Type: ${questionType}, Has Whiteboard: ${!!whiteboardData}`);

    const aiScoreResp = await callAiScoreAnswer(scorePayload);
    const validated = aiScoreResp.validated || aiScoreResp.validation || {};
    const overallScore = validated.overall_score ?? validated.score ?? 0;
    const isProbe = aiScoreResp.is_probe || false;

    console.log("📊 Score received:", overallScore, `(is_probe: ${isProbe})`);

    // Update QA with score
    const scoreUpdate = {
      gradedBy: "llm",
      score: overallScore,
      rubricScores: validated.dimension_scores,
      verdict: validated.verdict || "weak",
      confidence: validated.confidence ?? 0.5,
      rationale: validated.rationale || aiScoreResp.rationale || "",
      improvement: validated.feedback_for_candidate || validated.mentor_tip || validated.follow_up_probe || null,
      red_flags_detected: validated.red_flags_detected || [],
      missing_elements: validated.missing_elements || [],
      technical_diagnosis: validated.technical_diagnosis || {},
      needsHumanReview: aiScoreResp.in_gray_zone || false,
      gradedAt: new Date(),
      metadata: {
        ...qaRec.metadata,
        ai_parse_ok: !!aiScoreResp.parse_ok,
        in_gray_zone: aiScoreResp.in_gray_zone || false,
        is_probe: isProbe
      },
    };

    await updateQARecordDB(qaRec.qaId, scoreUpdate);

    // Refresh history
    const updatedHistory = await buildQuestionHistory(sessionId);

    let nextQuestion = null;
    let ended = false;
    let eliminated = false;
    let eliminationReason = null;
    let modelDecision = null;

    // ================= NEXT QUESTION GENERATION =================
    if (!ended) {
      try {
        const inGrayZone = aiScoreResp.in_gray_zone || false;
        const shouldProbe = inGrayZone === true;

        // --- BRANCH A: PROBE GENERATION (No round progress update) ---
        if (shouldProbe && (validated.follow_up_probe || scoreUpdate.improvement)) {
          const probePayload = {
            request_id: uuidv4(),
            session_id: sessionId,
            user_id: userId || "anonymous",
            weakness_topic: validated.missing_elements?.[0] || "the previous topic",
            prev_question: qaRec.questionText,
            prev_answer: candidateAnswer,
            resume_summary: req.body.resume_summary || "",
            token_budget: 600,
            allow_pii: !!req.body.allow_pii,
          };

          const probeResp = await callAiProbe(probePayload);
          const parsedProbe = probeResp.parsed || {};
const parentExpectedType = qaRec.expectedAnswerType; // 🔥 inherit parent

const expectedAnswerType =
  parsedProbe.type === "coding_challenge"
    ? "code"
    : parentExpectedType === "code"
    ? "code"
    : "text";

const newQa = await createQARecordDB(
  sessionId,
  parsedProbe.probe_question || "Can you explain your approach?",
  parsedProbe.ideal_answer_outline || "",
  expectedAnswerType,
  parsedProbe.difficulty || "medium",
  userId,
  {
    ...qaRec.metadata,
    is_probe: true,
    probe_parent_qaId: qaRec.qaId,
    round: roundInfo.current_round
  }
);
          nextQuestion = {
            qaId: newQa.qaId,
            questionId: newQa.questionId,
            questionText: newQa.questionText,
            expectedAnswerType: newQa.expectedAnswerType,
            difficulty: newQa.difficulty,
            is_probe: true,
            round: roundInfo.current_round
          };

        } else {
          // --- BRANCH B: MAIN GENERATION (Updates round progress) ---
          const genPayload = {
            request_id: uuidv4(),
            session_id: sessionId,
            user_id: userId || "anonymous",
            mode: "next",
            resume_summary: req.body.resume_summary || "",
            question_history: updatedHistory,
            token_budget: 1500,
            allow_pii: !!req.body.allow_pii,
            options: { temperature: 0.1 },
          };

          const genResp = await callAiGenerateQuestion(genPayload);

          // 🔥 UPDATE DB WITH NEW PROGRESS IF AVAILABLE
          if (genResp.metadata) {
             roundInfo = genResp.metadata; // Update local variable
             // Persist to MongoDB so the next request remembers the count
             await Session.updateOne({ sessionId }, {
                $set: {
                    "metadata.current_round": roundInfo.current_round,
                    "metadata.round_progress": roundInfo.round_progress
                }
             });
          }

 // CASE 1: ELIMINATION (Hard Reject)
          if (genResp.elimination) {
            eliminated = true;
            eliminationReason = genResp.reason;
            ended = true;

            const decisionDoc = await Decision.create({
              decisionId: uuidv4(),
              sessionId,
              decidedBy: "model",
              verdict: "reject",
              confidence: 0.95,
              reason: eliminationReason,
              feedback_summary: "The interview was concluded early based on technical requirements.",
              recommended_role: null,
              key_strengths: [],
              critical_weaknesses: [eliminationReason],
              rawModelOutput: { eliminated: true, reason: eliminationReason },
              performanceMetrics: genResp.round_history || {},
              decidedAt: new Date()
            });

            await markSessionCompletedDB(sessionId, {
              finalDecisionRef: decisionDoc._id,
              eliminated: true,
              eliminationReason
            });

            return res.json({
              validated: { overall_score: overallScore, verdict: validated.verdict },
              result: { score: overallScore, verdict: validated.verdict },
              nextQuestion: null, 
              ended: true,
              eliminated: true,
              elimination_reason: eliminationReason,
              is_final: true,
              final_decision: decisionDoc,
              round_info: {
                current: roundInfo.current_round,
                progress: roundInfo.round_progress
              }
            });
          }

          // CASE 2: NATURAL COMPLETION OR TIME LIMIT
          // If Python says ended=true, we use Python's verdict.
          else if (genResp.ended) {
            ended = true;
            
            // Extract decision directly from Python payload
            const pyDecision = genResp.final_decision || {};
            
            modelDecision = { 
                verdict: pyDecision.verdict || "maybe",
                confidence: pyDecision.confidence || 0.85,
                reason: pyDecision.reason || genResp.reason || "Interview concluded.",
                feedback_summary: pyDecision.feedback_summary,
                recommended_role: pyDecision.recommended_role,
                key_strengths: pyDecision.key_strengths || [],
                critical_weaknesses: pyDecision.critical_weaknesses || []
            };
            
            const decisionDoc = await Decision.create({
              decisionId: uuidv4(),
              sessionId,
              decidedBy: "model",
              verdict: modelDecision.verdict,
              confidence: modelDecision.confidence,
              reason: modelDecision.reason,
              feedback_summary: modelDecision.feedback_summary,
              recommended_role: modelDecision.recommended_role,
              key_strengths: modelDecision.key_strengths,
              critical_weaknesses: modelDecision.critical_weaknesses,
              rawModelOutput: genResp,
              performanceMetrics: genResp.round_history || {},
              decidedAt: new Date()
            });

            await markSessionCompletedDB(sessionId, {
              finalDecisionRef: decisionDoc._id,
              performanceMetrics: genResp.round_history,
              status: "completed",
              endedReason: modelDecision.reason
            });

            return res.json({
              validated: { overall_score: overallScore, verdict: validated.verdict },
              result: { score: overallScore, verdict: validated.verdict },
              nextQuestion: null,
              ended: true,
              is_final: true,
              final_decision: decisionDoc,
              round_info: {
                current: "complete", 
                progress: roundInfo.round_progress
              }
            });
          }

          // CASE 3: CONTINUE (Generate Next Question)
          else {
             const parsedNext = genResp.parsed || {};
             let nextType = parsedNext.type || "text";
             if (nextType === "coding_challenge") nextType = "code";
             if (nextType === "system_design") nextType = "system_design";
             
             const newQa = await createQARecordDB(
                sessionId,
                parsedNext.question,
                parsedNext.ideal_answer_outline || "",
                nextType,
                parsedNext.difficulty || "medium",
                userId,
                {
                  target_project: parsedNext.target_project,
                  technology_focus: parsedNext.technology_focus,
                  type: inferSemanticType(parsedNext),
                  is_probe: false,
                  round: roundInfo.current_round
                }
              );

              nextQuestion = {
                qaId: newQa.qaId,
                questionId: newQa.questionId,
                questionText: newQa.questionText,
                expectedAnswerType: newQa.expectedAnswerType,
                coding_challenge: parsedNext.coding_challenge || null,
                is_probe: false,
                round: roundInfo.current_round,
                difficulty: newQa.difficulty
              };
          }
        }
      } catch (e) {
        console.warn("⚠️ Next question generation failed:", e.message);
        ended = true;
      }
    }
// 🔥 ENSURE FINAL DECISION IS ALWAYS PRESENT WHEN ENDED
if (ended && !modelDecision) {
  const decisionDoc = await Decision.findOne({ sessionId })
    .sort({ decidedAt: -1 })
    .lean();

  if (decisionDoc) {
    modelDecision = decisionDoc;
  }
}

    // ================= RESPONSE =================
    return res.json({
      validated: { overall_score: overallScore, verdict: validated.verdict },
      result: { 
          score: overallScore, 
          verdict: validated.verdict, 
          improvement: scoreUpdate.improvement, 
          rationale: validated.rationale ,
          technical_diagnosis: validated.technical_diagnosis || {}
      },
      nextQuestion,
      ended,
      eliminated,
      elimination_reason: eliminationReason,
      is_final: ended,
      final_decision: ended ? modelDecision : null,
      needs_human_review: scoreUpdate.needsHumanReview,
      in_gray_zone: scoreUpdate.metadata.in_gray_zone,
      
      round_info: {
        current: roundInfo.current_round || roundInfo.current,
        progress: roundInfo.round_progress || roundInfo.progress,
        section_counts: roundInfo.section_counts
      },
      probe_decision: {
        was_authorized: !!nextQuestion?.is_probe,
        python_gray_zone_flag: aiScoreResp.in_gray_zone,
        current_question_count: updatedHistory.length + 1,
      },
    });
  } catch (err) {
    console.error("❌ /interview/answer failed:", err);
    return res.status(500).json({ error: "internal_server_error", message: err.message });
  }
});
// Record a violation
// Record a violation (safer termination decision)
app.post("/interview/violation", requireAuth, async (req, res) => {
  try {
    const { sessionId, reason, timestamp, action } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    const ev = {
      id: uuidv4(),
      type: "violation",
      reason: reason || "screen-change",
      at: timestamp ? new Date(timestamp) : new Date(),
      by: req.userId || null,
      action: action || "warning"
    };

    // Increment and push event
    const updated = await Session.findOneAndUpdate(
      { sessionId },
      {
        $inc: { violationCount: 1 },
        $push: { events: ev }
      },
      { new: true, upsert: false }
    ).lean();

    if (!updated) return res.status(404).json({ error: "session_not_found" });

    // Robust read of violationCount
    const currentCount = (typeof updated.violationCount === "number") ? updated.violationCount : 0;
    console.log(`⚠️ Violation recorded for session ${sessionId}: ${ev.reason} (count=${currentCount}, action=${ev.action})`);

    // Decide whether to terminate. Use a threshold (2) OR explicit terminate flag after sanity-check.
    const THRESHOLD = 1000;
    const explicitlyTerminate = action === "terminate";
    const shouldTerminate = (currentCount >= THRESHOLD) || explicitlyTerminate;

    if (shouldTerminate && !String(updated.status || "").startsWith("completed")) {
      try {
        const extras = {
          terminatedByViolation: true,
          endedReason: `Interview integrity failure: ${reason}`,
          status: "completed",
          endedAt: new Date()
        };

        const completedSession = await Session.findOneAndUpdate(
          { sessionId },
          { $set: extras },
          { new: true }
        ).lean();

        const decisionDoc = await Decision.create({
          decisionId: uuidv4(),
          sessionId,
          decidedBy: "system",
          verdict: "reject",
          confidence: 1.0,
          reason: extras.endedReason,
          recommended_role: null,
          key_strengths: [],
          critical_weaknesses: [],
          rawModelOutput: { terminated_by_violation: true, reason: extras.endedReason, violationCount: currentCount },
          performanceMetrics: { averageScore: null },
          decidedAt: new Date()
        });

        await Session.updateOne({ sessionId }, { $set: { finalDecisionRef: decisionDoc._id } });

        return res.json({
          ok: true,
          event: ev,
          violationCount: currentCount,
          terminated: true,
          message: `Session terminated due to repeated violations (${currentCount}).`,
          finalDecisionRef: decisionDoc._id
        });
      } catch (innerErr) {
        console.warn("⚠️ Failed to complete session after threshold:", innerErr);
        return res.json({
          ok: true,
          event: ev,
          violationCount: currentCount,
          terminated: true,
          message: `Violation threshold reached (error creating decision)`
        });
      }
    }

    return res.json({
      ok: true,
      event: ev,
      violationCount: currentCount,
      terminated: false,
      message: currentCount === 1 ? "Warning recorded" : "Violation recorded"
    });

  } catch (err) {
    console.error("❌ Violation recording failed:", err?.message || err);
    return res.status(500).json({ error: "failed_to_record_violation", details: err?.message });
  }
});
// --- REPLACE YOUR EXISTING /interview/hint ROUTE WITH THIS ---
app.post("/interview/hint", requireAuth, async (req, res) => {
  try {
    const { sessionId, questionId, questionText, type,currentAnswer } = req.body;
    
    // Validation
    if (!sessionId || !questionId || !questionText) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Mark question as having used a hint (for scoring penalty)
    await QA.updateOne(
        { sessionId, questionId }, 
        { $set: { "metadata.hint_used": true } }
    );
    
    // 2. Generate the hint via Python
    // ⚠️ CRITICAL FIX: Map camelCase (Node) to snake_case (Python)
    const aiPayload = {
        session_id: sessionId,      // mapped from req.body.sessionId
        question: questionText,     // mapped from req.body.questionText
        type: type || "conceptual",
        current_answer: currentAnswer || ""
    };

    try {
        // Call the helper function that wraps axios
        const aiResp = await callWithRetry("/generate_hint", aiPayload, {}, 2, 300);
        return res.json({ hint: aiResp.hint });
    } catch (aiErr) {
        console.error("AI Hint Error details:", aiErr.response?.data || aiErr.message);
        return res.status(502).json({ error: "AI hint generation failed" });
    }

  } catch (err) {
    console.error("❌ Hint API Error:", err.message);
    return res.status(500).json({ error: "internal_server_error" });
  }
});
// Interview end
app.post("/interview/end", requireAuth, async (req, res) => {
  try {
    console.log("🏁 Ending interview:", req.body.sessionId);
    const { sessionId, reason, terminated_by_violation } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: "missing sessionId" });

    const s = await getSessionByIdDB(sessionId);
    if (!s) return res.status(404).json({ error: "session_not_found" });

    // 1. Gather Data
    const history = await buildQuestionHistory(sessionId);
    const scores = history.map(r => r.score).filter(v => typeof v === "number");
    const avgScore = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    let decisionDoc = null;
    let extras = { endedAt: new Date(), status: "completed" };

    if (reason) extras.endedReason = reason;

    // --- CASE A: VIOLATION (Hard Reject) ---
    if (terminated_by_violation) {
      extras.terminatedByViolation = true;
      extras.finalVerdict = "reject";
      extras.finalReason = reason || "Integrity violation";

      decisionDoc = await Decision.create({
        decisionId: uuidv4(),
        sessionId,
        decidedBy: "system",
        verdict: "reject",
        confidence: 1.0,
        reason: extras.finalReason,
        feedback_summary: extras.finalReason,
        key_strengths: [],
        critical_weaknesses: ["Integrity violation suspected"],
        rawModelOutput: { terminated: true },
        performanceMetrics: { average_score: avgScore },
        decidedAt: new Date()
      });
    }

    // --- CASE B: MANUAL FINISH (Ask AI for Verdict) ---
    else {
      try {
        const decisionPayload = {
          request_id: uuidv4(),
          session_id: sessionId,
          user_id: req.userId,
          resume_summary: "",
          conversation: [],
          question_history: history,
          token_budget: 2000,
          accept_model_final: true
        };

        const aiDecisionResp = await callAiFinalizeDecision(decisionPayload);
        const aiData = aiDecisionResp.result?.parsed || {};

        decisionDoc = await Decision.create({
          decisionId: uuidv4(),
          sessionId,
          decidedBy: "model",
          verdict: aiData.verdict || (avgScore > 0.6 ? "hire" : "reject"),
          confidence: aiData.confidence || 0.5,
          reason: aiData.reason || reason || "Candidate ended interview manually.",
          feedback_summary: aiData.feedback_summary,
          recommended_role: aiData.recommended_role,
          key_strengths: aiData.key_strengths || [],
          critical_weaknesses: aiData.critical_weaknesses || [],
          performanceMetrics:
            aiDecisionResp.performance_metrics || { average_score: avgScore },
          decidedAt: new Date()
        });

        extras.finalVerdict = decisionDoc.verdict;
      } catch (aiErr) {
        console.warn("⚠️ Manual end AI decision failed:", aiErr.message);

        decisionDoc = await Decision.create({
          decisionId: uuidv4(),
          sessionId,
          decidedBy: "fallback",
          verdict: avgScore > 0.6 ? "hire" : "reject",
          confidence: 0.5,
          reason: "Manual end (AI analysis unavailable)",
          feedback_summary: "Interview ended manually. Final decision based on performance.",
          key_strengths: [],
          critical_weaknesses: [],
          performanceMetrics: { average_score: avgScore },
          decidedAt: new Date()
        });
      }
    }

    // 🔥 SAFETY GUARD — ensure decisionDoc exists
    if (!decisionDoc) {
      decisionDoc = await Decision.create({
        decisionId: uuidv4(),
        sessionId,
        decidedBy: "system_fallback",
        verdict: avgScore > 0.6 ? "hire" : "reject",
        confidence: 0.5,
        reason: "Interview ended.",
        feedback_summary: "Final decision generated by system fallback.",
        performanceMetrics: { average_score: avgScore },
        decidedAt: new Date()
      });
    }

    // 2. Update Session
    extras.finalDecisionRef = decisionDoc._id;
    const updatedSession = await markSessionCompletedDB(sessionId, extras);

    console.log("✅ Interview ended. Verdict:", decisionDoc.verdict);

    return res.json({
      ok: true,
      sessionId,
      finalScore: avgScore,
      totalQuestions: history.length,
      terminated_by_violation: !!terminated_by_violation,
      finalDecisionRef: decisionDoc._id,
      finalDecision: decisionDoc,
      session: updatedSession
    });

  } catch (err) {
    console.error("❌ Interview end error:", err?.message || err);
    return res.status(500).json({ error: "failed_to_end_session" });
  }
});

app.get("/interview/session/:sessionId", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    // 1. Get Session
    const session = await Session.findOne({ sessionId }).lean();
    if (!session) return res.status(404).json({ error: "Session not found" });

    // 2. Get Full History
    const history = await buildQuestionHistory(sessionId);

    // 3. Find the "Current" (Unanswered) Question
    const allQAs = await QA.find({ sessionId }).sort({ askedAt: -1 }).lean();
    const latestQA = allQAs[0];
    
    let currentQuestion = null;
    let stage = "idle";

    if (session.status === "completed") {
      stage = "done";
    } else if (latestQA && !latestQA.candidateAnswer) {
      // Unanswered question found -> Resume "running"
      stage = "running";
      
      // Infer metadata for frontend
      let qType = latestQA.metadata?.type;
      if (!qType) {
         if (latestQA.expectedAnswerType === "code") qType = "coding_challenge";
         else if (latestQA.target_project) qType = "project_discussion";
         else qType = "conceptual";
      }

      currentQuestion = {
        qaId: latestQA.qaId,
        questionId: latestQA.questionId,
        questionText: latestQA.questionText,
        expectedAnswerType: latestQA.expectedAnswerType,
        difficulty: latestQA.difficulty,
        ideal_outline: latestQA.ideal_outline,
        type: qType,
        target_project: latestQA.metadata?.target_project,
        coding_challenge: latestQA.metadata?.coding_challenge || null,
        is_probe: latestQA.metadata?.is_probe || false,
        round: latestQA.metadata?.round || session.metadata?.current_round || "screening"
      };
    } else {
      // Session active but no open question (rare)
      stage = "running"; 
    }

    return res.json({
      sessionId: session.sessionId,
      stage,
      currentQuestion,
      history, 
      round_info: {
         current: session.metadata?.current_round || "screening",
         progress: session.metadata?.round_progress || {}
      }
    });

  } catch (err) {
    console.error("❌ Resume session error:", err);
    return res.status(500).json({ error: "resume_failed" });
  }
});
// Admin route
app.get("/admin/session/:id", requireAuth, async (req, res) => {
  try {
    const s = await Session.findOne({ sessionId: req.params.id }).lean();
    if (!s) return res.status(404).json({ error: "not_found" });
    const qas = await QA.find({ qaId: { $in: s.qaIds || [] } }).lean();
    return res.json({ session: s, qas });
  } catch (e) {
    console.error("❌ Admin/session error:", e);
    return res.status(500).json({ error: "internal_server_error" });
  }
});

// Proctoring endpoint (face verification)
// Proctoring endpoint (face verification + object detection)
// Proctoring endpoint (face verification + object detection)
// Proctoring endpoint (face verification + object detection)
app.post("/interview/proctor", requireAuth, async (req, res) => {
    try {
        const { sessionId, image } = req.body;
        
        // Enhanced validation
        if (!sessionId) {
            console.warn("⚠️ Proctor: Missing sessionId");
            return res.status(400).json({ error: "Missing sessionId" });
        }

        const session = await Session.findOne({ sessionId }).select("sessionId metadata status").lean();
        if (!session) {
            console.warn("⚠️ Proctor: Session not found:", sessionId);
            return res.status(404).json({ error: "Session not found" });
        }

        // CRITICAL: Don't process if interview is already completed
        if (session.status === "completed" || session.status === "aborted") {
            console.log(`🛑 Proctor: Session ${sessionId} already ${session.status} - ignoring`);
            return res.json({ status: "session_ended", verified: false, message: "Interview already ended" });
        }

        // If no image, return success but log warning (don't create violation)
        if (!image) {
            console.warn("⚠️ Proctor: No image provided (camera may be initializing)");
            return res.json({ status: "no_image", verified: true, message: "No frame available yet" });
        }

        // Basic sanity check
        if (!isValidDataImage(image, 300)) {
            console.warn("⚠️ Proctor: Invalid image format");
            return res.json({ status: "invalid_image", verified: true, message: "Frame validation failed (camera warming up)" });
        }

        try {
            // Call AI service
            const verifyPayload = {
                session_id: sessionId, 
                current_image: AI_EXPECTS_RAW_BASE64 ? stripDataPrefix(image) : image
            };

            const aiResponse = await aiClient.post("/verify_face", verifyPayload, { timeout: 10000 });
            const data = aiResponse.data;

            // Check for violations
            if (data.verified === false) {
                const violationType = data.violation_type || "unknown_violation";
                const errorMsg = data.error || "Verification failed";

                let dbReason = errorMsg;
                if (violationType === "prohibited_object") {
                    const items = data.objects ? data.objects.join(", ") : "unknown object";
                    dbReason = `Prohibited object detected: ${items}`;
                } else if (violationType === "multiple_people") {
                    dbReason = `Multiple people detected (${data.person_count || 2} found)`;
                } else if (violationType === "face_mismatch") {
                    dbReason = `Unauthorized face detected (Distance: ${data.distance?.toFixed(4)})`;
                }

                console.log(`⚠️ VIOLATION RECORDED (${violationType}): ${dbReason}`);

                // Record in MongoDB
                await Session.updateOne(
                    { sessionId },
                    {
                        $inc: { violationCount: 1 },
                        $push: { events: {
                            id: uuidv4(),
                            type: violationType,
                            reason: dbReason,
                            at: new Date()
                        }}
                    }
                );

                return res.json(data);
            }

            // Success
            return res.json({ status: "success", verified: true, distance: data.distance });

        } catch (aiErr) {
            console.error("❌ AI Service Error:", aiErr.message);
            return res.status(502).json({ 
                status: "failed", 
                verified: false, 
                error: "AI service unavailable" 
            });
        }
    } catch (err) {
        console.error("❌ Proctoring Error:", err.message);
        return res.status(500).json({ error: "Internal error" });
    }
});
// 404 handler
app.use((req, res) => {
  console.warn("⚠️ 404 Not Found:", req.method, req.path);
  res.status(404).json({
    error: "not_found",
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      "GET /health",
      "GET /test",
      "POST /auth/signup",
      "POST /auth/login",
      "POST /process-resume",
      "POST /interview/start",
      "POST /interview/register-face",
      "POST /interview/proctor",
      "POST /interview/answer",
      "POST /interview/violation",
      "POST /interview/end",
      "POST /interview/hint",

    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global error:", err?.message || err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large" });
  }
  if (/Only PDF|DOCX|TXT/.test(err.message || "")) {
    return res.status(400).json({ error: err.message });
  }
  const details = process.env.NODE_ENV === "production" ? undefined : (err?.stack || err?.message);
  res.status(500).json({ error: "internal_server_error", details });
});

// Start server
let server;
(async function init() {
  try {
    await connectDB();
    const PORT = process.env.PORT || 4000;
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log("\n" + "=".repeat(50));
      console.log("🚀 Backend Server Started");
      console.log("=".repeat(50));
      console.log(`📍 Port: ${PORT}`);
      console.log(`🤖 AI Service: ${AI_URL}`);
      console.log(`🔒 CORS Origins: ${corsOrigins.join(", ")}`);
      console.log(`📚 MongoDB: Connected`);
      console.log("=".repeat(50) + "\n");
    });
  } catch (e) {
    console.error("❌ Failed to init server:", e);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  console.log('\n⚠️ SIGINT received, shutting down gracefully...');
  if (server) await new Promise(r => server.close(r));
  await mongoose.disconnect();
  console.log('✅ Shutdown complete');
  process.exit(0);
});