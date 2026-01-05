"use client";

import { useEffect, useState, useMemo } from "react";
import { useProfile, DashboardData } from "../hooks/useProfile";
import { useAuth } from "../context/AuthContext";
import SessionOverview from "./components/SessionOverview";
import RoundWiseProgress from "./components/RoundWiseProgress";
import IntegrityProctoringLog from "./components/IntegrityProctoringLog";
import PerformanceInsights from "./components/PerformanceInsights";
import ExportReports from "./components/ExportReports";
import { ChevronDown, ChevronUp } from "lucide-react";

// --- TYPES ALIGNED WITH BACKEND SCHEMA ---

export type ViolationData = {
  id: string;
  at: string;     // Matches 'at' in your DB events array
  type: string;   // 'violation', 'face_mismatch', etc.
  reason: string; // Descriptive reason from DB
  action?: string; // 'warning' or 'terminate'
};

export type RoundData = {
  roundType: "screening" | "technical" | "behavioral";
  questionCount: number;
  averageScore: number;
  status: "Pass" | "Weak" | "Failed";
  transitionReason?: string;
};

export type PerformanceData = {
  strongAreas: string[];
  weakAreas: { skill: string; severity: "Low" | "Medium" | "High" }[];
  consistency: number;
  variance: number;
  recommendations: string[];
};

export type SessionDetail = {
  sessionId: string;
  finalVerdict: "Hire" | "Reject" | "Pending";
  confidence: number;
  duration: number;
  totalQuestions: number;
  violationCount: number;
  startedAt: string;
  endedAt: string;
  rounds: {
    screening?: RoundData;
    technical?: RoundData;
    behavioral?: RoundData;
  };
  violations: ViolationData[]; // Mapped from backend 'events'
  performanceInsights?: PerformanceData;
};

export default function ProfilePage() {
  const { fetchDashboard } = useProfile();
  const { token } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["overview", "rounds", "integrity"])
  );

  // --- TOGGLE FUNCTION (Defined inside component scope) ---
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  useEffect(() => {
    if (!token) return;
    fetchDashboard()
      .then((responseData) => {
        setData(responseData);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load dashboard");
      })
      .finally(() => setLoading(false));
  }, [token, fetchDashboard]);

  // Transform backend data to frontend format
  const selectedSession = useMemo<SessionDetail | null>(() => {
    if (!data?.interviewHistory?.length) return null;
    
    // 1. Get the actual session from backend response
    const firstSession = data.interviewHistory[0];
    if (!firstSession.date) return null;
    
    // Helper to format round data
    const transformRound = (round: any, roundType: "screening" | "technical" | "behavioral") => {
      if (!round || round.averageScore === null) return undefined;
      const score = round.averageScore;
      return {
        roundType,
        questionCount: 0,
        averageScore: score,
        status: score >= 0.7 ? "Pass" : score >= 0.5 ? "Weak" : "Failed",
        transitionReason: round.feedback || undefined
      };
    };
    
    // 2. Map backend fields to frontend types
    return {
        sessionId: firstSession.sessionId,
        finalVerdict: firstSession.violationCount > 10 ? "Reject" : "Hire",
        confidence: 85,
        duration: 45,
        totalQuestions: firstSession.qaIds?.length || 0,
        
        // --- KEY FIX: Map actual events array from backend ---
        violationCount: firstSession.violationCount || 0,
        violations: firstSession.events || [], 
        // ----------------------------------------------------

        startedAt: firstSession.date,
        rounds: {
          screening: transformRound(firstSession.rounds?.screening, "screening"),
          technical: transformRound(firstSession.rounds?.technical, "technical"),
          behavioral: transformRound(firstSession.rounds?.behavioral, "behavioral")
        },
        // Static insights for now (unless your backend sends this)
        performanceInsights: {
          strongAreas: ["Problem-solving", "Code Logic", "Communication"],
          weakAreas: [{ skill: "Optimization", severity: "Medium" }],
          consistency: 0.82,
          variance: 0.15,
          recommendations: ["Review recursive parsing techniques"]
        }
    } as SessionDetail;
  }, [data]);

  if (!token) return <p className="p-8 text-gray-300">Not logged in</p>;
  if (loading) return <p className="p-8 text-gray-300 animate-pulse">Loading dashboard…</p>;
  if (error || !data || !selectedSession) return <p className="p-8 text-red-400">Error: {error || "No data available"}</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-400">Interview Performance Profile</h1>
            <p className="text-sm text-gray-400 mt-1">Electronics & Instrumentation • NIT Rourkela</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{data.user.name}</p>
              <p className="text-xs text-indigo-300">{data.user.email}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">
              {data.user.name?.[0]}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* 1. Session Overview */}
        <SectionWrapper
          title="Executive Summary"
          sectionId="overview"
          expanded={expandedSections.has("overview")}
          onToggle={toggleSection}
        >
          <SessionOverview session={selectedSession} />
        </SectionWrapper>

        {/* 2. Round-Wise Progress */}
        <SectionWrapper
          title="Round-Wise Competency"
          sectionId="rounds"
          expanded={expandedSections.has("rounds")}
          onToggle={toggleSection}
        >
          <RoundWiseProgress rounds={selectedSession.rounds} />
        </SectionWrapper>

        {/* 3. Integrity & Proctoring Log */}
        <SectionWrapper
          title="Integrity & Proctoring Log"
          sectionId="integrity"
          expanded={expandedSections.has("integrity")}
          onToggle={toggleSection}
        >
          <IntegrityProctoringLog violations={selectedSession.violations} />
        </SectionWrapper>

        {/* 4. Performance Insights */}
        <SectionWrapper
          title="AI Skill Analysis"
          sectionId="insights"
          expanded={expandedSections.has("insights")}
          onToggle={toggleSection}
        >
          <PerformanceInsights insights={selectedSession.performanceInsights} />
        </SectionWrapper>

        {/* 5. Export & Reports */}
        <SectionWrapper
          title="Actions & Documentation"
          sectionId="export"
          expanded={expandedSections.has("export")}
          onToggle={toggleSection}
        >
          <ExportReports session={selectedSession} />
        </SectionWrapper>
      </div>
    </div>
  );
}

// --- SECTION WRAPPER COMPONENT ---

function SectionWrapper({ 
  title, 
  sectionId, 
  expanded, 
  onToggle, 
  children 
}: { 
  title: string; 
  sectionId: string; 
  expanded: boolean; 
  onToggle: (id: string) => void; 
  children: React.ReactNode 
}) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl transition-all duration-200">
      <button
        onClick={() => onToggle(sectionId)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-6 rounded-full ${expanded ? 'bg-indigo-500' : 'bg-gray-600'}`} />
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}