const User = require("../models/User");
const Session = require("../models/Session");
const QA = require("../models/QA");
const Decision = require("../models/Decision");

async function getProfileDashboard(req, res) {
  try {
    const userId = req.userId;

    /* ================= USER ================= */
    const user = await User.findById(userId)
      .select("name email role")
      .lean();

    /* ================= SESSIONS ================= */
    const sessions = await Session.find({ userId })
      .sort({ startedAt: -1 })
      .lean();

    /* ================= SAFE SESSION IDS ================= */
    const sessionIds = sessions
      .map(s => s.sessionId)
      .filter(Boolean); // 🔒 CRITICAL

    /* ================= DECISIONS ================= */
    const decisions = sessionIds.length
      ? await Decision.find({ sessionId: { $in: sessionIds } }).lean()
      : [];

    const decisionMap = {};
    decisions.forEach(d => {
      decisionMap[d.sessionId] = d;
    });

    /* ================= QAs ================= */
    const qas = await QA.find({ userId }).lean();

    /* ================= STATS ================= */
    const scores = qas.map(q => q.score).filter(s => typeof s === "number");
    const averageScore = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
      : null;

    /* ================= HISTORY ================= */
    const interviewHistory = [];

    for (const session of sessions) {
      const sessionQAs = qas.filter(q => q.sessionId === session.sessionId);

      const rounds = { screening: [], technical: [], behavioral: [] };

      sessionQAs.forEach(q => {
        const round = q.metadata?.round || "screening";
        if (rounds[round]) rounds[round].push(q);
      });

      const summarizeRound = (roundQAs) => {
        if (!roundQAs.length) return null;

        const scores = roundQAs.map(q => q.score).filter(s => typeof s === "number");
        const avgScore = scores.length
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
          : null;

        const lastQA = roundQAs.at(-1);

        return {
          averageScore: avgScore,
          feedback: Array.isArray(lastQA?.improvement)
            ? lastQA.improvement.join(" ")
            : lastQA?.rationale || null
        };
      };

      const decision = decisionMap[session.sessionId];

      /* ================= DURATION CALCULATION ================= */
      let duration = 0;
      if (session.startedAt && session.endedAt) {
        duration = Math.round(
          (new Date(session.endedAt) - new Date(session.startedAt)) / 60000
        ); // minutes
      }

      interviewHistory.push({
        sessionId: session.sessionId,
        date: session.startedAt,
        endedAt: session.endedAt,
        duration,

        violationCount: session.violationCount || 0,
        events: session.events || [],
        qaIds: session.qaIds || [],
        status: session.status,

        finalVerdict: decision?.verdict || "pending",
        decisionConfidence: decision?.confidence || 0,
        recommendedRole: decision?.recommended_role || null,

        rounds: {
          screening: summarizeRound(rounds.screening),
          technical: summarizeRound(rounds.technical),
          behavioral: summarizeRound(rounds.behavioral)
        },

         metadata: session.metadata || {}
      });
    }

    /* ================= RESPONSE ================= */
    return res.json({
      user,
      stats: {
        totalInterviews: sessions.length,
        averageScore
      },
      interviewHistory
    });

  } catch (err) {
    console.error("❌ Profile dashboard error:", err);
    return res.status(500).json({ error: "failed_to_load_profile_dashboard" });
  }
}

module.exports = { getProfileDashboard };
