"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import ResumeUploader from "../resume/page";
import { useInterview } from "../hooks/useInterview";
import { useAuth } from "../context/AuthContext";
import { useWebSpeech } from "../hooks/useWebSpeech";
import Link from "next/link";
import jsPDF from "jspdf";
import "@excalidraw/excalidraw/index.css";
// import { exportToBlob } from "@excalidraw/excalidraw";
import autoTable from "jspdf-autotable";
import Editor from "@monaco-editor/react";
import {
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  Play,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  XCircle,
  HelpCircle,
  Lightbulb,
  Loader2,
  FileText, // <--- NEW
  ArrowRight,
  LayoutTemplate,
  Map,
  Calendar,
  BookOpen,
  Video,
  Code,
  Layout,
  ExternalLink,
  Zap ,
  Mic,
  Square,
  Keyboard,
  Edit3,
  Volume2, 
  VolumeX,
  Pause,
  Settings
    // <--- NEW // Added for loading indicator
} from "lucide-react";

/* -------------------------
    Helper render functions (unchanged)
    ------------------------- */
const renderScoreBadge = (score: number | undefined) => {
  if (score === undefined || score === null)
    return (
      <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-800">
        N/A
      </span>
    );
  const percent = Math.round(score * 100);
  let color = "bg-rose-100 text-rose-800";
  if (percent >= 75) color = "bg-green-100 text-green-800";
  else if (percent >= 50) color = "bg-blue-100 text-blue-800";
  else if (percent >= 25) color = "bg-amber-100 text-amber-800";

  return (
    <span className={`text-sm font-black px-3 py-1 rounded-full ${color}`}>
      {percent}%
    </span>
  );
};

const renderVerdictBadge = (verdict: string | undefined) => {
  if (verdict === undefined || verdict === null) {
    return (
      <span
        style={{
          fontSize: "1.5rem",
          padding: "0.5rem 1.5rem",
          borderRadius: "9999px",
          fontWeight: 900,
          textShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
        className="bg-slate-200 text-slate-700"
      >
        PENDING
      </span>
    );
  }

  let style: React.CSSProperties = {
    fontSize: "1.5rem",
    padding: "0.5rem 1.5rem",
    borderRadius: "9999px",
    fontWeight: 900,
    textShadow: "0 1px 3px rgba(0,0,0,0.1)",
  };

  switch (verdict.toLowerCase()) {
    case "strong":
    case "exceptional":
      style = {
        ...style,
        background:
          "linear-gradient(to right, var(--tw-color-emerald-500), var(--tw-color-green-700))",
        color: "white",
      };
      return (
        <span style={style} className="shadow-lg shadow-emerald-200">
          <Award size={24} className="inline mr-2" /> STRONG HIRE
        </span>
      );
    case "acceptable":
      style = {
        ...style,
        background:
          "linear-gradient(to right, var(--tw-color-blue-500), var(--tw-color-indigo-700))",
        color: "white",
      };
      return (
        <span style={style} className="shadow-lg shadow-indigo-200">
          <CheckCircle size={24} className="inline mr-2" /> ACCEPTABLE
        </span>
      );
    case "weak":
    case "fail":
      style = {
        ...style,
        background:
          "linear-gradient(to right, var(--tw-color-rose-500), var(--tw-color-red-700))",
        color: "white",
      };
      return (
        <span style={style} className="shadow-lg shadow-rose-200">
          <XCircle size={24} className="inline mr-2" /> NOT RECOMMENDED
        </span>
      );
    default:
      return (
        <span style={style} className="bg-slate-200 text-slate-700">
          {verdict.toUpperCase()}
        </span>
      );
  }
};

const renderTrendIcon = (trend: string) => {
  switch (trend) {
    case "increasing":
      return <TrendingUp size={24} className="text-green-600" />;
    case "decreasing":
    case "falling":
      return <TrendingDown size={24} className="text-rose-600" />;
    case "stable":
    default:
      return <Minus size={24} className="text-slate-600" />;
  }
};
import dynamic from "next/dynamic";
// Replace your current ExcalidrawWrapper import (around line 109) with:
const ExcalidrawWrapper = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }
);
/* -------------------------
    Main component
    ------------------------- */
/* -------------------------
   Roadmap Display Component (Dynamic Title & Colors)
   ------------------------- */
