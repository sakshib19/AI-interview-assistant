const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true }, 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["active", "completed", "abandoned", "aborted"], default: "active" },
  
  // ✅ NEW: Array to store the sequence of questions asked
  // Your server.js pushes to this via: { $push: { qaIds: qaId } }
  qaIds: [{ type: String }], 

  // Timestamps
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  
  // Metadata & Refs
  // Stores: current_round, referenceFace, track_context, etc.
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  resumeRef: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" },
  finalDecisionRef: { type: mongoose.Schema.Types.ObjectId, ref: "Decision" },
  
  // Violation tracking
  violationCount: { type: Number, default: 0 },
  events: { type: Array, default: [] },
  
  // Exit/Termination info
  endedReason: { type: String }
}, { timestamps: true });

// 🚀 PERFORMANCE INDEXES
SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Session", SessionSchema);