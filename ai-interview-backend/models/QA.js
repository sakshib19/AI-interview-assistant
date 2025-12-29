const mongoose = require("mongoose");

const QASchema = new mongoose.Schema({
  qaId: { type: String, required: true, unique: true }, 
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  // Core Question Data
  questionId: { type: String },
  questionText: { type: String },
  ideal_outline: { type: String },
  expectedAnswerType: { type: String },
  difficulty: { type: String },
  
  // Timing
  askedAt: { type: Date, default: Date.now },
  answeredAt: { type: Date },
  
  // Answer Data
  candidateAnswer: { type: String }, 
  
  // Scoring & Analysis
  gradedBy: { type: String },
  score: { type: Number, min: 0, max: 1 },
  rubricScores: { type: mongoose.Schema.Types.Mixed },
  confidence: { type: Number, min: 0, max: 1 },
  
  // ✅ NEW: Explicit Verdict Field
  verdict: { type: String, default: "pending" }, // fail, weak, acceptable, strong, exceptional

  rationale: { type: String },
 improvement: {
  type: [String],
  default: []
},
  
  // ✅ NEW: Structured Diagnostics (Win/Gap/Fix)
  // This matches the Python "technical_diagnosis" output exactly
  technical_diagnosis: {
    win: { type: String, default: "" },
    gap: {
      issue: { type: String, default: "" },
      expected_level: { type: String, default: "" },
      observed: { type: String, default: "" },
      severity: { type: String, default: "" }
    },
    fix: {
      action: { type: String, default: "" },
      resource_type: { type: String, default: "" }
    },
    sub_topics: [
      {
        name: { type: String },
        confidence: { type: Number },
        _id: false
      }
    ]
  },

  // ✅ NEW: Safety & Integrity Flags
  red_flags_detected: { type: [String], default: [] },
  missing_elements: { type: [String], default: [] },

  // Playback for Anti-Cheat
  playback_history: [
    {
      timestamp: Number,
      code: String,
      trigger: String
    }
  ],
  
  // Flags & Metadata
  needsHumanReview: { type: Boolean, default: false },
  aiRaw: { type: mongoose.Schema.Types.Mixed }, 
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// 🚀 PERFORMANCE INDEXES
QASchema.index({ sessionId: 1, askedAt: 1 });
QASchema.index({ userId: 1, askedAt: -1 });

module.exports = mongoose.model("QA", QASchema);