const RoadmapDisplay = ({ plan, title }: { plan: any, title?: string }) => {
  if (!plan) return null;

  // 🔍 DEBUG: Log exactly what the frontend is seeing
  console.log("🔍 Roadmap Data:", plan);

  // 1. Dynamic Styling based on Plan Type
  const getTheme = () => {
    const t = (title || "").toLowerCase();
    if (t.includes("advanced") || t.includes("mastery")) {
      return {
        bg: "bg-gradient-to-r from-amber-500 to-orange-600",
        icon: "text-amber-200",
        border: "border-amber-100",
        badge: "bg-amber-100 text-amber-800"
      };
    }
    if (t.includes("recovery") || t.includes("foundations")) {
      return {
        bg: "bg-gradient-to-r from-blue-600 to-indigo-600",
        icon: "text-blue-200",
        border: "border-blue-100",
        badge: "bg-blue-100 text-blue-800"
      };
    }
    // Default / Hybrid
    return {
      bg: "bg-gradient-to-r from-emerald-600 to-teal-600",
      icon: "text-emerald-200",
      border: "border-emerald-100",
      badge: "bg-emerald-100 text-emerald-800"
    };
  };

  const theme = getTheme();
  const displayTitle = title || "Personalized Study Roadmap";

  // 🛠️ HELPER: Recursively find the 'weekly_plan' array
  const findSchedule = (obj: any): any[] => {
    if (!obj || typeof obj !== 'object') return [];
    
    // 1. Direct match (case insensitive)
    const keys = Object.keys(obj);
    const planKey = keys.find(k => k.toLowerCase().includes('weekly') && k.toLowerCase().includes('plan'));
    if (planKey && Array.isArray(obj[planKey])) {
      return obj[planKey];
    }

    // 2. Check for 'roadmap' wrapper or common LLM nesting
    if (obj.roadmap && typeof obj.roadmap === 'object') return findSchedule(obj.roadmap);
    if (obj.Roadmap && typeof obj.Roadmap === 'object') return findSchedule(obj.Roadmap);
    if (obj.plan && typeof obj.plan === 'object') return findSchedule(obj.plan);

    return [];
  };
  
  const schedule = findSchedule(plan);
  
  // Extract fields safely
  const assessment = plan.overall_assessment || plan.roadmap?.overall_assessment || plan.assessment || "Here is your personalized growth plan based on the interview results.";
  const radar = plan.skill_radar || plan.roadmap?.skill_radar || plan.skills || null;

  return (
    <div className="mt-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className={`bg-white rounded-3xl border-2 ${theme.border} shadow-xl overflow-hidden`}>
        
        {/* Header */}
        <div className={`${theme.bg} p-8 text-white`}>
          <div className="flex items-center gap-3 mb-3">
            <Map className={theme.icon} size={32} />
            <h2 className="text-3xl font-black uppercase tracking-wide shadow-sm">{displayTitle}</h2>
          </div>
          <p className="text-white/90 text-lg font-medium leading-relaxed max-w-3xl">
            {assessment}
          </p>
        </div>

        <div className="p-8">
          {/* Skill Radar */}
          {radar && (
            <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Target size={18} /> Skill Gap Analysis
              </h3>
              <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(radar).map(([skill, score]: [string, any]) => (
                  <div key={skill}>
                    <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-1">
                      <span>{skill.replace(/_/g, " ")}</span>
                      <span>{Math.round(Number(score) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${Number(score) > 0.7 ? 'bg-emerald-500' : Number(score) > 0.4 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                        style={{ width: `${Number(score) * 100}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Timeline */}
          <div className="space-y-8">
            <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2 border-b pb-4">
              <Calendar size={20} className="text-slate-600" /> Actionable Schedule
            </h3>
            
            {schedule.length === 0 ? (
               <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 italic">
                 <p>No specific schedule generated.</p>
                 <p className="text-xs mt-2 text-slate-400">(Debug: Check console for 'Roadmap Data Received')</p>
               </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-12 pb-4">
                {schedule.map((week: any, wIdx: number) => (
                  <div key={wIdx} className="relative pl-8">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[11px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-md ${theme.bg}`} />
                    
                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-slate-800">Week {week.week}: {week.theme}</h4>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {week.goals?.map((g: string, i: number) => (
                          <span key={i} className={`text-xs font-bold px-2.5 py-1 rounded-md ${theme.badge}`}>
                            🎯 {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {week.daily_tasks?.map((task: any, dIdx: number) => (
                        <div key={dIdx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase tracking-wider">
                              {task.day}
                            </span>
                          </div>
                          <p className="font-medium text-slate-800 mb-4 leading-relaxed">{task.activity}</p>
                          
                          <div className="space-y-2">
                            {task.resources?.map((res: any, rIdx: number) => (
                              <a 
                                key={rIdx} 
                                href={res.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-colors"
                              >
                                <div className="shrink-0 p-1.5 bg-white rounded-md shadow-sm">
                                  {res.type === 'video' ? <Video size={16} className="text-red-500" /> : <BookOpen size={16} className="text-blue-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-slate-700 hover:text-indigo-600 truncate">
                                    {res.title}
                                  </div>
                                </div>
                                <ExternalLink size={14} className="text-slate-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
 const CodeReplayPlayer = ({ history }: { history: any[] }) => {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying && index < history.length - 1) {
      interval = setInterval(() => {
        setIndex((prev) => prev + 1);
      }, 500); // 0.5s per frame
    } else if (index >= history.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, index, history.length]);

  const frame = history[index];
  if (!frame) return <div className="text-slate-400 text-xs italic p-2">No playback data available.</div>;

  return (
    <div className="mt-4 border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Player Toolbar */}
      <div className="bg-slate-100 p-2 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-xs font-bold transition-colors"
          >
            {isPlaying ? <><Minus size={12} /> Pause</> : <><Play size={12} /> Replay</>}
          </button>
          
          <input 
            type="range" 
            min="0" 
            max={history.length - 1} 
            value={index} 
            onChange={(e) => setIndex(Number(e.target.value))}
            className="w-32 md:w-48 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          
          <span className="text-xs text-slate-500 font-mono">
            {new Date(frame.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
          </span>
        </div>

        {/* Event Badge */}
        <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
          frame.trigger === 'paste' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 
          frame.trigger === 'run' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 
          'bg-slate-200 text-slate-600 border border-slate-300'
        }`}>
          {frame.trigger}
        </div>
      </div>

      {/* Read-Only Editor View */}
      <div className="h-64 opacity-90 pointer-events-none relative"> 
        <Editor 
          height="100%" 
          defaultLanguage="python" 
          value={frame.code} 
          theme="vs-light" 
          options={{ 
            minimap: { enabled: false }, 
            readOnly: true, 
            lineNumbers: "off",
            folding: false,
            scrollBeyondLastLine: false
          }}
        />
      </div>
    </div>
  );
};
export default function InterviewPage() {
  const {
    stage,
    currentQuestion,
    lastFeedback,
    performanceMetrics,
    history,
    loading,
    error,
    startInterview,
    submitAnswer,
    onResumeReady,
    resumeParsed,
    finalDecision,
    endInterview,
    reportViolation,
    sessionId,
    resumeSession,
    fetchHint
  } = useInterview();
const { isListening, startListening, stopListening, transcriptBuffer, error: speechError, isSupported } = useWebSpeech();
  const { token } = useAuth();
  const [answer, setAnswer] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [roadmapTitle, setRoadmapTitle] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("");
const [spaceComplexity, setSpaceComplexity] = useState("");
const [codeOutput, setCodeOutput] = useState<string | null>(null);
const [codeStatus, setCodeStatus] = useState<"idle" | "running" | "success" | "error">("idle");
const [executionResult, setExecutionResult] = useState<any>(null); // Store Piston result here
const [currentRound, setCurrentRound] = useState<string>("screening");
const [roundProgress, setRoundProgress] = useState<any>(null);
const [isProbeQuestion, setIsProbeQuestion] = useState(false);
const [showRoundModal, setShowRoundModal] = useState(false);
  const [nextRoundName, setNextRoundName] = useState("");
  const [whiteboardElements, setWhiteboardElements] = useState<any[]>([]);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
const allTestsPassed =
  executionResult?.summary &&
  executionResult.summary.passed === executionResult.summary.total;

  // Violation state (UI)
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [terminatedByViolation, setTerminatedByViolation] = useState(false);
  const [violationReason, setViolationReason] = useState<string | null>(null);
  
const [roadmap, setRoadmap] = useState<any>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  // Camera refs/state: separate preview and proctor video elements
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const proctorVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null); // for reference capture
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inFlightRef = useRef(false);
const whiteboardElementsRef = useRef<readonly unknown[]>([]);

  const [cameraActive, setCameraActive] = useState(false);
  // referenceImage is now the source of truth for successful client-side capture
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // 📸 NEW: Explicit status for client-side image capture and validation
  const [imageStatus, setImageStatus] = useState<"pending" | "capturing" | "captured" | "error">("pending");
// Text-to-Speech state
 const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [autoReadQuestions, setAutoReadQuestions] = useState(true);
  const speechQueueRef = useRef<string[]>([]);
 const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraPermissionRequested, setCameraPermissionRequested] = useState(false);

const normalizeVerdict = (v?: string) => {
  if (!v) return "pending";
  return v.toLowerCase();
};

  // Prefer a single API base env var (fallbacks supported)
  const API =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_AI_URL || "";

  // Fullscreen enforcement state
  const [fullscreenPromptVisible, setFullscreenPromptVisible] = useState(false);
  const [reenterPromptVisible, setReenterPromptVisible] = useState(false);
  const [needsFullscreen, setNeedsFullscreen] = useState(true);
  const startAttemptRef = useRef(false); // Used to prevent duplicate handleStart calls
const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  // Countdown for re-enter modal
  const [countdown, setCountdown] = useState<number>(30);
  const countdownTimerRef = useRef<number | null>(null);

  // Confirmation modal for starting a new interview
  const [confirmRestartVisible, setConfirmRestartVisible] = useState(false);

  // Synchronous refs to avoid races when multiple DOM events fire
  const violationRef = useRef(0); // immediate counter
  const endingRef = useRef(false); // prevents duplicate terminations
  interface CodeSnapshot {
  timestamp: number;
  code: string;
  trigger: 'auto' | 'run' | 'paste' | 'initial';
}
  const playbackHistory = useRef<CodeSnapshot[]>([]);
const reinitializeCameraForResume = useCallback(async () => {
  console.log("📹 Re-initializing camera after session resume...");
  
  try {
    // Initialize proctor video stream
    if (proctorVideoRef.current && !proctorVideoRef.current.srcObject) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      
      proctorVideoRef.current.srcObject = stream;
      proctorVideoRef.current.muted = true;
      proctorVideoRef.current.playsInline = true;
      
      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (proctorVideoRef.current && proctorVideoRef.current.readyState >= 2) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
      
      await proctorVideoRef.current.play().catch(() => {});
      
      setCameraActive(true);
      setImageStatus("captured"); // Mark as ready since we're resuming
      
      console.log("✅ Camera re-initialized successfully");
    }
  } catch (err) {
    console.error("❌ Failed to re-initialize camera:", err);
    setCameraError("Camera failed to restart. Please refresh the page.");
  }
}, []);
const captureSnapshot = useCallback((trigger: CodeSnapshot['trigger']) => {
    // Only capture for code questions
    if (currentQuestion?.expectedAnswerType !== "code") return;

    // Avoid duplicates for auto-timer to save memory
    const currentCode = answer; 
    const lastCode = playbackHistory.current[playbackHistory.current.length - 1]?.code;

    if (trigger === 'auto' && (!currentCode || currentCode === lastCode)) return;

    playbackHistory.current.push({
      timestamp: Date.now(),
      code: currentCode, 
      trigger
    });
    
    // Debug log
    if (trigger !== 'auto') {
        console.log(`📹 Snapshot [${trigger}]: ${playbackHistory.current.length} frames`);
    }
  }, [answer, currentQuestion]);
useEffect(() => {
  // Attempt resume if logged in, idle, and no session active yet
  if (token && stage === "idle" && !sessionId && !loading) {
    const savedId = localStorage.getItem("active_interview_session");
    if (savedId) {
      console.log("🔄 Attempting to resume session:", savedId);
      
      resumeSession(savedId)
        .then(() => {
          console.log("✅ Session resumed successfully");
          // ❌ DON'T call reinitializeCameraForResume here!
          // Camera will be initialized by the effect below when stage becomes "running"
        })
        .catch((err) => {
          console.error("❌ Session resume failed:", err);
          localStorage.removeItem("active_interview_session");
        });
    }
  }
}, [token, stage, sessionId, resumeSession, loading]);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stage === "running" && currentQuestion?.expectedAnswerType === "code") {
      interval = setInterval(() => {
        captureSnapshot('auto');
      }, 5000); // Snapshot every 5 seconds
    }
    return () => { if (interval) clearInterval(interval); };
  }, [stage, currentQuestion, captureSnapshot]);

  // 2. Reset on New Question
  useEffect(() => {
    playbackHistory.current = [];
    if (currentQuestion?.expectedAnswerType === "code") {
       // Capture initial state after a brief delay to ensure answer is populated
       setTimeout(() => captureSnapshot('initial'), 200);
    }
  }, [currentQuestion?.questionId]);

  // 3. Handle Paste Events (Anti-Cheat)
  const handleEditorDidMount = (editor: any) => {
    editor.onDidPaste(() => {
        console.warn("⚠️ Paste detected in editor");
        captureSnapshot('paste');
    });
  };

  /* -------------------------
      Helper: stop camera stream
      ------------------------- */
  const stopCamera = useCallback(() => {
    try {
      // stop both video elements if they have streams
      [previewVideoRef.current, proctorVideoRef.current].forEach((videoEl) => {
        if (videoEl && videoEl.srcObject) {
          const stream = videoEl.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          videoEl.srcObject = null;
        }
      });
      setCameraActive(false);
      // NOTE: Do NOT clear referenceImage/imageStatus here if the user is just stopping preview.
      // We only clear it on error or successful endInterview.
      console.log("Camera streams stopped.");
    } catch (e) {
      console.warn("stopCamera error:", e);
    }
  }, []);
  // Add this new function near your other camera helpers
const fetchRoadmap = useCallback(async () => {
  // Prevent duplicate fetches or fetching if missing auth
  if (!sessionId || !token || roadmap || loadingRoadmap) return;
  
  setLoadingRoadmap(true);
  
  try {
    console.log("🗺️ Fetching AI Roadmap...");

    const res = await fetch(`${API}/interview/roadmap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId }),
    });

    const data = await res.json();

    if (data.roadmap) {
      setRoadmap(data.roadmap);
      // 👇 SUCCESS: This captures the tier (e.g. "Advanced Mastery Plan")
      setRoadmapTitle(data.plan_type || "Personalized Roadmap");
    }
  } catch (err) {
    console.error("❌ Failed to fetch roadmap:", err);
  } finally {
    setLoadingRoadmap(false);
  }
}, [sessionId, token, API, roadmap, loadingRoadmap]);
  
// --------------------- Helper: normalize testcases ---------------------
const buildTestCasesFromChallenge = (challenge: any) => {
  const candidateLists = [
    challenge?.test_cases,
    challenge?.tests,
    challenge?.cases,
    (challenge?.examples || []).map((ex: any) => ({ 
      input: ex.input, 
      expected: ex.output 
    })),
  ].filter(Boolean);

  let rawCases: any[] = [];
  for (const c of candidateLists) {
    if (Array.isArray(c) && c.length > 0) {
      rawCases = c;
      break;
    }
  }

  // Fallback: single test case from legacy fields
  if (rawCases.length === 0 && (challenge?.test_case_input || challenge?.test_case)) {
    rawCases.push({
      input: challenge?.test_case_input ?? challenge?.test_case,
      expected: challenge?.expected_output ?? challenge?.expected ?? "",
    });
  }

  // Last resort: empty test (prevents crash)
  if (rawCases.length === 0) {
    rawCases.push({ input: "[]", expected: "" });
  }

  // Normalize to strings
  const normalized = rawCases.map((tc: any) => {
    let inputStr: string;
    const inVal = tc.input ?? tc.stdin ?? "";
    
    if (typeof inVal === "object") {
      try { 
        inputStr = JSON.stringify(inVal); 
      } catch { 
        inputStr = String(inVal); 
      }
    } else {
      inputStr = String(inVal);
    }

    let expectedStr: string;
    const expVal = tc.expected ?? tc.expected_output ?? tc.output ?? "";
    
    if (typeof expVal === "object") {
      try { 
        expectedStr = JSON.stringify(expVal); 
      } catch { 
        expectedStr = String(expVal); 
      }
    } else {
      expectedStr = String(expVal);
    }

    return { 
      input: inputStr, 
      expected: expectedStr 
    };
  });

  return normalized;
};
useEffect(() => {
     setHint(null);
  }, [currentQuestion?.questionId]);
// --------------------- Replace existing handleRunCode with this ---------------------
// paste this whole function to replace your existing handleRunCode
const handleRunCode = async () => {
  console.log("🔍 handleRunCode called");
  console.trace();
  captureSnapshot('run');

  const codeToRun = answer.trim();
  if (!codeToRun) return;

  const challenge =
    currentQuestion?.coding_challenge ||
    currentQuestion?.raw?.coding_challenge ||
    {};

  const testsToRun = buildTestCasesFromChallenge(challenge);

  console.log("📦 Sending", testsToRun.length, "test cases in ONE request");

  setCodeStatus("running");
  setCodeOutput(null);
  setExecutionResult(null);

  try {
    const payload = {
      language: (challenge.language || "python").toLowerCase(),
      code: codeToRun,
      test_cases: testsToRun,
    };

    const res = await fetch(`${API}/run-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("📥 Raw backend response:", JSON.stringify(data, null, 2));

    /**
     * ✅ CORRECT INTERPRETATION
     * Backend structure:
     * data.results[0].raw.results   -> actual per-test results
     * data.results[0].raw.all_passed -> FINAL truth
     */

    const outer = data?.results?.[0];
    const raw = outer?.raw;

    const rawResults = Array.isArray(raw?.results) ? raw.results : [];

    const normalizedCases = rawResults.map((r: any, i: number) => ({
      index: i,
      input: r.input ?? "",
      expected: r.expected ?? "",
      output: r.stdout ?? "(no output)",
      success: r.passed === true,
    }));

    const allPassed = raw?.all_passed === true;

    setExecutionResult({
      cases: normalizedCases,
      summary: {
        total: normalizedCases.length,
        passed: normalizedCases.filter(c => c.success).length,
      },
    });

    setCodeStatus(allPassed ? "success" : "error");

    setCodeOutput(
      normalizedCases
        .map(
          c =>
            `Test ${c.index + 1}: ${c.success ? "✅ PASSED" : "❌ FAILED"}\n` +
            `Input: ${c.input}\n` +
            `Expected: ${c.expected}\n` +
            `Got: ${c.output}`
        )
        .join("\n\n")
    );
  } catch (err: any) {
    console.error("❌ Run code error:", err);
    setCodeStatus("error");
    setCodeOutput(`Network error: ${err.message}`);
    setExecutionResult(null);
  }
};

  /* -------------------------
      Violation wrapper (unchanged behavior)
      ------------------------- */
const VIOLATION_THRESHOLD = 1000;

const reportViolationWrapper = useCallback(
  async (reason: string, isTerminal: boolean = false) => {
    // prevent doing anything if we've already ended
    if (endingRef.current) return;

    // optimistic increment of the client-side counter (still update from server next)
    violationRef.current += 1;
    setViolationCount(violationRef.current);
    setViolationReason(reason);

    // compute intended action to send to server (server ultimately decides)
    const intendedAction: "warning" | "terminate" =
      isTerminal || violationRef.current >= VIOLATION_THRESHOLD ? "terminate" : "warning";

    console.warn(
      `[VIOLATION - client] reason=${reason} localCount=${violationRef.current} sendAction=${intendedAction}`
    );

    let serverResp: any = null;
    try {
      serverResp = await reportViolation(reason, intendedAction, sessionId);
      console.info("[VIOLATION] serverResp:", serverResp);
    } catch (err) {
      console.error("Error reporting violation to server:", err);
    }

    // reconcile local counter with server (if available)
    const serverCount =
      serverResp && typeof serverResp.violationCount === "number"
        ? serverResp.violationCount
        : null;

    if (serverCount !== null) {
      violationRef.current = serverCount;
      setViolationCount(serverCount);
    }

    const serverTerminated = !!(serverResp && serverResp.terminated);

    // Decide whether to terminate locally:
    const shouldTerminateLocally =
      serverTerminated ||
      (serverCount !== null ? serverCount >= VIOLATION_THRESHOLD : intendedAction === "terminate");

    if (shouldTerminateLocally) {
      if (endingRef.current) return;
      endingRef.current = true;

      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      setTerminatedByViolation(true);
      setReenterPromptVisible(false);
      stopCamera();

      try {
        console.warn(`[VIOLATION] terminating interview (reason=${reason})`);
        const endReason =
          serverResp?.message ||
          serverResp?.endedReason ||
          `Interview terminated due to multiple integrity violations: ${reason}`;

        await endInterview?.(endReason, true);
      } catch (e) {
        console.error("Error ending interview after termination:", e);
      }

      return;
    }

    // If not terminating: show re-enter UI and start countdown
    setShowViolationWarning(true);
    setReenterPromptVisible(true);
    setCountdown(30);

    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    const localCountSnapshot = violationRef.current;
    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            window.clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          (async () => {
            try {
              if (!endingRef.current) {
                await reportViolationWrapper(
                  `Fullscreen not re-entered within 30 seconds (Violation Count: ${localCountSnapshot + 1})`,
                  true
                );
              }
            } catch (e) {
              console.error("Error auto-escalating violation on countdown end:", e);
            }
          })();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  },
  [reportViolation, sessionId, endInterview, stopCamera]
);

  useEffect(() => {
    if (resumeParsed) console.log("Resume is ready:", resumeParsed);
  }, [resumeParsed]);

  /* --------------------------------------------------------------------------
      Reference capture (client-side quality checks only)
      - Sets referenceImage state on client-side success
      -------------------------------------------------------------------------- */
const MIN_IMAGE_LENGTH = 10000;

const captureReferenceImage = useCallback(async () => {
  setImageStatus("capturing");
  setCameraError(null);
  
  const MAX_RETRIES = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const videoEl = previewVideoRef.current;
      const canvas = previewCanvasRef.current;

      if (!videoEl || !canvas) {
        throw new Error("Video/canvas not available");
      }

      // Ensure fresh stream
      if (!videoEl.srcObject || attempt > 1) {
        const existingStream = videoEl.srcObject as MediaStream;
        if (existingStream) {
          existingStream.getTracks().forEach(t => t.stop());
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: false,
        });
        
        videoEl.srcObject = stream;
        videoEl.muted = true;
        videoEl.playsInline = true;
      }

      // Wait for ready state
      const maxWaitMs = 5000;
      const pollInterval = 100;
      let waited = 0;
      
      while ((videoEl.readyState || 0) < 2 && waited < maxWaitMs) {
        await new Promise((r) => setTimeout(r, pollInterval));
        waited += pollInterval;
      }

      try {
        await videoEl.play();
      } catch (playErr) {
        console.warn("Autoplay blocked:", playErr);
      }

      // CRITICAL: Wait longer for stable frame
      await new Promise((r) => setTimeout(r, 1000));

      if (!videoEl.videoWidth || !videoEl.videoHeight) {
        throw new Error(`No video frames (attempt ${attempt}/${MAX_RETRIES})`);
      }

      const ctx = canvas.getContext("2d");
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      
      if (!ctx) throw new Error("Canvas context unavailable");
      
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      // Get image
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.90); // Higher quality
      
      if (!imageDataUrl || imageDataUrl.length < 10000) {
        throw new Error(`Image too small: ${imageDataUrl?.length} bytes`);
      }

      // Analyze quality
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let sum = 0;
      const sampleLimit = Math.min(data.length, 50000);
      
      for (let i = 0; i < sampleLimit; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        sum += (0.299 * r + 0.587 * g + 0.114 * b);
      }
      
      const averageBrightness = sum / (sampleLimit / 4);
      
      // RELAXED thresholds
      if (averageBrightness < 25) {
        throw new Error(`Too dark (${averageBrightness.toFixed(1)}). Turn on lights and retry.`);
      }
      if (averageBrightness > 240) {
        throw new Error(`Too bright (${averageBrightness.toFixed(1)}). Reduce backlight.`);
      }

      // Variance check
      let mean = 0;
      const luminances: number[] = [];
      
      for (let i = 0; i < sampleLimit; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        luminances.push(lum);
        mean += lum;
      }
      
      mean = mean / luminances.length;
      let variance = 0;
      
      for (const lum of luminances) {
        variance += (lum - mean) ** 2;
      }
      
      variance = variance / luminances.length;

      // RELAXED variance threshold
      if (variance < 150) {
        throw new Error(`Low contrast (${variance.toFixed(1)}). Ensure clear face visibility.`);
      }

      // Basic face detection heuristic (fallback if API unavailable)
      let faceDetected = false;
      
      try {
        const FaceDetector = (window as any).FaceDetector;
        if (typeof FaceDetector === "function") {
          const detector = new FaceDetector();
          const faces = await detector.detect(canvas as any);
          faceDetected = !!(faces && faces.length > 0);
        } else {
          // Heuristic: check for skin-like pixels in center
          const cx = Math.floor(canvas.width / 2);
          const cy = Math.floor(canvas.height / 2);
          const boxW = Math.floor(canvas.width * 0.4);
          const boxH = Math.floor(canvas.height * 0.4);
          
          let skinLike = 0, samples = 0;
          const sx = Math.max(0, cx - Math.floor(boxW / 2));
          const sy = Math.max(0, cy - Math.floor(boxH / 2));
          
          for (let y = sy; y < sy + boxH; y += 8) {
            for (let x = sx; x < sx + boxW; x += 8) {
              const idx = (y * canvas.width + x) * 4;
              const r = data[idx], g = data[idx + 1], b = data[idx + 2];
              
              if (r > 95 && g > 40 && b > 20 && r > g && r > b) {
                skinLike++;
              }
              samples++;
            }
          }
          
          faceDetected = samples > 0 && (skinLike / samples) > 0.06; // Relaxed from 0.08
        }
      } catch (detErr) {
        console.warn("Face detection attempt failed:", detErr);
        // DON'T fail here - let backend handle it
        faceDetected = true;
      }

      if (!faceDetected) {
        throw new Error("No face detected. Center your face and try again.");
      }

      // SUCCESS
      setCameraActive(true);
      setReferenceImage(imageDataUrl);
      setImageStatus("captured");
      
      console.info(`✅ Reference image captured (attempt ${attempt}): ${imageDataUrl.length} bytes`);
      return imageDataUrl;

    } catch (err: any) {
      lastError = err;
      console.warn(`Capture attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
      
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 500)); // Brief pause before retry
      }
    }
  }

  // All retries failed
  console.error("All capture attempts failed:", lastError);
  
  setCameraActive(false);
  setReferenceImage(null);
 

  const errorMessage = lastError?.message || "Camera capture failed after multiple attempts";
  setCameraError(errorMessage);
  setImageStatus("error");
  
  throw lastError;
}, []);


  /* -------------------------
      Proctor capture (uses proctorVideoRef & captureCanvasRef)
      - returns dataURL or null (unchanged)
      ------------------------- */
const captureFrameToDataUrl = useCallback(async (): Promise<string | null> => {
  const video = proctorVideoRef.current;
  const canvas = captureCanvasRef.current;
if (!video || !canvas || video.readyState < 2) {
      return null;
    }
  // Wait for a frame
  const maxWait = 1500;
  const step = 100;
  let waited = 0;
  while ((video.readyState || 0) < 2 && waited < maxWait) {
    await new Promise((r) => setTimeout(r, step));
    waited += step;
  }

  if (!video.videoWidth || !video.videoHeight) {
    console.debug("captureFrameToDataUrl: video not ready (width/height = 0)");
    return null;
  }

const w = video.videoWidth; 
  const h = video.videoHeight;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  try {
    ctx.save();
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    if (!dataUrl || typeof dataUrl !== "string") return null;
    return dataUrl;
  } catch (err) {
    console.warn("captureFrameToDataUrl error:", err);
    return null;
  }
}, []);


  /* -------------------------
      Proctoring effect (interval + warmup) (unchanged)
      ------------------------- */
// ----------------- PROCTORING useEffect (minimal change) -----------------
// ----------------- PROCTORING useEffect (UPDATED) -----------------
useEffect(() => {
  let proctorInterval: number | null = null;

  // CRITICAL: Stop proctoring if interview is not running
  if (stage !== "running" || !cameraActive || !token) {
    console.log(`🛑 Proctoring stopped: stage=${stage}, camera=${cameraActive}, token=${!!token}`);
    return () => {
      if (proctorInterval) {
        window.clearInterval(proctorInterval);
        proctorInterval = null;
      }
    };
  }

  // Keep the same frame validator locally
  const isValidFrame = (dataUrl: string | null): boolean => {
    if (!dataUrl || typeof dataUrl !== "string") return false;
    if (dataUrl.length < 500) {
      console.warn(`[Frame Validation] Too short (${dataUrl?.length}) — rejecting.`);
      return false;
    }
    if (!dataUrl.startsWith("data:image/")) {
      console.warn(`[Frame Validation] Missing data:image prefix. Start: ${String(dataUrl).substring(0,36)}`);
      return false;
    }
    const re = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/]+=*$/i;
    if (!re.test(dataUrl)) {
      console.warn(`[Frame Validation] Regex mismatch. Start: ${String(dataUrl).substring(0,64)}`);
      return false;
    }
    return true;
  };

  // sendProctorPayload: only send valid frames
  const sendProctorPayload = async (payload: { sessionId: string; image: string | null }) => {
    try {
      // CRITICAL CHECK: Don't send if image is invalid
      if (!payload.image || !isValidFrame(payload.image)) {
        console.warn("[proctor] Skipping send - invalid frame");
        return { ok: false, skipReason: "invalid_frame" };
      }

      console.debug("[proctor -> server] sending image sample:", String(payload.image).substring(0, 80), "len=", String(payload.image).length);

      const res = await fetch(`${API || ""}/interview/proctor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: payload.sessionId,
          image: payload.image,
        }),
      });

      const j = await res.json().catch(() => null);
      const hasError = !res.ok || j?.verified === false || j?.status === "failed";

      if (hasError) {
        const violationReason = j?.error || j?.reason || j?.detail || "Face verification failed";
        console.warn(`[PROCTOR VIOLATION detected] Reason: ${violationReason}`);
        reportViolationWrapper(violationReason, false);
      } else if (j?.status === "success" || j?.verified === true) {
        if (showViolationWarning) setShowViolationWarning(false);
      }

      return { ok: res.ok, statusCode: res.status, body: j };
    } catch (err) {
      console.warn("proctor POST failed:", err);
      return { ok: false, error: err };
    }
  };

const warmupAndStart = async () => {
  if (!sessionId) {
    console.debug("proctor warmup: sessionId missing, skipping warmup POST.");
    return;
  }

  // ADDED: Verify interview is still active
  if (stage !== "running") {
    console.log("🛑 Interview not running - skipping proctor warmup");
    return;
  }

  try {
    // ✅ CRITICAL FIX: Always ensure video has a stream before capturing
    if (proctorVideoRef.current && !proctorVideoRef.current.srcObject) {
      console.log("⚠️ Proctor video has no stream - initializing...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: false,
        });
        proctorVideoRef.current.srcObject = stream;
        proctorVideoRef.current.muted = true;
        proctorVideoRef.current.playsInline = true;
        
        // ✅ WAIT for ready state before capturing
        await new Promise<void>((resolve) => {
          const checkReady = () => {
            if (proctorVideoRef.current && proctorVideoRef.current.readyState >= 2) {
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });
        
        await proctorVideoRef.current.play().catch(() => {});
        console.log("✅ Proctor video stream initialized");
      } catch (gErr) {
        console.error("❌ Failed to initialize proctor video:", gErr);
        return; // Exit warmup if camera fails
      }
    }

    // ✅ Now verify video is actually ready before capturing
    const video = proctorVideoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) {
      console.warn("⚠️ Video not ready yet, skipping warmup capture");
      return;
    }

    const firstFrame = await captureFrameToDataUrl();

    // Only send if we have a valid frame
    if (firstFrame && isValidFrame(firstFrame)) {
      inFlightRef.current = true;
      try {
        await sendProctorPayload({ sessionId, image: firstFrame });
      } finally {
        inFlightRef.current = false;
      }
    } else {
      console.warn("⚠️ Warmup skipped - invalid first frame");
    }
  } catch (e) {
    console.warn("proctor warmup error:", e);
  }

    // interval checks
    proctorInterval = window.setInterval(async () => {
      // CRITICAL: Check if interview is still running
      if (stage !== "running") {
        console.log("🛑 Interview ended - stopping proctor interval");
        if (proctorInterval) {
          window.clearInterval(proctorInterval);
          proctorInterval = null;
        }
        return;
      }

      if (!sessionId) { 
        console.debug("proctor interval: sessionId missing, skipping POST"); 
        return; 
      }
      if (inFlightRef.current) return;
      
      inFlightRef.current = true;
      try {
        const frame = await captureFrameToDataUrl();

        // Only send if frame is valid
        if (frame && isValidFrame(frame)) {
          try {
            await sendProctorPayload({ sessionId, image: frame });
          } catch (err) {
            console.warn("proctor image POST failed:", err);
          }
        } else {
          console.warn("Proctor interval: invalid frame, skipping send");
        }
      } catch (err) {
        console.warn("proctor interval error:", err);
      } finally {
        inFlightRef.current = false;
      }
    }, 6000);
  };

  warmupAndStart();

  return () => {
    if (proctorInterval) {
      console.log("🧹 Cleaning up proctor interval");
      window.clearInterval(proctorInterval);
      proctorInterval = null;
    }
  };
}, [stage, cameraActive, sessionId, token, API, captureFrameToDataUrl, ]);

  /* -------------------------
      Fullscreen helpers (unchanged)
      ------------------------- */
    
  const isFullscreen = useCallback((): boolean => {
    return (
      !!document.fullscreenElement ||
      !!(document as any).webkitFullscreenElement ||
      !!(document as any).mozFullScreenElement ||
      !!(document as any).msFullscreenElement
    );
  }, []);

  const tryRequestFullscreen = useCallback(async (): Promise<boolean> => {
    const element = document.documentElement;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      return isFullscreen();
    } catch (e) {
      console.error("Fullscreen request failed:", e);
      return false;
    }
  }, [isFullscreen]);

  /* --------------------------------------------------------------------------
      Updated handleStart: Captures Image, then immediately calls /interview/start
      - Guarantees capture and check happens ONLY ONCE on the start click.
      - **CRITICAL:** Only proceeds to the backend call if `referenceImage` is available.
      -------------------------------------------------------------------------- */
// REPLACE YOUR handleStart FUNCTION WITH THIS
const handleStart = useCallback(
  async (
    firstArg: string | object | React.MouseEvent | undefined = "Technical Interview",
    difficulty: string = "medium",
    techStack: string = ""
  ) => {
    const jobTitle = typeof firstArg === 'string' ? firstArg : "Technical Interview";
    
    if (!token) return;
    if (startAttemptRef.current) {
      console.warn("Start already in progress");
      return;
    }
    
    startAttemptRef.current = true;
    setCameraError(null);

    let capturedImage: string | null = referenceImage;
    let serverSessionId: string | null = null;

    try {
      // STEP 1: Ensure image is captured
      if (!capturedImage || imageStatus !== "captured") {
        console.log("Capturing reference image...");
        capturedImage = await captureReferenceImage();
      }

      if (!capturedImage) {
        throw new Error("Reference image capture failed unexpectedly");
      }

      // STEP 2: Fullscreen check
      if (needsFullscreen && !isFullscreen()) {
        setFullscreenPromptVisible(true);
        startAttemptRef.current = false;
        return;
      }
      
      setFullscreenPromptVisible(false);

      // 🚨 CRITICAL FIX: Use the FULL CONTEXT if available, otherwise fallback to summary
      // This sends the detailed projects/skills to the AI.
      const richContext = (resumeParsed as any)?.full_context_for_prompt || resumeParsed?.summary || "";

      // STEP 3: Call backend
      const startPayload: any = {
        jobTitle,
        difficulty,
        techStack,
        resume_summary: richContext, // <--- NOW SENDING DETAILED DATA
        allow_pii: false,
        referenceImage: capturedImage,
      };

      const startUrl = `${API || ""}/interview/start`;
      console.log("🚀 Starting interview with RICH CONTEXT payload...");

      const resp = await fetch(startUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(startPayload),
      });

      if (resp.status === 200) {
        const data = await resp.json().catch(() => null);
        serverSessionId = data?.sessionId || data?.session_id || null;

        if (!serverSessionId) {
          throw new Error("No session ID returned");
        }

        console.log("✅ Session created:", serverSessionId);
        localStorage.setItem("active_interview_session", serverSessionId);

if (data?.round_info) {
  setCurrentRound(data.round_info.current || "screening");
  setRoundProgress(data.round_info.progress || null);
}

if (data?.firstQuestion?.is_probe) {
  setIsProbeQuestion(true);
  console.log("🔍 First question is a probe");
} else {
  setIsProbeQuestion(false);
}
        await startInterview?.(
          jobTitle,
          difficulty,
          techStack,
          serverSessionId,
          data?.firstQuestion
        );
        
        setCameraError(null);

        // Start proctor video
        try {
          if (proctorVideoRef.current && !proctorVideoRef.current.srcObject) {
            const pStream = await navigator.mediaDevices.getUserMedia({
              video: { width: 640, height: 360, facingMode: "user" },
              audio: false,
            });
            
            proctorVideoRef.current.srcObject = pStream;
            proctorVideoRef.current.muted = true;
            proctorVideoRef.current.playsInline = true;
            await proctorVideoRef.current.play().catch(() => {});
          }
        } catch (e) {
          console.warn("Proctor video start failed:", e);
        }

        setCameraActive(true);
        
      } else {
        let body;
        try {
          body = await resp.json();
        } catch (e) {
          body = { message: `Server error ${resp.status}` };
        }

        const errorMessage = body.message || body.error || `Failed to start (status ${resp.status})`;
        throw new Error(errorMessage);
      }

    } catch (e: any) {
      console.error("❌ Start error:", e);
      const displayError = e.message || String(e);
      let suggestion = "";
      if (displayError.includes("dark")) suggestion = " Try turning on more lights.";
      else if (displayError.includes("bright")) suggestion = " Try reducing backlight.";
      else if (displayError.includes("face")) suggestion = " Ensure your face is visible.";
      
      setCameraError(displayError + suggestion);
      setImageStatus("error");
      stopCamera();
      
    } finally {
      startAttemptRef.current = false;
    }
  },
  [token, needsFullscreen, isFullscreen, startInterview, captureReferenceImage, 
   referenceImage, resumeParsed, API, stopCamera, imageStatus]
);


  /* -------------------------
      Answer submit handler (unchanged)
      ------------------------- */

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    const isWhiteboard = currentQuestion?.expectedAnswerType === "system_design";

    if ((!answer.trim() && !isWhiteboard) || loading || !currentQuestion) return;

    let finalWhiteboardData: any[] = [];
    let whiteboardImageBase64: string | null = null;

    if (isWhiteboard) {
      // 1. Get JSON Elements
      if (excalidrawAPI && typeof excalidrawAPI.getSceneElements === "function") {
        const allElements = excalidrawAPI.getSceneElements();
        finalWhiteboardData = allElements.filter((el: any) => !el.isDeleted);
        
        // 2. 📸 CAPTURE IMAGE SNAPSHOT
        if (finalWhiteboardData.length > 0) {
          try {
            console.log("📸 Generating whiteboard snapshot...");
            
            // 👇 FIX: Dynamic Import here!
            // This prevents the "window is not defined" error on the server
            const { exportToBlob } = await import("@excalidraw/excalidraw");

            const blob = await exportToBlob({
              elements: finalWhiteboardData,
              mimeType: "image/jpeg",
              appState: {
                ...excalidrawAPI.getAppState(),
                exportWithDarkMode: false,
              },
              files: excalidrawAPI.getFiles(),
            });

            // Convert Blob to Base64 String
            whiteboardImageBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            console.log("✅ Snapshot generated (len: " + whiteboardImageBase64?.length + ")");
          } catch (err) {
            console.error("❌ Failed to generate whiteboard image:", err);
          }
        }
      } else if (whiteboardElementsRef.current && whiteboardElementsRef.current.length > 0) {
        finalWhiteboardData = [...whiteboardElementsRef.current];
      }
    }

    console.log("🚀 Submitting Payload:", {
      question_type: isWhiteboard ? "system_design" : "text",
      whiteboard_count: finalWhiteboardData.length,
      has_snapshot: !!whiteboardImageBase64
    });
if (currentQuestion?.expectedAnswerType === "code") {
        captureSnapshot('auto');
    }
    const payload: any = {
      answer,
      question_type: "text",
      code_execution_result: executionResult,
      whiteboard_elements: finalWhiteboardData,
      whiteboard_snapshot: whiteboardImageBase64, 
      user_time_complexity: timeComplexity,
      user_space_complexity: spaceComplexity,
      playback_history: playbackHistory.current
    };

    if (currentQuestion.expectedAnswerType === "code") {
      payload.question_type = "code";
    } else if (isWhiteboard) {
      payload.question_type = "system_design";
    }

    try {
      const result = await submitAnswer(payload, currentQuestion.questionId);
      
      setAnswer("");
      setCodeOutput(null);
      setExecutionResult(null);
      setTimeComplexity("");
      setSpaceComplexity("");
      setWhiteboardElements([]);
      if (excalidrawAPI) {
        excalidrawAPI.resetScene();
      }

      const newRoundData = result?.round_info || result?.metadata;
      const incomingRound = newRoundData?.current || newRoundData?.current_round;

      if (incomingRound && incomingRound !== currentRound && incomingRound !== "complete" && result?.nextQuestion) {
        setNextRoundName(incomingRound);
        setShowRoundModal(true);
        if (newRoundData.progress) setRoundProgress(newRoundData.progress);
        return;
      }

      if (newRoundData) {
        setCurrentRound(incomingRound || currentRound);
        if (newRoundData.progress) setRoundProgress(newRoundData.progress);
      }
    } catch (e) {
      console.error("Submit error:", e);
    }
  };
  // Helper for the modal button
  const handleNextRound = () => {
      setShowRoundModal(false);
      setCurrentRound(nextRoundName); // Update badge to new round
  };
  /* -------------------------
      Cleanup effect (unmount) (unchanged)
      ------------------------- */
useEffect(() => {
  return () => {
    cameraInitAttempted.current = false; // ✅ Reset for next mount
    stopCamera();
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };
}, [stopCamera]);
  /* ========================
    🎤 ENHANCED TEXT-TO-SPEECH SYSTEM
    ======================== */

// Load available voices
useEffect(() => {
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      setAvailableVoices(voices);
      
      // Auto-select best English voice
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && v.name.includes('Google')
      ) || voices.find(v => v.lang.startsWith('en'));
      
      if (preferredVoice) setSelectedVoice(preferredVoice);
    }
  };

  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;

  return () => {
    window.speechSynthesis.onvoiceschanged = null;
  };
}, []);

// Core TTS function with queue support
// ✅ STABLE SPEAK FUNCTION
const speakText = useCallback((text: string, priority: boolean = false) => {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

  // 1. Force Stop if Priority (User clicked a button)
  if (priority) {
    window.speechSynthesis.cancel();
    speechQueueRef.current = [];
  }

  // 2. Queue if already speaking (Automatic flow)
  // This ensures Feedback waits for Question to finish
  if (!priority && window.speechSynthesis.speaking) {
    speechQueueRef.current.push(text);
    return;
  }

  // 3. Clean Text
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'code block')
    .replace(/[*#`]/g, '')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = speechRate;
  utterance.pitch = 1;
  utterance.volume = 1;
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // 4. Handle Events
  utterance.onstart = () => {
    setIsSpeaking(true);
    setIsPaused(false);
  };

  utterance.onend = () => {
    setIsSpeaking(false);
    setIsPaused(false);
    
    // Process next item in queue
    if (speechQueueRef.current.length > 0) {
      const next = speechQueueRef.current.shift();
      if (next) {
        setTimeout(() => speakText(next, false), 250);
      }
    }
  };

  utterance.onerror = (e) => {
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
      console.warn('Speech error:', e);
    }
    setIsSpeaking(false);
  };

  speechSynthesisRef.current = utterance;
  window.speechSynthesis.speak(utterance);

}, [speechRate, selectedVoice]); // ❌ NO 'isSpeaking' dependency

const pauseSpeaking = useCallback(() => {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    setIsPaused(true);
  }
}, []);

const resumeSpeaking = useCallback(() => {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    setIsPaused(false);
  }
}, []);

const stopSpeaking = useCallback(() => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    speechQueueRef.current = [];
  }
}, []);

const toggleSpeak = useCallback(() => {
  if (isSpeaking) {
    if (isPaused) {
      resumeSpeaking();
    } else {
      pauseSpeaking();
    }
  } else if (currentQuestion?.questionText) {
    speakText(currentQuestion.questionText, true);
  }
}, [isSpeaking, isPaused, currentQuestion, speakText, pauseSpeaking, resumeSpeaking]);

// Auto-speak questions when they appear
useEffect(() => {
  if (currentQuestion?.questionText && stage === "running" && autoReadQuestions) {
    const timer = setTimeout(() => {
      speakText(currentQuestion.questionText, true);
    }, 800);
    return () => clearTimeout(timer);
  }
}, [currentQuestion?.questionId, stage, autoReadQuestions, speakText]);
// Cleanup TTS when stage changes or unmount
useEffect(() => {
  // Stop speaking when interview ends or changes stage
  if (stage === "done" || stage === "idle") {
    stopSpeaking();
  }
  
  return () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };
}, [stage, stopSpeaking]);
// Auto-speak AI Mentor feedback when it appears

useEffect(() => {
  if (lastFeedback && stage === "running" && autoReadQuestions) {
    // Wait 1.5s to ensure the Question has started reading first.
    // This allows speakText to see "speaking=true" and queue this correctly.
    const timer = setTimeout(() => {
      speakText(lastFeedback, false); 
    }, 1500); 

    return () => clearTimeout(timer);
  }
}, [lastFeedback]); // ✅ Only runs when feedback content changes
// Cleanup on unmount
useEffect(() => {
  return () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };
}, []);

/* ========================
    🎙️ ENHANCED SPEECH-TO-TEXT 
    ======================== */
const handleMicToggleEnhanced = useCallback(() => {
  if (isListening) {
    // --- STOPPING THE MIC ---
    stopListening();

    // It is safe to speak here because we just stopped the mic
    if (transcriptBuffer && transcriptBuffer.trim().length > 0) {
      const wordCount = transcriptBuffer.trim().split(/\s+/).length;
      speakText(`Captured ${wordCount} word${wordCount !== 1 ? 's' : ''}`, false);
    }
  } else {
    // --- STARTING THE MIC ---
    
    // 1. HARD STOP any current speech. 
    // If the computer is talking, the browser might block the microphone.
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    stopSpeaking(); // Updates your React state to 'not speaking'
    
    // 2. Start Listening
    startListening((newSentence) => {
      setAnswer((prev) => {
        const cleaned = prev.trim();
        // Add proper spacing and punctuation automatically
        const separator = cleaned.length > 0 ? 
          (cleaned.endsWith('.') || cleaned.endsWith('!') || cleaned.endsWith('?') ? ' ' : '. ') : 
          '';
        return cleaned + separator + newSentence;
      });
    });
    
    // ❌ REMOVED: speakText("Listening now", false); 
    // This line was causing the "start and end simultaneously" bug.
  }
}, [isListening, stopListening, startListening, transcriptBuffer, stopSpeaking, speakText]);

const handleMicToggle = handleMicToggleEnhanced;
useEffect(() => {
  if (stage !== "running") return;

  const handleKeyPress = (e: KeyboardEvent) => {
    // Space bar to toggle mic (when not typing in textarea)
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      handleMicToggle();
    }
    
    // ESC to stop recording
    if (e.code === 'Escape' && isListening) {
      stopListening();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [stage, isListening, handleMicToggle, stopListening]);
  /* -------------------------
      Fullscreen and Window Event Handlers (unchanged)
      ------------------------- */
      const EliminationModal = () => {
  if (!terminatedByViolation || stage !== "running") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-xl w-full bg-white rounded-xl p-8 shadow-lg">
        <div className="text-center">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={40} className="text-rose-600" />
          </div>
          
          <h3 className="text-2xl font-bold mb-2 text-slate-900">
            Interview Ended
          </h3>
          
          <p className="text-slate-600 mb-4">
            {violationReason || cameraError || "The interview has been terminated due to multiple integrity violations."}
          </p>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-rose-800">
              <strong>Violation Count:</strong> {violationCount}
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              window.location.reload();
            }}
            className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-bold"
          >
            Return to Start
          </button>
        </div>
      </div>
    </div>
  );
};
/* ========================
    🎛️ VOICE SETTINGS MODAL
    ======================== */
const VoiceSettingsModal = () => {
  if (!showVoiceSettings) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in fade-in">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Settings size={20} />
              Voice Settings
            </h3>
            <button
              onClick={() => setShowVoiceSettings(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Auto-read toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">
              Auto-read questions
            </label>
            <button
              onClick={() => setAutoReadQuestions(!autoReadQuestions)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoReadQuestions ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoReadQuestions ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {/* Auto-read feedback toggle */}
<div className="flex items-center justify-between">
  <label className="text-sm font-bold text-slate-700">
    Read AI feedback aloud
  </label>
  <button
    onClick={() => setAutoReadQuestions(!autoReadQuestions)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      autoReadQuestions ? 'bg-indigo-600' : 'bg-slate-300'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        autoReadQuestions ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
</div>


          {/* Speech rate */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">
              Speech Rate: {speechRate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Voice selection */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">
              Voice Selection
            </label>
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const voice = availableVoices.find(v => v.name === e.target.value);
                if (voice) setSelectedVoice(voice);
              }}
              className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
            >
              {availableVoices
                .filter(v => v.lang.startsWith('en'))
                .map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
            </select>
          </div>

          {/* Test button */}
          <button
            onClick={() => speakText("This is a test of the selected voice and speed", true)}
            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
          >
            Test Voice
          </button>
        </div>
      </div>
    </div>
  );
};
const RoundTransitionModal = () => {
  if (!showRoundModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-2xl text-center animate-in fade-in zoom-in">
        
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
          <CheckCircle size={40} className="text-indigo-600" />
        </div>

        <h3 className="text-2xl font-black text-slate-900 mb-2">
          {currentRound.toUpperCase()} Round Completed 🎉
        </h3>

        <p className="text-slate-600 mb-6">
          Great work! Click below to continue to the{" "}
          <span className="font-bold capitalize">{nextRoundName}</span> round.
        </p>

        <button
          onClick={handleNextRound}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition"
        >
          Start {nextRoundName} Round
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};


  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (stage === "running" && !endingRef.current) {
        event.preventDefault();
        event.returnValue = "";
        reportViolationWrapper("Attempted page refresh or closing tab.", true);
      }
    },
    [stage, reportViolationWrapper]
  );
const handleExcalidrawChange = useCallback((elements: readonly any[]) => {
  const activeElements = elements.filter((el) => !el.isDeleted);
  // Store in ref without triggering re-renders
  whiteboardElementsRef.current = activeElements;
  console.log(`📝 Whiteboard updated: ${activeElements.length} elements`);
}, []);

const handleExcalidrawAPI = useCallback((api: any) => {
  if (api) {
    console.log("✅ Excalidraw API linked successfully");
    setExcalidrawAPI(api);
  }
}, []);
  const handleVisibilityChange = useCallback(() => {
    if (stage === "running" && document.visibilityState === "hidden") {
      reportViolationWrapper("Switched to another tab or minimized window.");
    }
    if (
      stage === "running" &&
      document.visibilityState === "visible" &&
      reenterPromptVisible &&
      needsFullscreen &&
      !isFullscreen()
    ) {
      tryRequestFullscreen();
    }
  }, [
    stage,
    reportViolationWrapper,
    reenterPromptVisible,
    needsFullscreen,
    tryRequestFullscreen,
    isFullscreen,
  ]);

  const handleFullscreenChange = useCallback(() => {
    if (stage !== "running" || !needsFullscreen) return;

    if (!isFullscreen() && !reenterPromptVisible && !endingRef.current) {
      reportViolationWrapper("Exited fullscreen mode.");
    } else if (isFullscreen() && reenterPromptVisible) {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setReenterPromptVisible(false);
      setShowViolationWarning(false);
      setCountdown(30);
    }
  }, [
    stage,
    needsFullscreen,
    isFullscreen,
    reenterPromptVisible,
    reportViolationWrapper,
  ]);

  useEffect(() => {
    if (stage === "running" && needsFullscreen) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("msfullscreenchange", handleFullscreenChange);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, [
    stage,
    needsFullscreen,
    handleBeforeUnload,
    handleVisibilityChange,
    handleFullscreenChange,
  ]);

  /* --------------------------------------------------------------------------
      Auto-capture reference image when ready (only on idle)
      -------------------------------------------------------------------------- */
 const autoCaptureDoneRef = useRef(false);
// ✅ NEW: Initialize camera when stage transitions to "running" (after resume)
const cameraInitAttempted = useRef(false);

// ✅ ROBUST CAMERA INIT FIX
useEffect(() => {
  let retryTimeout: NodeJS.Timeout;

  const tryInitCamera = async () => {
    // If we are not running or already active, stop.
    if (stage !== "running" || cameraActive) return;

    // If the video ref is missing, wait 500ms and try again (Fixes the race condition)
    if (!proctorVideoRef.current) {
      console.log("⏳ Video element not ready, retrying in 500ms...");
      retryTimeout = setTimeout(tryInitCamera, 500);
      return;
    }

    if (cameraInitAttempted.current) return;
    cameraInitAttempted.current = true;

    console.log("📹 Initializing camera for resumed session...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });

      if (proctorVideoRef.current) {
        proctorVideoRef.current.srcObject = stream;
        proctorVideoRef.current.muted = true;
        proctorVideoRef.current.playsInline = true;

        // Robust wait for video ready state
        let waited = 0;
        while (proctorVideoRef.current.readyState < 2 && waited < 5000) {
          await new Promise((r) => setTimeout(r, 100));
          waited += 100;
        }

        await proctorVideoRef.current.play().catch((e) => console.warn("Autoplay blocked", e));

        setCameraActive(true);
        setImageStatus("captured");
        console.log("✅ Camera ready for resumed interview");
      }
    } catch (err: any) {
      console.error("❌ Camera init failed:", err);
      setCameraError("Camera restart failed. Please refresh the page.");
      setImageStatus("error");
      cameraInitAttempted.current = false; // Allow retry on error
    }
  };

  if (stage === "running") {
    tryInitCamera();
  }

  return () => clearTimeout(retryTimeout);
}, [stage, cameraActive]);// ✅ Minimal dependencies - only react to stage/camera changes
useEffect(() => {
  if (autoCaptureDoneRef.current) return;

  if (
    stage === "idle" &&
    resumeParsed &&
    token &&
    imageStatus === "pending" &&
    previewVideoRef.current &&
    previewCanvasRef.current
  ) {
  const timer = setTimeout(() => {
      autoCaptureDoneRef.current = true;
      captureReferenceImage().catch((err) => {
        console.warn("Auto-capture failed:", err);
        autoCaptureDoneRef.current = false; // Allow retry
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }
}, [stage, resumeParsed, token, imageStatus, captureReferenceImage]);

useEffect(() => {
  if (currentQuestion) {
    const isProbe = currentQuestion.is_probe || false;
    const round = currentQuestion.round || "screening";
    
    setIsProbeQuestion(isProbe);
    
    console.log(`📋 Question loaded - Round: ${round}, Probe: ${isProbe}, Type: ${currentQuestion.expectedAnswerType}`);
  }
}, [currentQuestion]);

  /* -------------------------
      Render
      ------------------------- */

  // Helper to determine the status message and style
 const getImageStatusIndicator = () => {
  switch (imageStatus) {
    case "captured":
      return {
        text: <><CheckCircle size={14} className="inline mr-1" /> Ready</>,
        className: "bg-emerald-50 text-emerald-800 border-emerald-300",
      };
    case "capturing":
      return {
        text: <><Loader2 size={14} className="inline mr-1 animate-spin" /> Capturing...</>,
        className: "bg-indigo-50 text-indigo-800 border-indigo-300",
      };
    case "error":
      return {
        text: <><AlertCircle size={14} className="inline mr-1" /> Failed - Click to Retry</>,
        className: "bg-rose-50 text-rose-800 border-rose-300 cursor-pointer",
      };
    case "pending":
    default:
      return {
        text: 'Initializing Camera...',
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
  }
};
  const statusIndicator = getImageStatusIndicator();
const resolvedChallengeForEditor = (
  currentQuestion?.coding_challenge ||
  currentQuestion?.raw ||
  {}
) as any;
useEffect(() => {
  const starter = (resolvedChallengeForEditor?.starter_code || "").trim();
  if (starter && !answer.trim()) {
    setAnswer(starter);
  }
  // If you want to always reset on new question uncomment:
  // setAnswer(starter || "");
}, [currentQuestion?.questionId]);
 // run when question changes
 // --- PDF GENERATION LOGIC ---
  const generatePDF = () => {
    if (!finalDecision) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Interview Performance Report", 14, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Verdict: ${finalDecision.verdict?.toUpperCase() || "N/A"}`, pageWidth - 14, 20, { align: "right" });

    // Summary
    let y = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Performance Summary", 14, y);
    y += 10;

    // 🔴 FIX: Use optional chaining (?.) and default values (?? 0)
    const avgScore = (performanceMetrics?.average_score ?? 0) * 100;
    const confidence = (finalDecision.confidence ?? 0) * 100;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Overall Score: ${avgScore.toFixed(0)}%`, 14, y);
    doc.text(`Confidence: ${confidence.toFixed(0)}%`, 80, y);
    doc.text(`Total Questions: ${history.length}`, 150, y);
    y += 15;

    // Strengths
    if (finalDecision.key_strengths?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(22, 163, 74);
        doc.text("Key Strengths:", 14, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        finalDecision.key_strengths.forEach((s: string) => {
            doc.text(`• ${s}`, 14, y);
            y += 6;
        });
        y += 5;
    }

    // Weaknesses
    if (finalDecision.critical_weaknesses?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 38, 38);
        doc.text("Areas for Improvement:", 14, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        finalDecision.critical_weaknesses.forEach((w: string) => {
            doc.text(`• ${w}`, 14, y);
            y += 6;
        });
        y += 10;
    }

    // Question Table
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Question Transcript", 14, y);
    y += 5;

    const tableData = history.map((h, i) => {
      // 🔴 FIX: Safe access for history items
      const qText = h.q?.questionText || "";
      const verdict = h.result?.verdict?.toUpperCase() || "N/A";
      const scoreVal = (h.result?.overall_score ?? 0) * 100;
      const feedback = h.result?.improvement?.substring(0, 100) || h.result?.rationale?.substring(0, 100) || "";

      return [
        `Q${i + 1}`,
        qText.substring(0, 80) + (qText.length > 80 ? "..." : ""),
        verdict,
        `${Math.round(scoreVal)}%`,
        feedback
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['#', 'Question', 'Verdict', 'Score', 'Feedback']],
      body: tableData,
      headStyles: { fillColor: [67, 56, 202] },
      columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 60 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 'auto' }
      },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save("Interview_Report.pdf");
  };
  const handleGetHint = async () => {
     if (hint) return;
     if (!confirm("Taking a hint will reduce your maximum score for this question by 15%. Continue?")) return;
     
     setLoadingHint(true);
     // Pass question type to get better context-aware hints
     const h = await fetchHint(currentQuestion?.questionText || "", currentQuestion?.type || "conceptual",answer);
     setHint(h);
     setLoadingHint(false);
  };


const RoundIndicator = () => {
    if (stage !== "running") return null;

    // Config for round colors
    const roundConfig: any = {
      screening: { label: "Screening", color: "bg-blue-600" },
      technical: { label: "Technical", color: "bg-purple-600" },
      behavioral: { label: "Behavioral", color: "bg-emerald-600" },
      complete: { label: "Complete", color: "bg-slate-600" }
    };

    const activeConfig = roundConfig[currentRound] || roundConfig.screening;

    return (
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4 animate-in fade-in slide-in-from-top-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Active Round Badge */}
          <div className="flex items-center gap-3">
             <div className={`${activeConfig.color} text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-sm flex items-center gap-2 capitalize`}>
                {activeConfig.label} Round
             </div>
             
             {isProbeQuestion && (
                <div className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                   <HelpCircle size={14} /> Deep Dive
                </div>
             )}
          </div>

          {/* Right: Progress Stats from Backend */}
          {roundProgress && (
            <div className="flex items-center gap-2 text-sm">
               {Object.entries(roundProgress).map(([r, d]: any) => {
                  const isCurrent = r === currentRound;
                  const count = d.questions || 0; 
                  
                  // Style logic: Dark if current, Green if done, Gray if waiting
                  let style = "bg-slate-50 text-slate-400 border-slate-100";
                  if (isCurrent) style = "bg-slate-800 text-white border-slate-800 shadow-md transform scale-105";
                  else if (d.status === "passed" || d.status === "completed") style = "bg-green-50 text-green-700 border-green-200";

                  return (
                    <div key={r} className={`px-3 py-1 rounded-lg border transition-all ${style}`}>
                       <span className="capitalize font-medium">{r}</span>: <span className="font-bold">{count}</span>
                    </div>
                  );
               })}
            </div>
          )}
        </div>
      </div>
    );
  };
// Auto-speak final decision reason
useEffect(() => {
  if (stage === "done" && finalDecision?.reason && autoReadQuestions) {
    const timer = setTimeout(() => {
      speakText(finalDecision.reason, false);
    }, 2000);
    return () => {
      clearTimeout(timer);
      // Cancel speech if user navigates away before it finishes
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }
}, [stage, finalDecision, autoReadQuestions, speakText]);
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      {/* Fixed Camera View (during interview) (unchanged) */}
    {stage === "running" && (
  <div 
    className={`fixed top-4 right-4 z-40 w-40 h-30 bg-white rounded-xl shadow-xl border-4 border-white overflow-hidden transform scale-x-[-1] transition-transform duration-300 ${
      cameraActive ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
    }`}
  >
    <video
      ref={proctorVideoRef}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover"
    />
    {/* hidden canvases */}
    <canvas ref={captureCanvasRef} style={{ display: "none" }} />
    <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <span className="text-[10px] text-white font-bold tracking-wider">
        REC
      </span>
    </div>
  </div>
)}
      {stage === "running" && imageStatus === "pending" && (
  <div className="fixed top-20 right-4 z-40 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-xl max-w-xs animate-in fade-in slide-in-from-right-4">
    <div className="flex items-center gap-3">
      <Loader2 className="animate-spin text-amber-600" size={20} />
      <div>
        <div className="font-bold text-amber-900 text-sm">Restoring Camera...</div>
        <div className="text-xs text-amber-700">Reconnecting proctoring system</div>
      </div>
    </div>
  </div>
)}


      <div className="max-w-6xl mx-auto">
        {/* Violation banners (unchanged) */}
        {showViolationWarning && !terminatedByViolation && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-start gap-3 shadow animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            <div>
              <div className="font-bold">Warning — Do not change screen</div>
              <div className="text-sm">
                We detected that you switched away from the interview or exited
                fullscreen:{" "}
                <span className="font-medium">{violationReason}</span>. This is a
                formal warning. You must re-enter fullscreen within 30 seconds or
                the interview will be terminated.
              </div>
            </div>
          </div>
        )}

        {terminatedByViolation && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-3 shadow animate-in fade-in slide-in-from-top-2">
            <X size={20} className="shrink-0" />
            <div>
              <div className="font-bold">Interview Terminated</div>
              <div className="text-sm">
                The interview was terminated because you changed the screen or
                exited fullscreen after a previous warning:
                <span className="font-medium"> {violationReason}</span>. Your
                session has ended. Contact the administrator if you think this
                was an error.
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen prompt modal (initial start) (unchanged) */}
        {fullscreenPromptVisible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-lg w-full bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-2">
                Enter Full Screen to Begin
              </h3>
              <p className="mb-4 text-sm text-slate-700 leading-relaxed">
                For exam integrity we require the interview to run in fullscreen.
                When you enter fullscreen we will lock the interview flow to this
                window. Please click{" "}
                <strong>Enter Fullscreen & Start</strong>. If your browser blocks
                fullscreen, follow its instructions or press <kbd>F11</kbd>. If
                you prefer not to use fullscreen, you may choose{" "}
                <strong>Start anyway (not recommended)</strong> but this may
                limit your eligibility.
              </p>

              <div className="flex justify-between items-center gap-3">
                <div className="text-sm text-slate-600">
                  Fullscreen is strongly recommended to protect test integrity.
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="px-4 py-2 rounded border"
                    onClick={async () => {
                      setFullscreenPromptVisible(false);
                      setNeedsFullscreen(false);
                      await handleStart("Technical Interview", "medium", "");
                    }}
                  >
                    Start anyway (not recommended)
                  </button>

                  <button
                    className="px-4 py-2 rounded bg-indigo-600 text-white"
                    onClick={async () => {
                      setFullscreenPromptVisible(false);
                      const entered = await tryRequestFullscreen();
                      if (entered) {
                        await handleStart("Technical Interview", "medium", "");
                      } else {
                        setFullscreenPromptVisible(true);
                      }
                    }}
                  >
                    Enter Fullscreen & Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Re-enter fullscreen modal after first warning (strict) (unchanged) */}
        {reenterPromptVisible && !terminatedByViolation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-w-xl w-full bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-rose-700">
                Immediate Action Required — Re-enter Full Screen
              </h3>

              <p className="mb-3 text-sm text-slate-700 leading-relaxed">
                We detected activity that may indicate you left the interview
                window: <strong>{violationReason}</strong>. For the integrity of
                this assessment you must re-enter fullscreen within the countdown
                below. If you do not re-enter fullscreen within the allotted time
                the interview will be terminated and flagged. Please follow the
                steps below to re-enter fullscreen, or choose to end the
                interview now.
              </p>

              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-rose-600">
                    {countdown}s
                  </div>
                  <div className="text-sm text-slate-600">
                    remaining to re-enter fullscreen
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="px-4 py-2 rounded border"
                    onClick={async () => {
                      try {
                        if (countdownTimerRef.current) {
                          window.clearInterval(countdownTimerRef.current);
                          countdownTimerRef.current = null;
                        }
                        endingRef.current = true;
                        setTerminatedByViolation(true);
                        stopCamera(); // Stop camera
                        await endInterview?.(
                          "Candidate chose to end interview after warning",
                          true
                        );
                        localStorage.removeItem("active_interview_session");

                      } catch (e) {
                        console.warn(
                          "endInterview error from reenter modal:",
                          e
                        );
                      } finally {
                        setReenterPromptVisible(false);
                      }
                    }}
                  >
                    End Interview
                  </button>

                  <button
                    className="px-4 py-2 rounded bg-indigo-600 text-white"
                    onClick={async () => {
                      const entered = await tryRequestFullscreen();
                      if (entered) {
                        if (countdownTimerRef.current) {
                          window.clearInterval(countdownTimerRef.current);
                          countdownTimerRef.current = null;
                        }
                        setReenterPromptVisible(false);
                        setShowViolationWarning(false);
                        setCountdown(30);
                      } else {
                        setViolationReason(
                          "Fullscreen blocked or not supported — try pressing F11 or allowing fullscreen in your browser."
                        );
                      }
                    }}
                  >
                    Re-enter Fullscreen Now
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                If the button does not work, try pressing <kbd>F11</kbd>{" "}
                (Windows/Linux) or <kbd>Ctrl+Command+F</kbd> (Mac) or allow
                fullscreen from your browser prompt.
              </div>
            </div>
          </div>
        )}
              <EliminationModal />
<RoundTransitionModal />
<VoiceSettingsModal />

        {/* Header (unchanged) */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Sparkles className="text-white" size={28} />
              </div>
              AI Technical Interview
            </h1>
            <p className="text-slate-600 mt-1 ml-14">
              Deep technical assessment powered by AI
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600 font-semibold bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
              {stage === "running" ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Live Interview
                </span>
              ) : stage === "done" ? (
                <span className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  Completed
                </span>
              ) : (
                "Ready to Start"
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics Banner (during interview) (unchanged) */}
        {stage === "running" && performanceMetrics && (
          <div className="mb-6 bg-white rounded-xl shadow-md border border-slate-200 p-5 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-indigo-600" />
                <span className="font-bold text-slate-800">
                  Performance Metrics
                </span>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {performanceMetrics.question_count}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">
                    Questions
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {Math.round(performanceMetrics.average_score * 100)}%
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">
                    Average
                  </div>
                </div>

                {performanceMetrics.last_score !== null && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {Math.round(performanceMetrics.last_score * 100)}%
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                      Last Score
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {renderTrendIcon(performanceMetrics.trend)}
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-900 capitalize">
                      {performanceMetrics.trend.replace("_", " ")}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                      Trend
                    </div>
                  </div>
                </div>

                {(performanceMetrics.consecutive_wins > 0 ||
                  performanceMetrics.consecutive_fails > 0) && (
                  <div className="text-center">
                    <div
                      className={`text-xl font-bold ${
                        performanceMetrics.consecutive_wins > 0
                          ? "text-green-600"
                          : "text-rose-600"
                      }`}
                    >
                      {performanceMetrics.consecutive_wins > 0 ? (
                        <>🔥 {performanceMetrics.consecutive_wins}</>
                      ) : (
                        <>⚠️ {performanceMetrics.consecutive_fails}</>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                      {performanceMetrics.consecutive_wins > 0
                        ? "Win Streak"
                        : "Need Improvement"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <RoundIndicator />


        {/* Not Logged In Warning (unchanged) */}
        {!token && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border-2 border-amber-200 text-sm text-amber-900 flex items-center gap-3 shadow-sm">
            <AlertCircle size={20} className="shrink-0" />
            <span>
              You must be logged in to upload a resume or run the interview.
              <span className="ml-2 font-bold">
                <Link href="/Auth/login" className="underline hover:text-amber-700">
                  Log in
                </Link>{" "}
                or{" "}
                <Link href="/Auth/signup" className="underline hover:text-amber-700">
                  Sign up
                </Link>
                .
              </span>
            </span>
          </div>
        )}

        {/* Resume Uploader (Updated to NOT pass isFaceRegistered) */}
        {stage !== "running" && stage !== "done" && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* isFaceRegistered prop REMOVED here */}
            <ResumeUploader onReady={onResumeReady} onStart={handleStart} />
          </div>
        )}

        {/* Start Button & Camera Preview */}
     {(stage as string) === "idle" && resumeParsed && token && (
  <div className="mb-8 flex flex-col items-center">
    <div className="mb-6 relative group">
      <div className="w-80 h-60 bg-slate-900 rounded-2xl overflow-hidden border-4 border-white shadow-xl ring-4 ring-indigo-100 relative">
        <video
          ref={previewVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
        
        <canvas ref={previewCanvasRef} style={{ display: "none" }} />
        <canvas ref={captureCanvasRef} style={{ display: "none" }} />

        {cameraError && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-rose-100 text-sm p-6 text-center bg-black/80 cursor-pointer hover:bg-black/70 transition-colors"
            onClick={async () => {
              setCameraError(null);
              setImageStatus("pending");
              try {
                await captureReferenceImage();
              } catch (err) {
                console.warn("Manual retry failed:", err);
              }
            }}
          >
            <AlertCircle size={32} className="mb-2" />
            <div className="font-bold mb-1">{cameraError}</div>
            <div className="text-xs mt-2 underline">Click here to retry</div>
          </div>
        )}
        {/* Speech Recognition Error */}
{speechError && stage === "running" && (
  <div className="mb-4 p-4 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
    <AlertCircle size={20} className="shrink-0" />
    <div>
      <div className="font-bold">Speech Recognition Issue</div>
      <div className="text-sm">{speechError}</div>
    </div>
  </div>
)}

{!isSupported && stage === "running" && (
  <div className="mb-4 p-4 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-900 flex items-start gap-3 shadow-sm">
    <X size={20} className="shrink-0" />
    <div>
      <div className="font-bold">Speech Recognition Not Supported</div>
      <div className="text-sm">Please use Chrome, Edge, or Safari for voice input.</div>
    </div>
  </div>
)}
      </div>

      {/* Status indicator */}
      <div
        className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full shadow-md text-xs font-bold whitespace-nowrap border ${
          getImageStatusIndicator().className
        }`}
        onClick={imageStatus === "error" ? async () => {
          setCameraError(null);
          setImageStatus("pending");
          try {
            await captureReferenceImage();
          } catch (err) {}
        } : undefined}
      >
        {getImageStatusIndicator().text}
      </div>
    </div>

    <button
      onClick={handleStart}
      disabled={loading || imageStatus !== "captured" || startAttemptRef.current}
      className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-indigo-300 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {loading || startAttemptRef.current ? (
        <>
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Starting Interview...</span>
        </>
      ) : (
        <>
          <span>Begin Technical Interview</span>
          <div className="bg-white/20 p-2 rounded-full group-hover:translate-x-1 transition-transform">
            <Play size={20} fill="currentColor" />
          </div>
        </>
      )}
    </button>
  </div>
)}

        {/* Error Message (unchanged) */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-sm flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <X size={20} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* ACTIVE INTERVIEW (unchanged) */}
{stage === "running" && currentQuestion && !terminatedByViolation && (
  <div className="space-y-6 max-w-5xl mx-auto">
{lastFeedback && (
  <div className="p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-l-4 border-amber-500 rounded-r-2xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-500 relative group">
    <div className="flex items-start gap-4">
      <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shrink-0 shadow-md">
        <Lightbulb size={24} className="text-white" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
            💡 AI Mentor Feedback
          </h4>
          
          {/* 👇 NEW: Audio Control Button for Feedback */}
          <button
            onClick={() => {
              if (isSpeaking) {
                // If speaking, toggle pause/resume
                if (isPaused) resumeSpeaking();
                else pauseSpeaking();
              } else {
                // If not speaking, read this feedback immediately (Priority: True)
                speakText(lastFeedback, true);
              }
            }}
            className="p-2 bg-white/50 hover:bg-white rounded-full text-amber-700 transition-all shadow-sm border border-amber-200"
            title="Read Feedback"
          >
            {isSpeaking ? (
              isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />
            ) : (
              <Volume2 size={16} />
            )}
          </button>
        </div>
        
        <p className="text-amber-900 text-base leading-relaxed font-medium">
          {lastFeedback}
        </p>
      </div>
    </div>
  </div>
)}

    <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden">
<div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b-2 border-slate-200">
  <div className="flex justify-between items-start mb-3">
{/* Find this section in your code */}
<span className="text-xs font-black tracking-widest text-indigo-600 uppercase bg-indigo-100 px-3 py-1.5 rounded-lg border-2 border-indigo-200">
  {/* OLD CODE: Question {currentQuestion?.questionNumber || history.length + 1} */}
  
  {/* NEW FIX: Filter history to ensure we don't count the current question ID if it exists in history */}
  Question {
    currentQuestion?.questionNumber || 
    (history.filter(h => h.q?.questionId !== currentQuestion?.questionId).length + 1)
  }
</span>

 
    <div className="flex items-center gap-2 flex-wrap">
      {/* TTS Controls */}
      <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm border border-slate-200">
        <button
          onClick={toggleSpeak}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            isSpeaking
              ? isPaused
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700 animate-pulse"
              : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
          }`}
          title={isSpeaking ? (isPaused ? "Resume" : "Pause") : "Read Question"}
        >
          {isSpeaking ? (
            isPaused ? (
              <>
                <Play size={14} fill="currentColor" />
                Resume
              </>
            ) : (
              <>
                <Pause size={14} />
                Pause
              </>
            )
          ) : (
            <>
              <Volume2 size={14} />
              Read
            </>
          )}
        </button>

        {isSpeaking && (
          <>
            <button
              onClick={stopSpeaking}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              title="Stop"
            >
              <Square size={14} className="text-slate-600" />
            </button>

            <div className="flex items-center gap-1 px-2 border-l border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold">
                {speechRate.toFixed(1)}x
              </span>
            </div>
          </>
        )}

        <button
          onClick={() => setShowVoiceSettings(true)}
          className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
          title="Voice Settings"
        >
          <Settings size={14} className="text-slate-600" />
        </button>
      </div>

      {/* Existing Hint Button */}
      <button
        onClick={handleGetHint}
        disabled={loadingHint || !!hint}
        className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
          hint
            ? "bg-amber-100 text-amber-800 border-amber-200 cursor-default"
            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
        }`}
      >
        {loadingHint ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Lightbulb size={12} />
        )}
        {hint ? "Hint Active (-15%)" : "Get Hint"}
      </button>
    </div>
  </div>

  {/* Rest of the header content remains the same */}
  <div className="flex items-center gap-2 mb-2">
    {currentQuestion.difficulty && (
      <span
        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
          currentQuestion.difficulty === "expert" ||
          currentQuestion.difficulty === "hard"
            ? "bg-rose-100 text-rose-700 border-2 border-rose-200"
            : "bg-amber-100 text-amber-700 border-2 border-amber-200"
        }`}
      >
        {currentQuestion.difficulty.toUpperCase()}
      </span>
    )}
  </div>

  {/* Hint Display */}
  {hint && (
    <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r text-sm text-yellow-900 animate-in fade-in slide-in-from-top-2">
      <strong className="block mb-1 font-bold flex items-center gap-2">
        <Lightbulb size={16} /> Hint:
      </strong>
      {hint}
    </div>
  )}

  {isProbeQuestion && (
    <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded text-sm">
      <div className="flex items-center gap-2 text-amber-800 font-bold mb-1">
        <HelpCircle size={16} />
        <span>Follow-up Question</span>
      </div>
      <p className="text-amber-700 text-xs">
        This is a clarifying question based on your previous answer.
        Take your time to provide more detail.
      </p>
    </div>
  )}

  <h2 className="text-2xl font-bold text-slate-900 leading-snug">
    {currentQuestion.questionText}
  </h2>

  <div className="mt-4 flex flex-wrap gap-2">
    {currentQuestion.target_project && (
      <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 font-medium">
        🎯 {currentQuestion.target_project}
      </span>
    )}
    {currentQuestion.technology_focus && (
      <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-200 font-medium">
        ⚡ {currentQuestion.technology_focus}
      </span>
    )}
    {currentQuestion.expectedAnswerType === "code" && (
      <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg border border-green-200 font-medium">
        💻 Code Expected
      </span>
    )}
  </div>
</div>

              <div className="bg-slate-50 p-8 border-t border-slate-200">
<form onSubmit={handleSubmitAnswer}>
  {currentQuestion.expectedAnswerType === "code" ? (
  <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm">
    
    {/* --- EDITOR HEADER & TOOLBAR --- */}
    <div className="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-300">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-600 uppercase bg-slate-200 px-2 py-1 rounded">
{(resolvedChallengeForEditor.language || "PYTHON").toUpperCase()}

        </span>
        {resolvedChallengeForEditor.language === "cpp" && (
  <span className="text-xs text-amber-600">
    C++: Write a complete program with <code>main()</code> that reads stdin and prints output
  </span>
)}

{resolvedChallengeForEditor.language === "python" && (
  <span className="text-xs text-slate-500">
    Python: You may define <code>solve()</code> or read from stdin
  </span>
)}
        <span className="text-xs text-slate-500">
          Write your solution below
        </span>
      </div>
      
      <button 
        type="button"
        onClick={handleRunCode}
        disabled={codeStatus === "running" || !answer.trim()}
        className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${
          codeStatus === "running" 
            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md"
        }`}
      >
        {codeStatus === "running" ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Play size={16} fill="currentColor" />
        )}
        Run Code
      </button>
    </div>

    {/* --- MONACO EDITOR --- */}
    <div className="h-[400px] w-full relative">
<Editor
key={resolvedChallengeForEditor.language || "python"}
  height="100%"
  defaultLanguage={(resolvedChallengeForEditor.language || "python").toLowerCase()}
  value={answer}                          // <- controlled
  // defaultValue removed
  onChange={(val) => setAnswer(val || "")}
  onMount={handleEditorDidMount}
  theme="vs-dark"
  options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, automaticLayout: true }}
/>

    </div>

    {/* --- CONSOLE OUTPUT TERMINAL --- */}
    <div className="bg-slate-900 text-slate-300 p-4 font-mono text-sm border-t-4 border-slate-700">
      
      {/* TEST CASE REQUIREMENTS DISPLAY */}
      <div className="mb-3 p-2 bg-slate-800 rounded border border-slate-700 flex flex-wrap gap-4 text-xs">
        <div>
          <span className="text-slate-500 font-bold uppercase mr-2">Input:</span>
          <code className="text-indigo-300">
{resolvedChallengeForEditor.test_case_input ?? resolvedChallengeForEditor.test_case ?? "[]"}
          </code>
        </div>
        <div>
          <span className="text-slate-500 font-bold uppercase mr-2">Target Output:</span>
          <code className="text-emerald-300">
{resolvedChallengeForEditor.expected_output ?? resolvedChallengeForEditor.expected ?? ""}
          </code>
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Console Output
        </div>
        
        {/* SUCCESS BADGE */}
        {codeStatus === "success" && allTestsPassed && (
  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-400/10 px-2 py-1 rounded">
    <CheckCircle size={12} /> All Tests Passed
  </span>
)}

{codeStatus === "error" && executionResult && !allTestsPassed && (
  <span className="text-xs font-bold text-rose-400 flex items-center gap-1 bg-rose-400/10 px-2 py-1 rounded">
    <XCircle size={12} /> Some Tests Failed
  </span>
)}


      </div>

      <div className="bg-black/50 p-3 rounded-lg min-h-[80px] max-h-[200px] overflow-y-auto">
        {codeStatus === "idle" && !codeOutput && (
          <span className="text-slate-600 italic">Click "Run Code" to see output...</span>
        )}
        {codeStatus === "running" && (
          <span className="text-yellow-400 animate-pulse">Running code container...</span>
        )}
        
        {/* OUTPUT DISPLAY */}
        {codeOutput && (
          <pre className={`whitespace-pre-wrap break-words font-mono text-xs md:text-sm ${
             codeStatus === "error" && !allTestsPassed ? "text-rose-400" : "text-green-400"
          }`}>
            {codeOutput}
          </pre>
        )}

        {/* DEBUG INFO (Expected vs Actual) */}
        {executionResult?.debug && (
           <div className="mt-3 pt-2 border-t border-slate-800 text-xs">
              <div className="text-slate-500 font-bold mb-1">Mismatch Details:</div>
              <pre className="text-amber-300/90 whitespace-pre-wrap">{executionResult.debug}</pre>
           </div>
        )}
      </div>
    </div>
  </div>
) :currentQuestion.expectedAnswerType === "system_design" ? (
  /* ============ SYSTEM DESIGN WHITEBOARD - WORKING VERSION ============ */
  <div className="flex flex-col border-2 border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm">
    
    {/* Header */}
    <div className="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-300 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-600 uppercase bg-indigo-100 text-indigo-700 px-2 py-1 rounded flex items-center gap-1">
          <LayoutTemplate size={14} /> System Design
        </span>
        <span className="text-xs text-slate-500">
          Draw your architecture using the left toolbar ⬅️
        </span>
      </div>
      
      {/* Clear and Center buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (excalidrawAPI) {
              excalidrawAPI.scrollToContent();
              excalidrawAPI.updateScene({
                appState: { zoom: { value: 1 } }
              });
              console.log("🎯 Canvas centered");
            }
          }}
          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium"
        >
          🎯 Center
        </button>
        <button
          type="button"
          onClick={() => {
            if (excalidrawAPI) {
              excalidrawAPI.resetScene();
              whiteboardElementsRef.current = [];
              console.log("Canvas cleared");
            }
          }}
          className="text-xs px-3 py-1 bg-rose-100 text-rose-700 rounded hover:bg-rose-200 font-medium"
        >
          🗑️ Clear
        </button>
      </div>
    </div>

    {/* ✅ WORKING CANVAS - Critical fixes applied */}
    <div
      style={{
        width: "100%",
        height: "500px",
        position: "relative",
        isolation: "isolate",
      }}
    >
      <ExcalidrawWrapper
        onChange={handleExcalidrawChange}
        excalidrawAPI={handleExcalidrawAPI}
        viewModeEnabled={false}         // ✅ Prevents lock icon
        zenModeEnabled={false}           // ✅ Shows toolbar
        gridModeEnabled={true}           // ✅ Visual feedback
        initialData={{
          appState: {
            viewBackgroundColor: "#ffffff",
            currentItemStrokeColor: "#1e88e5",
            currentItemBackgroundColor: "#e3f2fd",
            currentItemStrokeWidth: 2,
            zoom: { value: 1 },
            scrollX: 0,
            scrollY: 0,
          },
          elements: [],
        }}
      />
    </div>

    {/* Text Explanation Area */}
    <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        Verbal Explanation (Describe your architecture)
      </label>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={3}
        placeholder="Explain your system design: components, data flow, scalability, databases..."
        className="w-full p-3 text-sm bg-white text-slate-800 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
      />
    </div>
  </div>

     
  ) : (
/* --- HYBRID TEXT/VOICE INPUT (Only for non-technical questions) --- */
  <div className="relative group animate-in fade-in slide-in-from-bottom-2">
    
    {/* Header Status Bar */}
    <div className="flex justify-between items-center mb-2 px-1">
      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
        <Edit3 size={14} /> Your Answer
      </label>
      <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-2 transition-all ${
        isListening ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-slate-100 text-slate-500"
      }`}>
        {isListening ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
Voice Active
          </>
        ) : (
          "Type or Dictate"
        )}
      </div>
    </div>

    {/* Input Area Container */}
    <div className={`relative rounded-xl border-2 transition-all bg-white overflow-hidden ${
      isListening 
        ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
        : "border-slate-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10"
    }`}>
      
      {/* The Text Area (Always Editable) */}
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here... or click the microphone to speak."
        rows={8}
        className="w-full p-5 text-base text-slate-800 outline-none resize-none bg-transparent relative z-10 placeholder:text-slate-400"
      />

 {/* Floating Mic Button with Better Feedback */}
<button
  type="button"
  onClick={handleMicToggle}
  disabled={!isSupported}
  className={`absolute bottom-4 right-4 p-4 rounded-full shadow-2xl transition-all z-30 flex items-center gap-2 font-bold group ${
    !isSupported
      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
      : isListening 
        ? "bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 scale-110 ring-4 ring-rose-200" 
        : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:scale-105"
  }`}
  title={!isSupported ? "Speech recognition not supported" : isListening ? "Stop Recording (Click or press ESC)" : "Start Voice Input (Click or press Space)"}
>
  {isListening ? (
    <>
      <Square size={20} fill="currentColor" className="animate-pulse" />
      <span className="text-sm pr-1">Stop</span>
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
    </>
  ) : (
    <>
      <Mic size={22} className="group-hover:scale-110 transition-transform" />
      <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">Speak</span>
    </>
  )}
</button>

{/* Live Transcript Overlay - Enhanced */}
{isListening && transcriptBuffer && (
  <div className="absolute bottom-20 left-4 right-4 z-20 animate-in slide-in-from-bottom-4">
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse animation-delay-150"></span>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse animation-delay-300"></span>
        </div>
        <span className="text-xs font-bold uppercase text-red-400 tracking-wider">
          Recording
        </span>
        <div className="ml-auto text-xs text-slate-400">
          {transcriptBuffer.split(' ').length} words
        </div>
      </div>
      <p className="text-base font-medium leading-relaxed text-slate-100">
        {transcriptBuffer}
        <span className="inline-block w-2 h-5 ml-1 align-middle bg-indigo-400 animate-pulse"/>
      </p>
    </div>
  </div>
)}
    </div>

    {/* Character Count Footer */}
    <div className="mt-2 flex items-center justify-between text-xs text-slate-400 px-1">
      <span className="flex items-center gap-1">
        <Keyboard size={12} /> {answer.length} chars
      </span>
      <span>
        {isListening ? "Processing voice..." : "Pro Tip: You can edit text while speaking"}
      </span>
    </div>
  </div>
)}

{currentQuestion.expectedAnswerType === "code" && (
  <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
    <div className="bg-white p-3 rounded-xl border-2 border-slate-200">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
        Time Complexity (Big O)
      </label>
      <input
        type="text"
        placeholder="e.g. O(n log n)"
        value={timeComplexity}
        onChange={(e) => setTimeComplexity(e.target.value)}
        className="w-full text-sm font-mono text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
      />
    </div>
    <div className="bg-white p-3 rounded-xl border-2 border-slate-200">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
        Space Complexity (Big O)
      </label>
      <input
        type="text"
        placeholder="e.g. O(1)"
        value={spaceComplexity}
        onChange={(e) => setSpaceComplexity(e.target.value)}
        className="w-full text-sm font-mono text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
      />
    </div>
  </div>
)}
  <div className="mt-5 flex items-center justify-between">
    <button
      type="button"
      onClick={() => {
        setAnswer("");
        setCodeOutput(null);
        setCodeStatus("idle");
        setTimeComplexity("");
      setSpaceComplexity("");
        setWhiteboardElements([]);
if (excalidrawAPI) {
    excalidrawAPI.resetScene();
}
      }}
      className="text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors px-3 py-2 hover:bg-slate-100 rounded-lg"
    >
      Clear Answer
    </button>

    <button
      type="submit"
      disabled={loading || !token || !answer.trim()}
      className={`px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all transform active:scale-95 flex items-center gap-3 ${
        !token || !answer.trim() || loading
          ? "bg-slate-300 text-slate-500 cursor-not-allowed"
          : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-300 hover:scale-105"
      }`}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          Analyzing Answer...
        </>
      ) : (
        <>
          Submit Answer
          <CheckCircle size={20} />
        </>
      )}
    </button>
  </div>
</form>
              </div>
            </div>
          </div>
        )}

        {/* FINAL RESULTS (unchanged) */}
        {stage === "done" && (
          <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-500">
            <div className="p-10 rounded-3xl bg-white border-2 border-slate-200 shadow-2xl">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white mb-5 shadow-lg">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-2">
                  Interview Complete
                </h2>
                <p className="text-slate-600 text-lg">
                  Here's your comprehensive performance analysis
                </p>
              </div>

              {performanceMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-3xl font-black text-slate-900">
                      {performanceMetrics.question_count}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
                      Questions
                    </div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                    <div className="text-3xl font-black text-indigo-600">
                      {Math.round(performanceMetrics.average_score * 100)}%
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
                      Avg Score
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-3xl font-black text-purple-600 capitalize">
                      {performanceMetrics.trend}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
                      Trend
                    </div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-3xl font-black text-emerald-600">
                      {Math.round(performanceMetrics.confidence * 100)}%
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
                      Confidence
                    </div>
                  </div>
                </div>
              )}

         {finalDecision ? (
  <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-8 mb-8 border-2 border-slate-200">
    <div className="text-sm text-slate-600 uppercase tracking-widest font-black mb-4 text-center">
      Final Verdict
    </div>
    <div className="mb-5 transform scale-150 inline-block text-center w-full">
      {renderVerdictBadge(finalDecision.verdict)}
    </div>
             
    {/* 👇 NEW: Round-by-round breakdown */}
 {finalDecision.performanceMetrics &&
 typeof finalDecision.performanceMetrics === "object" &&
 !("average_score" in finalDecision.performanceMetrics) &&
 !("averageScore" in finalDecision.performanceMetrics) && (
  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
    {Object.entries(finalDecision.performanceMetrics).map(
      ([round, stats]: [string, any]) =>
        typeof stats === "object" && stats !== null ? (
          <div
            key={round}
            className="bg-white p-4 rounded-lg border border-slate-200"
          >
            <div className="text-xs uppercase text-slate-500 font-bold mb-2 capitalize">
              {round} Round
            </div>

            <div className="text-2xl font-black text-slate-900">
              {stats.questions ?? 0} Questions
            </div>

            {typeof stats.average_score === "number" && (
              <div className="text-sm text-slate-600 mt-1">
                Avg: {Math.round(stats.average_score * 100)}%
              </div>
            )}
          </div>
        ) : null
    )}
  </div>
)}

    {finalDecision.confidence && (
      <div className="text-sm text-slate-500 mt-5 font-medium text-center">
        Decision Confidence:{" "}
        <span className="font-bold text-slate-700">
          {(finalDecision.confidence * 100).toFixed(0)}%
        </span>
      </div>
    )}

    {finalDecision.reason && (
      <div className="text-slate-800 font-medium italic max-w-2xl mx-auto text-lg leading-relaxed bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-5">
        "{finalDecision.reason}"
      </div>
    )}

    {/* 👇 NEW: Show elimination reason if present */}
    {finalDecision.critical_weaknesses && finalDecision.critical_weaknesses.length > 0 && (
      <div className="mt-5 p-4 bg-rose-50 border border-rose-200 rounded-lg">
        <div className="text-sm font-bold text-rose-800 mb-2">Areas for Improvement:</div>
        <ul className="text-sm text-rose-700 list-disc list-inside space-y-1">
          {finalDecision.critical_weaknesses.map((weakness: string, idx: number) => (
            <li key={idx}>{weakness}</li>
          ))}
        </ul>
      </div>
    )}

    {finalDecision.key_strengths && finalDecision.key_strengths.length > 0 && (
      <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="text-sm font-bold text-emerald-800 mb-2">Key Strengths:</div>
        <ul className="text-sm text-emerald-700 list-disc list-inside space-y-1">
          {finalDecision.key_strengths.map((strength: string, idx: number) => (
            <li key={idx}>{strength}</li>
          ))}
        </ul>
      </div>
    )}

    {finalDecision.recommended_role && (
      <div className="mt-5 text-sm text-indigo-600 font-bold text-center">
        Recommended Role: {finalDecision.recommended_role}
      </div>
    )}
  </div>
) : (
  <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-500 mb-8 border-2 border-slate-200">
    Processing final results...
  </div>
)}
{/* 👇 NEW: Roadmap Section Integration */}
  <div className="mt-12">
    {loadingRoadmap ? (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-slate-100 shadow-xl">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={20} className="text-indigo-600" />
          </div>
        </div>
        <h3 className="mt-6 text-xl font-bold text-slate-900">
          Generating Personalized Roadmap...
        </h3>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          AI is analyzing your mistakes in DSA and System Design to create a custom 4-week study plan.
        </p>
      </div>
    ) : roadmap ? (
      <RoadmapDisplay plan={roadmap} title={roadmapTitle} />
    ) : (
      <div className="text-center mt-8">
        <button 
          onClick={fetchRoadmap}
          className="text-indigo-600 font-bold hover:underline flex items-center justify-center gap-2 mx-auto"
        >
          <Zap size={18} /> Generate Study Plan
        </button>
      </div>
    )}
  </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowReport(!showReport)}
                  className="px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition-all shadow-md hover:shadow-lg"
                >
                  {showReport ? "Hide Full Transcript" : "View Full Transcript"}
                </button>
                {finalDecision?.reason && (
  <button
    onClick={() => speakText(finalDecision.reason)}
    className="px-6 py-3 bg-white border-2 border-indigo-300 text-indigo-700 rounded-xl hover:bg-indigo-50 font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
  >
    <Volume2 size={18} />
    Read Feedback Aloud
  </button>
)}

<button
  onClick={generatePDF}
  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:shadow-xl font-bold transition-all shadow-md flex items-center gap-2"
>
  <FileText size={18} />
  Download Result (PDF)
</button>
                <button
                  onClick={() => setConfirmRestartVisible(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-xl font-bold transition-all shadow-md"
                >
                  Start New Interview
                </button>

              </div>
            </div>

            {confirmRestartVisible && (
              <div className="mt-6 max-w-2xl mx-auto p-6 bg-white rounded-xl border border-slate-200 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg">
                      Start a new interview?
                    </h4>
                    <p className="text-sm text-slate-600">
                      This will clear current progress and begin a fresh session.
                      Are you sure you want to continue?
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 rounded border"
                      onClick={() => setConfirmRestartVisible(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-indigo-600 text-white"
                      onClick={() => {
                            localStorage.removeItem("active_interview_session");

                     window.location.reload();

                      }}
                    >
                      Yes, start new
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showReport && (
              <div className="mt-10 space-y-5">
                <h3 className="font-black text-2xl text-slate-900 px-2 flex items-center gap-3">
                  <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                  Complete Transcript
                </h3>

                {history.map((h, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-md hover:shadow-xl transition-shadow"
                  >
                    <div className="flex gap-5">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                        Q{idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 mb-3 text-lg">
                          {h.q.questionText}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm mb-4 border-2 border-slate-100 font-mono">
                          {String(h.a)}
                        </div>
                        {((h.result as any)?.playback_history?.length > 0 || (h as any).playback_history?.length > 0) && (
   <div className="mb-6 animate-in fade-in slide-in-from-bottom-2">
     <div className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
       <Video size={14} className="text-indigo-600" /> Code Process Replay
     </div>
     <CodeReplayPlayer 
        history={(h.result as any)?.playback_history || (h as any).playback_history} 
     />
   </div>
)}

                        {h.result && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-medium">
                                  Overall Score:
                                </span>
                                {renderScoreBadge(
                                  h.result.overall_score
                                )}
                              </div>

                              {h.result.verdict && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 font-medium">
                                    Verdict:
                                  </span>
                                  <span
                                    className={`text-xs font-bold px-2 py-1 rounded ${
                                      h.result.verdict === "exceptional" ||
                                      h.result.verdict === "strong"
                                        ? "bg-green-100 text-green-800"
                                        : h.result.verdict === "acceptable"
                                        ? "bg-blue-100 text-blue-800"
                                        : h.result.verdict === "weak"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-rose-100 text-rose-800"
                                    }`}
                                  >
                                    {h.result.verdict.toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
{h.result.improvement && (
  <div className="text-sm bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-500 text-emerald-900 mb-3">
    <span className="font-bold flex items-center gap-2 mb-1">
      <Lightbulb size={16} /> Feedback & Improvements:
    </span>
    {h.result.improvement}
  </div>
)}
                            {h.result.rationale && (
                              <div className="text-xs text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <span className="font-bold text-blue-900">
                                  Rationale:{" "}
                                </span>
                                {h.result.rationale}
                              </div>
                            )}

                            {h.result.red_flags_detected &&
                              h.result.red_flags_detected.length > 0 && (
                                <div className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
                                  <span className="font-bold">
                                    ⚠️ Red Flags:{" "}
                                  </span>
                                  {h.result.red_flags_detected.join(", ")}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}