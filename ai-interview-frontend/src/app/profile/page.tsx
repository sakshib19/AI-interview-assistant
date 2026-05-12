"use client";

import React, { ReactNode, useEffect, useState, useMemo } from "react";
import { useProfile, type DashboardData, type InterviewSession } from "../hooks/useProfile";
import { useAuth } from "../context/AuthContext";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// --- COMPONENTS ---
import SessionOverview from "./components/SessionOverview";
import IntegrityProctoringLog from "./components/IntegrityProctoringLog";
import ExportReports from "./components/ExportReports";
import RoundWiseAnalysis from "./components/RoundWiseAnalysis"; 

import { 
  ChevronDown, 
  Activity, 
  LayoutDashboard,
  Loader2,
  User,
  ShieldCheck,
  Zap,
  FileText,
  TrendingUp,
  Target,
  Award,
  Clock,
  LogOut // <-- Added LogOut icon
} from "lucide-react";

// --- TYPES ---
export type DetailedRound = {
  score: number;
  status: "Pass" | "Weak" | "Failed";
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
};

export type SessionDetail = {
  sessionId: string;
  finalVerdict: string;
  confidence: number;
  duration: number;
  totalQuestions: number;
  violationCount: number;
  grayZoneCount?: number;
  recommendedRole?: string;
  startedAt: string;
  endedAt?: string;
  overallScore?: number; // Added for UI badges
  rounds: {
    screening?: DetailedRound;
    technical?: DetailedRound;
    behavioral?: DetailedRound;
  };
  violations: ViolationData[];
};

export type ViolationData = {
  id?: string | number;
  type: string;
  reason: string;
  action?: string;
  at: string;
};

type RawRound = {
  score?: number;
  feedback?: string;
  strengths?: string[];
  weaknesses?: Array<string | { topic?: string }>;
  recommendation?: string;
};

type RawSession = InterviewSession & {
  metadata?: {
    round_summaries?: Partial<Record<"screening" | "technical" | "behavioral", RawRound>>;
  };
  finalVerdict?: string;
  decisionConfidence?: number;
  overallScore?: number;
  grayZoneCount?: number;
  recommendedRole?: string;
  endedAt?: string;
  events?: ViolationData[];
};

