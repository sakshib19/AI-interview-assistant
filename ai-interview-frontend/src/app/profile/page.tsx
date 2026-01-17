"use client";

import { useEffect, useState, useMemo } from "react";
import { useProfile, DashboardData } from "../hooks/useProfile";
import { useAuth } from "../context/AuthContext";
import SessionOverview from "./components/SessionOverview";
import RoundWiseProgress from "./components/RoundWiseProgress";
import IntegrityProctoringLog from "./components/IntegrityProctoringLog";
import PerformanceInsights from "./components/PerformanceInsights";
import ExportReports from "./components/ExportReports";
import { ChevronDown, ChevronUp, Calendar, Clock, ChevronRight } from "lucide-react";

// --- TYPES ---

export type ViolationData = {
  id: string;
  at: string;
  type: string;
  reason: string;
  action?: string;
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
  recommendedRole?: string | null;
  totalQuestions: number;
  violationCount: number;
  grayZoneCount: number; // <--- ADDED THIS FIELD
  startedAt: string;
  endedAt?: string;
  rounds: {
    screening?: RoundData;
    technical?: RoundData;
    behavioral?: RoundData;
  };
  violations: ViolationData[];
  performanceInsights?: PerformanceData;
};

export default function ProfilePage() {
  const { fetchDashboard } = useProfile();
  const { token } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["overview", "rounds", "integrity"])
  );

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
        setSelectedIndex(0);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load dashboard");
      })
      .finally(() => setLoading(false));
  }, [token, fetchDashboard]);

  const selectedSession = useMemo<SessionDetail | null>(() => {
    if (!data?.interviewHistory?.length) return null;
    
    const currentSession = data.interviewHistory[selectedIndex];
    const rawSession = currentSession as any;

    if (!currentSession || !currentSession.date) return null;
    
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
    
    return {
        sessionId: currentSession.sessionId,
        finalVerdict:
          rawSession.finalVerdict === "hire"
            ? "Hire"
            : rawSession.finalVerdict === "reject"
            ? "Reject"
            : "Pending",

        confidence: rawSession.decisionConfidence || 0,
        duration: 45,
        totalQuestions: rawSession.qaIds?.length || 0,

        recommendedRole: rawSession.recommendedRole || null,
        
        violationCount: rawSession.violationCount || 0,
        grayZoneCount: 0, // <--- INITIALIZED HERE (Your backend currently doesn't send this, so defaulting to 0)
        violations: rawSession.events || [], 
        
        startedAt: currentSession.date,
        endedAt: rawSession.endedAt || undefined,

        rounds: {
          screening: transformRound(currentSession.rounds?.screening, "screening"),
          technical: transformRound(currentSession.rounds?.technical, "technical"),
          behavioral: transformRound(currentSession.rounds?.behavioral, "behavioral")
        },
        performanceInsights: {
          strongAreas: ["Problem-solving", "Code Logic"],
          weakAreas: [],
          consistency: 0.82,
          variance: 0.15,
          recommendations: ["Review system design patterns"]
        }
    } as SessionDetail;
  }, [data, selectedIndex]);

  if (!token) return <p className="p-8 text-gray-300">Not logged in</p>;
  if (loading) return <p className="p-8 text-gray-300 animate-pulse">Loading dashboard...</p>;
  if (error || !data) return <p className="p-8 text-red-400">Error: {error || "No data available"}</p>;

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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* --- LEFT COLUMN: PAST SESSIONS --- */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-200">History</h2>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 border border-gray-700">
                {data.interviewHistory.length} Sessions
              </span>
            </div>
            
            <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
              {data.interviewHistory.map((session, idx) => (
                <SessionCard 
                  key={session.sessionId} 
                  session={session} 
                  isActive={idx === selectedIndex}
                  onClick={() => setSelectedIndex(idx)}
                />
              ))}
            </div>
          </div>

          {/* --- RIGHT COLUMN: SELECTED SESSION --- */}
          <div className="lg:col-span-3 space-y-6">
            {selectedSession ? (
              <>
                <SectionWrapper
                  title="Executive Summary"
                  sectionId="overview"
                  expanded={expandedSections.has("overview")}
                  onToggle={toggleSection}
                >
                  <SessionOverview session={selectedSession} />
                </SectionWrapper>

                <SectionWrapper
                  title="Round-Wise Competency"
                  sectionId="rounds"
                  expanded={expandedSections.has("rounds")}
                  onToggle={toggleSection}
                >
                  <RoundWiseProgress rounds={selectedSession.rounds} />
                </SectionWrapper>

                <SectionWrapper
                  title="Integrity & Proctoring Log"
                  sectionId="integrity"
                  expanded={expandedSections.has("integrity")}
                  onToggle={toggleSection}
                >
                  <IntegrityProctoringLog violations={selectedSession.violations} />
                </SectionWrapper>

                <SectionWrapper
                  title="AI Skill Analysis"
                  sectionId="insights"
                  expanded={expandedSections.has("insights")}
                  onToggle={toggleSection}
                >
                  <PerformanceInsights insights={selectedSession.performanceInsights} />
                </SectionWrapper>

                <SectionWrapper
                  title="Actions & Documentation"
                  sectionId="export"
                  expanded={expandedSections.has("export")}
                  onToggle={toggleSection}
                >
                  <ExportReports session={selectedSession} />
                </SectionWrapper>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-800 rounded-xl border border-gray-700 border-dashed">
                <p className="text-gray-400">Select a session from the history to view details</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENT ---

function SessionCard({ session, isActive, onClick }: { session: any, isActive: boolean, onClick: () => void }) {
  const date = new Date(session.date);
  
  const rounds = [session.rounds?.screening, session.rounds?.technical, session.rounds?.behavioral];
  const scores = rounds
    .map((r: any) => r?.averageScore)
    .filter((s: any) => typeof s === 'number') as number[];
  
  const avg = scores.length 
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) 
    : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
        isActive 
          ? "bg-indigo-900/20 border-indigo-500 shadow-lg shadow-indigo-900/10" 
          : "bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600"
      }`}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-medium text-gray-200 group-hover:text-white">
            Interview Session
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            {date.toLocaleDateString()}
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-bold ${
          avg >= 70 ? 'bg-green-500/10 text-green-400' : 
          avg >= 50 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {avg > 0 ? `${avg}%` : 'N/A'}
        </div>
      </div>

      <div className="flex justify-between items-end mt-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        {isActive && <ChevronRight className="w-4 h-4 text-indigo-400 animate-pulse" />}
      </div>
    </button>
  );
}

// --- WRAPPER ---

function SectionWrapper({ title, sectionId, expanded, onToggle, children }: any) {
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
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {expanded && <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">{children}</div>}
    </div>
  );
}