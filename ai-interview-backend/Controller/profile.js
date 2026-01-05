const User = require("../models/User");
const Session = require("../models/Session");
const QA = require("../models/QA");

async function getProfileDashboard(req, res) {
  try {
    const userId = req.userId;

    // ================= USER =================
    const user = await User.findById(userId)
      .select("name email role createdAt lastLogin")
      .lean();

    // ================= SESSIONS =================
    const sessions = await Session.find({ userId })
      .sort({ startedAt: -1 })
      .lean();

    const totalInterviews = sessions.length;

    // ================= QAs (Scores) =================
    const qas = await QA.find({ userId }).lean();
    const scores = qas
      .map(q => q.score)
      .filter(s => typeof s === "number");

    const averageScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : 0;

    // ================= INTERVIEW HISTORY =================
    const interviewHistory = [];

    for (const session of sessions) {
      const sessionQAs = qas.filter(q => q.sessionId === session.sessionId);

      const rounds = {
        screening: [],
        technical: [],
        behavioral: []
      };

      // group QAs by round
      sessionQAs.forEach(q => {
        // Fallback: if no round metadata, treat as screening or infer from logic
        const round = q.metadata?.round || "screening"; 
        if (rounds[round]) {
          rounds[round].push(q);
        }
      });

      // helper to compute avg + feedback
      const summarizeRound = (roundQas) => {
        if (!roundQas || !roundQas.length) return null;

        const roundScores = roundQas.map(q => q.score).filter(s => typeof s === "number");
        const avgScore = roundScores.length
          ? Math.round((roundScores.reduce((a, b) => a + b, 0) / roundScores.length) * 100) / 100
          : null;

        const lastQA = roundQas[roundQas.length - 1];

        return {
          averageScore: avgScore,
          feedback: lastQA?.improvement || lastQA?.rationale || null
        };
      };

      interviewHistory.push({
        sessionId: session.sessionId,
        date: session.startedAt,
        // 👇👇👇 CRITICAL ADDITION: Pass these fields to frontend 👇👇👇
        violationCount: session.violationCount || 0,
        events: session.events || [], 
        qaIds: session.qaIds || [], // Helpful for calculating total questions
        status: session.status,     // Helpful to know if completed/active
        // 👆👆👆 END ADDITION 👆👆👆
        rounds: {
          screening: summarizeRound(rounds.screening),
          technical: summarizeRound(rounds.technical),
          behavioral: summarizeRound(rounds.behavioral)
        }
      });
    }

    return res.json({
      user,
      stats: {
        totalInterviews,
        averageScore
      },
      interviewHistory
    });

  } catch (err) {
    console.error("Profile dashboard error:", err);
    return res.status(500).json({ error: "failed_to_load_profile_dashboard" });
  }
}

module.exports = { getProfileDashboard };