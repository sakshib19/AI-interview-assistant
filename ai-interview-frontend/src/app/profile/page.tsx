"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useProfile, DashboardData } from "../hooks/useProfile";
import { useAuth } from "../context/AuthContext";
// Ensure these components handle their own internal sizing gracefully
import SessionOverview from "./components/SessionOverview";
import RoundSummaryPanel from "./components/RoundSummaryPanel";
import IntegrityProctoringLog from "./components/IntegrityProctoringLog";
import PerformanceInsights from "./components/PerformanceInsights";
import ExportReports from "./components/ExportReports";
import { 
  ChevronDown, 
  Clock, 
  ChevronRight, 
  Activity, 
  LayoutDashboard,
  Loader2,
  AlertCircle,
  User,
  ShieldCheck,
  Zap,
  FileText
} from "lucide-react";

// --- TYPES (Unchanged) ---
export type RoundData = {
  roundType: "screening" | "technical" | "behavioral";
  questionCount: number;
  averageScore: number;
  status: "Pass" | "Weak" | "Failed";
  transitionReason?: string;
};

export type SessionDetail = {
  sessionId: string;
  finalVerdict: "Hire" | "Reject" | "Pending";
  confidence: number;
  duration: number;
  recommendedRole?: string | null;
  totalQuestions: number;
  violationCount: number;
  grayZoneCount: number;
  startedAt: string;
  endedAt?: string;
  rounds: {
    screening?: RoundData;
    technical?: RoundData;
    behavioral?: RoundData;
  };
  violations: any[];
  // performanceInsights?: any;
  metadata?: {
    round_summaries?: Record<string, RoundSummary>;
  };
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
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.has(section) ? newSet.delete(section) : newSet.add(section);
      return newSet;
    });
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
    
    // ... Transformation logic matches previous version ...
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
        finalVerdict: rawSession.finalVerdict === "hire" ? "Hire" : rawSession.finalVerdict === "reject" ? "Reject" : "Pending",
        confidence: rawSession.decisionConfidence || 0,
        duration: rawSession.duration, 
        totalQuestions: rawSession.qaIds?.length || 0,
        recommendedRole: rawSession.recommendedRole || null,
        violationCount: rawSession.violationCount || 0,
        grayZoneCount: 0,
        violations: rawSession.events || [], 
        startedAt: currentSession.date,
        endedAt: rawSession.endedAt || undefined,
        rounds: {
          screening: transformRound(currentSession.rounds?.screening, "screening"),
          technical: transformRound(currentSession.rounds?.technical, "technical"),
          behavioral: transformRound(currentSession.rounds?.behavioral, "behavioral")
        },
        // performanceInsights: {
        //   strongAreas: ["Problem-solving", "Code Logic"],
        //   weakAreas: [],
        //   consistency: 0.82,
        //   variance: 0.15,
        //   recommendations: ["Review system design patterns"]
        // }
         metadata: rawSession.metadata || {}
    } as SessionDetail;
  }, [data, selectedIndex]);

  // --- RENDER STATES ---

  if (!token) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-neutral-400 gap-4">
      <div className="p-4 rounded-full bg-neutral-900 border border-neutral-800">
        <User size={32} className="text-neutral-500" />
      </div>
      <p className="font-medium tracking-tight">Please log in to view analytics.</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <Loader2 className="animate-spin text-[#cbe557]" size={48} />
          <p className="text-neutral-400 font-bold tracking-[0.2em] text-xs uppercase animate-pulse">Initializing System</p>
        </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="bg-red-500/5 backdrop-blur-md border border-red-500/20 p-8 rounded-3xl flex flex-col items-center gap-4 max-w-md text-center">
        <AlertCircle size={32} className="text-red-500" />
        <div>
          <h3 className="text-lg font-bold text-red-200">Failed to Load Dashboard</h3>
          <p className="text-sm text-red-400/60 mt-1">{error || "No data available"}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20 relative font-sans selection:bg-[#cbe557] selection:text-black overflow-x-hidden">
      
      {/* ==================== BACKGROUND (Z-0) ==================== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-[#cbe557]/[0.03] rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-[120px]" style={{animationDelay: '3s'}}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* ==================== HEADER (Z-50) ==================== */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/90 backdrop-blur-2xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#cbe557]/10 border border-[#cbe557]/30 flex items-center justify-center">
              <LayoutDashboard size={20} className="text-[#cbe557]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Candidate Profile</h1>
              <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">System Operational</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <p className="font-semibold text-sm text-neutral-200">{data.user.name}</p>
                <p className="text-xs text-neutral-600 font-medium">{data.user.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center font-bold text-neutral-400">
                {data.user.name?.[0]?.toUpperCase()}
              </div>
          </div>
        </div>
      </header>

      {/* ==================== MAIN CONTENT (Z-10) ==================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT SIDEBAR (min-w-0 prevents flex blowout) --- */}
          <aside className="lg:col-span-4 min-w-0 lg:sticky lg:top-24 space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="flex items-center justify-between px-1 mb-2">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.15em] flex items-center gap-2">
                <Clock size={12} className="text-[#cbe557]" /> Session Log
              </h2>
            </div>
            
            {/* Added max-height with scroll to prevent sidebar from overflowing viewport */}
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {data.interviewHistory.map((session, idx) => (
                <SessionCard 
                  key={session.sessionId} 
                  session={session} 
                  isActive={idx === selectedIndex}
                  onClick={() => setSelectedIndex(idx)}
                />
              ))}
            </div>
          </aside>

          {/* --- RIGHT CONTENT (min-w-0 ensures grid containment) --- */}
          <section className="lg:col-span-8 min-w-0 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards">
            {selectedSession ? (
              <>
                <SectionWrapper
                  title="Executive Summary"
                  icon={<Activity size={18} />}
                  sectionId="overview"
                  expanded={expandedSections.has("overview")}
                  onToggle={toggleSection}
                >
                  <SessionOverview session={selectedSession} />
                </SectionWrapper>

              <div className="min-w-0">
                <SectionWrapper
                  title="Round Performance Summary"
                  icon={<Zap size={18} />}
                  sectionId="roundSummary"
                  expanded={expandedSections.has("roundSummary")}
                  onToggle={toggleSection}
                >
                  <RoundSummaryPanel roundSummaries={selectedSession.metadata?.round_summaries} />
                </SectionWrapper>
              </div>


                <SectionWrapper
                  title="Integrity Log"
                  icon={<ShieldCheck size={18} />}
                  sectionId="integrity"
                  expanded={expandedSections.has("integrity")}
                  onToggle={toggleSection}
                >
                  <IntegrityProctoringLog violations={selectedSession.violations} />
                </SectionWrapper>

                <SectionWrapper
                  title="Export Data"
                  icon={<FileText size={18} />}
                  sectionId="export"
                  expanded={expandedSections.has("export")}
                  onToggle={toggleSection}
                >
                  <ExportReports session={selectedSession} />
                </SectionWrapper>
              </>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center bg-neutral-900/30 rounded-3xl border border-dashed border-white/10 backdrop-blur-sm">
                <div className="p-4 bg-white/5 rounded-full mb-4 ring-1 ring-white/10">
                  <LayoutDashboard className="w-8 h-8 text-neutral-600" />
                </div>
                <p className="text-neutral-500 font-medium">Select a session to view details</p>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function SessionCard({ session, isActive, onClick }: { session: any, isActive: boolean, onClick: () => void }) {
  const date = new Date(session.date);
  const rounds = [session.rounds?.screening, session.rounds?.technical, session.rounds?.behavioral];
  const scores = rounds
    .map((r: any) => r?.averageScore)
    .filter((s: any) => typeof s === 'number') as number[];
  const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col gap-2 ${
        isActive 
          ? "bg-[#cbe557]/[0.03] border-[#cbe557]/40 shadow-[0_0_30px_-10px_rgba(203,229,87,0.15)]" 
          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
      }`}
    >
      {isActive && <div className="absolute inset-0 bg-gradient-to-r from-[#cbe557]/10 to-transparent opacity-20 pointer-events-none" />}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 ${isActive ? "bg-[#cbe557]" : "bg-transparent"}`} />

      <div className="flex justify-between items-start pl-3 w-full relative z-10">
        <div className="min-w-0 flex-1 mr-2">
          <p className={`text-sm font-bold tracking-tight truncate transition-colors ${isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"}`}>
            Interview Session
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-neutral-600 uppercase tracking-wider">
            <span className="truncate">{date.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}</span>
          </div>
        </div>
        
        <div className={`px-2 py-0.5 rounded text-[10px] font-black border backdrop-blur-md shrink-0 ${
            avg >= 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
            avg >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
            'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {avg > 0 ? `${avg}%` : 'N/A'}
        </div>
      </div>
    </button>
  );
}

function SectionWrapper({ title, icon, sectionId, expanded, onToggle, children }: any) {
  return (
    // relative z-0 here ensures this block creates its own stacking context but doesn't float above sticky headers
    <div className={`
      rounded-2xl border overflow-hidden transition-all duration-500 ease-in-out relative z-0
      ${expanded 
        ? 'bg-neutral-900/60 border-white/10 shadow-lg backdrop-blur-xl ring-1 ring-white/5' 
        : 'bg-neutral-900/20 border-white/5 hover:border-white/10 hover:bg-neutral-900/40'
      }
    `}>
      <button
        onClick={() => onToggle(sectionId)}
        className="w-full px-6 py-5 flex items-center justify-between group cursor-pointer relative z-10 focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 border shrink-0
            ${expanded 
              ? "bg-[#cbe557] text-black border-[#cbe557]" 
              : "bg-white/5 text-neutral-500 border-white/5 group-hover:border-white/10"
            }
          `}>
            {icon || <Activity size={20} />}
          </div>
          <h2 className={`text-base font-bold tracking-tight text-left transition-colors duration-300 ${expanded ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"}`}>
            {title}
          </h2>
        </div>
        <div className={`p-2 rounded-full transition-all duration-500 shrink-0 ${expanded ? 'bg-white/5 text-[#cbe557] rotate-180' : 'text-neutral-600 group-hover:text-neutral-400'}`}>
           <ChevronDown className="w-4 h-4" />
        </div>
      </button>
      
      <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
            <div className="px-6 pb-6 pt-2 border-t border-white/5">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
}