export default function ProfilePage() {
  const { fetchDashboard } = useProfile();
  const { token, logout } = useAuth(); // <-- Added logout from useAuth()

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["overview", "analysis"]) // Keep main sections open by default
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
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

  // --- TRANSFORMATION LOGIC ---
  const selectedSession = useMemo<SessionDetail | null>(() => {
    if (!data?.interviewHistory?.length) return null;
    
    const currentSession = data.interviewHistory[selectedIndex];
    const rawSession = currentSession as RawSession; 
    
    const summaries = rawSession.metadata?.round_summaries || {};

    const transformRound = (roundData?: RawRound): DetailedRound | undefined => {
      if (!roundData) return undefined;
      const score = roundData.score || 0;
      return {
        score: score,
        status: score >= 0.8 ? "Pass" : score >= 0.6 ? "Weak" : "Failed",
        feedback: roundData.feedback || "No specific feedback generated.",
        strengths: Array.isArray(roundData.strengths) ? roundData.strengths : [],
        weaknesses: Array.isArray(roundData.weaknesses) 
          ? roundData.weaknesses.map((w) => typeof w === 'string' ? w : w.topic || "Unspecified area") 
          : [],
        recommendation: roundData.recommendation || "Review core concepts."
      };
    };
    
    return {
        sessionId: currentSession.sessionId,
        finalVerdict: rawSession.finalVerdict || "Pending",
        confidence: rawSession.decisionConfidence || 0,
        duration: 45, 
        overallScore: rawSession.overallScore || 0, // Fallback safely
        totalQuestions: rawSession.qaIds?.length || 0,
        violationCount: rawSession.violationCount || 0,
        grayZoneCount: rawSession.grayZoneCount || 0,
        recommendedRole: rawSession.recommendedRole,
        violations: rawSession.events || [], 
        startedAt: currentSession.date,
        endedAt: rawSession.endedAt,
        rounds: {
          screening: transformRound(summaries.screening),
          technical: transformRound(summaries.technical),
          behavioral: transformRound(summaries.behavioral)
        }
    } as SessionDetail;
  }, [data, selectedIndex]);

  // --- KPI CALCULATIONS ---
  const kpiStats = useMemo(() => {
    if (!data?.interviewHistory?.length) return null;
    const history = data.interviewHistory as RawSession[];
    
    const scores = history.map(h => h.overallScore || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);
    
    // Prepare trend data for Recharts (reverse to show chronological order)
    const trendData = [...history].reverse().map((h, i) => ({
      name: `Session ${i + 1}`,
      score: Math.round((h.overallScore || 0) * 100),
      date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    return { avgScore, highestScore, total: history.length, trendData };
  }, [data]);

  // --- RENDER HELPERS ---
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (score >= 0.6) return "text-[#cbe557] bg-[#cbe557]/10 border-[#cbe557]/20";
    if (score > 0) return "text-red-400 bg-red-400/10 border-red-400/20";
    return "text-neutral-500 bg-neutral-800 border-neutral-700";
  };

  if (!token) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-neutral-500">Please log in.</div>;
  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#cbe557]"><Loader2 className="animate-spin" /></div>;
  if (error || !data) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20 relative font-sans selection:bg-[#cbe557] selection:text-black overflow-x-hidden">
      
      {/* Background & Header */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-[#cbe557]/[0.03] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/90 backdrop-blur-2xl shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <LayoutDashboard className="text-[#cbe557]" size={22} />
                <h1 className="text-xl font-bold tracking-tight">Candidate Profile</h1>
             </div>
             
             {/* Header Right: User Info & Logout */}
             <div className="flex items-center gap-3">
               <span className="text-sm font-medium text-neutral-400 hidden sm:block">{data.user.name || "Candidate"}</span>
               <div className="h-9 w-9 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 border border-white/10 flex items-center justify-center text-sm font-black text-[#cbe557] shadow-inner">
                 {data.user.name?.[0] || "C"}
               </div>
               {/* --- LOGOUT BUTTON --- */}
               <button
                 onClick={logout}
                 className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors"
                 title="Log out"
               >
                 <LogOut size={14} />
                 <span className="hidden sm:inline">Logout</span>
               </button>
             </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        
        {/* --- GLOBAL KPI DASHBOARD --- */}
        {kpiStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-sm">
              <div className="p-3 bg-[#cbe557]/10 rounded-xl text-[#cbe557]"><Target size={24} /></div>
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Average Score</p>
                <h3 className="text-2xl font-black">{Math.round(kpiStats.avgScore * 100)}%</h3>
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-sm">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Activity size={24} /></div>
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Interviews</p>
                <h3 className="text-2xl font-black">{kpiStats.total}</h3>
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-sm">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><Award size={24} /></div>
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Peak Performance</p>
                <h3 className="text-2xl font-black">{Math.round(kpiStats.highestScore * 100)}%</h3>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- SIDEBAR (SESSION LIST) --- */}
          <aside className="lg:col-span-4 min-w-0 lg:sticky lg:top-24 space-y-4">
            <h2 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <Clock size={14} /> Session History
            </h2>
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
              {data.interviewHistory.map((session: RawSession, idx: number) => {
                const isActive = idx === selectedIndex;
                const score = session.overallScore || 0;
                const scoreClass = getScoreColor(score);
                
                return (
                  <button 
                    key={session.sessionId} 
                    onClick={() => setSelectedIndex(idx)} 
                    className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group flex items-center justify-between ${isActive ? "bg-[#cbe557]/5 border-[#cbe557]/40 shadow-lg shadow-[#cbe557]/5" : "bg-neutral-900/50 border-white/5 hover:bg-neutral-800 hover:border-white/10"}`}
                  >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#cbe557] shadow-[0_0_10px_#cbe557]" />}
                    
                    <div>
                      <p className={`text-sm font-bold tracking-wide ${isActive ? "text-white" : "text-neutral-300 group-hover:text-white transition-colors"}`}>
                        Interview Session
                      </p>
                      <p className="text-xs text-neutral-500 mt-1.5 font-medium flex items-center gap-1.5">
                         {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div className={`px-2.5 py-1 rounded-md text-xs font-black border ${scoreClass}`}>
                      {score > 0 ? `${Math.round(score * 100)}%` : 'N/A'}
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* --- MAIN CONTENT --- */}
          <section className="lg:col-span-8 min-w-0 space-y-6">
            
            {/* --- TREND VISUALIZATION --- */}
            {kpiStats && kpiStats.trendData.length > 1 && (
              <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm mb-2">
                <h3 className="text-sm font-bold text-neutral-400 mb-6 flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#cbe557]" /> Progress Trend
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiStats.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#cbe557', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#cbe557" 
                        strokeWidth={3}
                        dot={{ fill: '#050505', stroke: '#cbe557', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#cbe557', stroke: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

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

                <SectionWrapper
                  title="Detailed Performance Analysis"
                  icon={<Zap size={18} />}
                  sectionId="analysis"
                  expanded={expandedSections.has("analysis")}
                  onToggle={toggleSection}
                >
                  <RoundWiseAnalysis rounds={selectedSession.rounds} />
                </SectionWrapper>

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
              <div className="h-96 flex flex-col items-center justify-center text-neutral-500 border border-dashed border-white/10 rounded-3xl bg-neutral-900/20 backdrop-blur-sm">
                <User size={48} className="mb-4 opacity-20" />
                <p className="font-medium tracking-wide">Select a session to view the performance report</p>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}

// --- UTILS ---
type SectionWrapperProps = {
  title: string;
  icon: ReactNode;
  sectionId: string;
  expanded: boolean;
  onToggle: (section: string) => void;
  children: ReactNode;
};

function SectionWrapper({ title, icon, sectionId, expanded, onToggle, children }: SectionWrapperProps) {
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-500 relative z-0 ${expanded ? 'bg-neutral-900/60 border-white/10 shadow-2xl backdrop-blur-xl' : 'bg-neutral-900/30 border-white/5 hover:border-white/10'}`}>
      <button 
        onClick={() => onToggle(sectionId)} 
        className="w-full px-6 py-5 flex items-center justify-between group cursor-pointer relative z-10 focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors shadow-sm ${expanded ? "bg-[#cbe557] text-black border-[#cbe557] shadow-[0_0_15px_rgba(203,229,87,0.3)]" : "bg-white/5 text-neutral-400 border-white/5 group-hover:bg-white/10"}`}>
            {icon}
          </div>
          <h2 className={`text-base font-bold tracking-wide ${expanded ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"}`}>{title}</h2>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${expanded ? 'rotate-180 text-[#cbe557]' : 'text-neutral-500 group-hover:text-white'}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-500 ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-6 pb-8 pt-2 border-t border-white/5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}