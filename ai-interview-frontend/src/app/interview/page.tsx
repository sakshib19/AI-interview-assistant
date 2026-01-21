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
import { AudioVisualizer } from "../components/AudioVisualizer";
import InterviewConfigModal from "../components/InterviewConfigModal";
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
  Settings,
  ChevronUp,
  ChevronDown,
  Clock,     // <--- NEW
  Database,
  Bug,
  Layers,
  Sparkle,
  Terminal,
  Trash2,
  Timer
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

  console.log("🔍 Roadmap Data:", plan);

  const getTheme = () => {
    const t = (title || "").toLowerCase();
    if (t.includes("advanced") || t.includes("mastery")) {
      return {
        bg: "bg-gradient-to-br from-amber-600/20 via-orange-600/20 to-red-600/20 border-amber-500/30",
        icon: "text-amber-400",
        border: "border-amber-500/30",
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        accent: "text-amber-400"
      };
    }
    if (t.includes("recovery") || t.includes("foundations")) {
      return {
        bg: "bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20 border-blue-500/30",
        icon: "text-blue-400",
        border: "border-blue-500/30",
        badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        accent: "text-blue-400"
      };
    }
    // Default Lime Theme
    return {
      bg: "bg-gradient-to-br from-[#cbe557]/20 via-emerald-600/20 to-teal-600/20 border-[#cbe557]/30",
      icon: "text-[#cbe557]",
      border: "border-[#cbe557]/30",
      badge: "bg-[#cbe557]/10 text-[#cbe557] border-[#cbe557]/30",
      accent: "text-[#cbe557]"
    };
  };

  const theme = getTheme();
  const displayTitle = title || "Personalized Study Roadmap";

  const findSchedule = (obj: any): any[] => {
    if (!obj || typeof obj !== 'object') return [];
    const keys = Object.keys(obj);
    const planKey = keys.find(k => k.toLowerCase().includes('weekly') && k.toLowerCase().includes('plan'));
    if (planKey && Array.isArray(obj[planKey])) return obj[planKey];
    if (obj.roadmap && typeof obj.roadmap === 'object') return findSchedule(obj.roadmap);
    if (obj.Roadmap && typeof obj.Roadmap === 'object') return findSchedule(obj.Roadmap);
    if (obj.plan && typeof obj.plan === 'object') return findSchedule(obj.plan);
    return [];
  };
  
  const schedule = findSchedule(plan);
  const assessment = plan.overall_assessment || plan.roadmap?.overall_assessment || plan.assessment || "Here is your personalized growth plan based on the interview results.";
  const radar = plan.skill_radar || plan.roadmap?.skill_radar || plan.skills || null;

  return (
    <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-neutral-900/50 rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Modern Header with Glassmorphism */}
        <div className={`${theme.bg} p-10 relative overflow-hidden border-b ${theme.border}`}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl backdrop-blur-md border border-white/10 bg-white/5 ${theme.icon}`}>
                <Map size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl font-black tracking-tight text-white">{displayTitle}</h2>
            </div>
            <p className="text-neutral-300 text-lg leading-relaxed max-w-4xl font-medium">
              {assessment}
            </p>
          </div>
          {/* Decorative Elements */}
          <div className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 ${theme.bg}`}></div>
        </div>

        <div className="p-10">
          {/* Modern Skill Radar with Cards */}
          {radar && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Target size={22} className={theme.accent} strokeWidth={2.5} />
                <h3 className="font-black text-2xl text-white">Skill Gap Analysis</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(radar).map(([skill, score]: [string, any]) => {
                  const percentage = Math.round(Number(score) * 100);
                  const isStrong = percentage > 70;
                  const isMid = percentage > 40;
                  
                  return (
                    <div key={skill} className="group bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 shadow-lg">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-bold text-neutral-300 text-sm uppercase tracking-wide">
                          {skill.replace(/_/g, " ")}
                        </span>
                        <span className={`text-2xl font-black ${isStrong ? 'text-emerald-400' : isMid ? 'text-amber-400' : 'text-rose-400'}`}>
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${isStrong ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : isMid ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-rose-500 to-red-500'}`}
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modern Timeline */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 pb-6 border-b border-white/10">
              <Calendar size={22} className={theme.accent} strokeWidth={2.5} />
              <h3 className="font-black text-2xl text-white">Actionable Schedule</h3>
            </div>
            
            {schedule.length === 0 ? (
               <div className="text-center p-12 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                 <div className="text-neutral-500 mb-2">
                   <Sparkles size={48} className="mx-auto opacity-50" />
                 </div>
                 <p className="text-neutral-400 font-medium">No specific schedule generated.</p>
                 <p className="text-xs mt-2 text-neutral-600">(Check console for debug data)</p>
               </div>
            ) : (
              <div className="space-y-6">
                {schedule.map((week: any, wIdx: number) => (
                  <WeekCard key={wIdx} week={week} theme={theme} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Week Card Component with Expand/Collapse
const WeekCard = ({ week, theme }: any) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden bg-black/20 ${theme.border} hover:bg-black/40`}>
      <div 
        className="p-6 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg border border-white/10 ${theme.bg.split(' ')[0]} ${theme.icon} backdrop-blur-md`}>
              {week.week}
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">{week.theme}</h4>
              <div className="flex flex-wrap gap-2">
                {week.goals?.slice(0, 2).map((g: string, i: number) => (
                  <span key={i} className={`text-xs font-bold px-3 py-1 rounded-full border ${theme.badge}`}>
                    🎯 {g}
                  </span>
                ))}
                {week.goals?.length > 2 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-neutral-400 border border-white/10">
                    +{week.goals.length - 2} more
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-neutral-500">
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {week.daily_tasks?.map((task: any, dIdx: number) => (
            <div key={dIdx} className="bg-white/5 p-5 rounded-xl border border-white/10 hover:border-white/20 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-black/40 ${theme.accent}`}>
                  {task.day}
                </span>
              </div>
              <p className="font-medium text-neutral-200 mb-4 text-base leading-relaxed">{task.activity}</p>
              
              <div className="space-y-2">
                {task.resources?.map((res: any, rIdx: number) => (
                  <a 
                    key={rIdx} 
                    href={res.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-3 rounded-lg bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/20 transition-all group/link"
                  >
                    <div className={`shrink-0 p-2 rounded-lg ${res.type === 'video' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {res.type === 'video' ? <Video size={18} /> : <BookOpen size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-neutral-300 group-hover/link:text-white truncate transition-colors">
                        {res.title}
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-neutral-500 group-hover/link:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
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
const StructuredFeedback = ({ diagnosis }: { diagnosis?: any }) => {
  // Only render if we have meaningful data
  if (!diagnosis || (!diagnosis.win && !diagnosis.gap?.issue)) return null;

  const { win, gap, fix, sub_topics } = diagnosis;

  return (
    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
      {/* 1. TOPICS BADGES */}
      {sub_topics && sub_topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {sub_topics.map((t: any, i: number) => (
            <span 
              key={i} 
              className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                (t.confidence || 0) > 0.7 
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {t.name || t}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 2. WIN (Green) */}
        {win && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-r-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
              <CheckCircle size={12} /> Strength
            </div>
            <p className="text-sm text-emerald-900 leading-snug">{win}</p>
          </div>
        )}

        {/* 3. GAP (Amber/Red) */}
        {gap?.issue && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
              <AlertCircle size={12} /> Gap Detected
            </div>
            <p className="text-sm text-amber-900 leading-snug font-medium">{gap.issue}</p>
            {gap.expected_level && (
              <div className="mt-2 pt-2 border-t border-amber-200 text-xs text-amber-700 grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold block text-[10px] uppercase opacity-70">Expected</span>
                  <span className="font-mono">{gap.expected_level}</span>
                </div>
                <div>
                  <span className="font-bold block text-[10px] uppercase opacity-70">Observed</span>
                  <span className="font-mono">{gap.observed}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. FIX (Blue) */}
        {(fix?.action || fix) && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Zap size={12} /> Action Plan
            </div>
            <p className="text-sm text-blue-900 leading-snug">{fix?.action || fix}</p>
            {fix?.resource_type && (
              <span className="inline-block mt-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase font-bold border border-blue-200">
                {fix.resource_type}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
const ComplexityFeedback = ({ analysis }: { analysis?: any }) => {
  if (!analysis || analysis.verdict === "NOT_PROVIDED") return null;

  const isMatch = analysis.verdict === "MATCH";
  const isPartial = analysis.verdict === "PARTIAL_MATCH";
  const isMismatch = analysis.verdict === "MISMATCH";

  const borderColor = isMatch
    ? "border-emerald-200 bg-emerald-50/50"
    : isPartial
    ? "border-amber-200 bg-amber-50/50"
    : "border-rose-200 bg-rose-50/50";

  const textColor = isMatch
    ? "text-emerald-800"
    : isPartial
    ? "text-amber-800"
    : "text-rose-800";

  return (
    <div className={`mt-4 mb-4 rounded-xl border-2 ${borderColor} p-4 animate-in fade-in slide-in-from-bottom-2`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${textColor}`}>
          <Target size={14} /> Complexity Analysis
        </h4>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${
            isMatch
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : isPartial
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-rose-100 text-rose-700 border-rose-200"
          }`}
        >
          {analysis.verdict.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Time Complexity */}
        <div className="bg-white/60 rounded-lg p-3 border border-slate-200/60">
          <div className="flex items-center gap-2 mb-2 text-slate-500 font-bold text-xs uppercase">
            <Clock size={12} /> Time Complexity
          </div>
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-[10px] text-slate-400 block">You Claimed</span>
              <span className="font-mono font-bold text-slate-700">
                {analysis.claimed_time || "N/A"}
              </span>
            </div>
            <ArrowRight size={14} className="text-slate-300" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Actual</span>
              <span className="font-mono font-bold text-indigo-600">
                {analysis.actual_time}
              </span>
            </div>
          </div>
        </div>

        {/* Space Complexity */}
        <div className="bg-white/60 rounded-lg p-3 border border-slate-200/60">
          <div className="flex items-center gap-2 mb-2 text-slate-500 font-bold text-xs uppercase">
            <Database size={12} /> Space Complexity
          </div>
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-[10px] text-slate-400 block">You Claimed</span>
              <span className="font-mono font-bold text-slate-700">
                {analysis.claimed_space || "N/A"}
              </span>
            </div>
            <ArrowRight size={14} className="text-slate-300" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Actual</span>
              <span className="font-mono font-bold text-indigo-600">
                {analysis.actual_space}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const TranscriptCard = ({ h, idx, renderScoreBadge }: { h: any, idx: number, renderScoreBadge: any }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Check if this specific history item was a debugging task
  const isDebugging = h.type === 'debugging' || (h.q?.metadata?.type === 'debugging');

  return (
    <div 
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isDebugging 
          ? "bg-amber-950/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" // Dark Amber for Debugging
          : "bg-white/5 border-white/10 hover:border-white/20 shadow-lg" 
      }`}
    >
      <div 
        className="p-6 cursor-pointer select-none hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex gap-5 items-start">
          {/* Question Number / Icon Box */}
          <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${
            isDebugging 
              ? "bg-amber-500 text-black shadow-amber-500/20" 
              : "bg-[#cbe557] text-neutral-900 shadow-[#cbe557]/20"
          }`}>
            {isDebugging ? <Bug size={24} /> : `Q${idx + 1}`}
          </div>

          <div className="flex-1">
            <div className="font-bold text-white text-xl leading-tight">
              {h.q?.questionText || "Question text missing"}
            </div>
            
            {/* Debugging Badge */}
            {isDebugging && (
               <span className="inline-flex items-center mt-3 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-900/30 px-3 py-1 rounded-lg border border-amber-500/30">
                 <Bug size={12} className="mr-1.5" /> Debugging Task
               </span>
            )}
          </div>

          <div className="text-neutral-500 shrink-0">
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* User Answer Area - Terminal Style */}
          <div className="bg-black/40 p-5 rounded-xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#cbe557]/50"></div>
            <div className="flex items-center gap-2 mb-3">
              <Code size={16} className="text-[#cbe557]" />
              <span className="text-xs font-black text-neutral-400 uppercase tracking-wider">Your Answer</span>
            </div>
            <div className="text-neutral-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {String(h.a || "")}
            </div>
          </div>

          {/* Code Replay (if available) */}
          {((h.result as any)?.playback_history?.length > 0 || (h as any).playback_history?.length > 0) && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <div className="text-xs font-bold text-neutral-500 uppercase mb-2 flex items-center gap-1">
                <Video size={14} className="text-[#cbe557]" /> Code Process Replay
              </div>
              <CodeReplayPlayer 
                history={(h.result as any)?.playback_history || (h as any).playback_history} 
              />
            </div>
          )}

          {/* AI Analysis Results */}
          {h.result && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 flex-wrap p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 font-black uppercase tracking-wider">Score</span>
                  {/* Ensure renderScoreBadge returns dark-mode compatible classes or wrap it */}
                  <div className="scale-110 origin-left">
                    {renderScoreBadge(h.result.overall_score)}
                  </div>
                </div>
                
                {h.result.verdict && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 font-black uppercase tracking-wider">Verdict</span>
                    <span className={`text-sm font-black px-4 py-2 rounded-xl uppercase tracking-wider border backdrop-blur-md ${
                      h.result.verdict === "strong" || h.result.verdict === "exceptional" 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      h.result.verdict === "acceptable" 
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    }`}>
                      {h.result.verdict}
                    </span>
                  </div>
                )}
              </div>

              {/* Complexity Feedback (for code questions) */}
              {h.result.complexity_analysis && (
                <ComplexityFeedback analysis={h.result.complexity_analysis} />
              )}

              {/* Technical Diagnosis */}
              <StructuredFeedback diagnosis={h.result.technical_diagnosis} />

              {/* Improvement / Feedback Text - Lime Theme */}
              {(!h.result.technical_diagnosis?.win && !h.result.technical_diagnosis?.gap?.issue && h.result.improvement) && (
                <div className="bg-[#cbe557]/5 p-5 rounded-xl border-l-4 border-[#cbe557]">
                  <div className="flex items-start gap-3">
                    <Lightbulb size={18} className="text-[#cbe557] mt-0.5" />
                    <div>
                      <span className="font-bold text-white block mb-2">Feedback</span>
                      <p className="text-neutral-300 leading-relaxed">{h.result.improvement}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Rationale */}
              {h.result.rationale && (
                <div className="text-xs text-neutral-500 italic border-t border-white/10 pt-3 mt-2">
                  <span className="font-bold text-neutral-400 not-italic mr-1">Rationale:</span>
                  {h.result.rationale}
                </div>
              )}

              {/* Red Flags */}
              {h.result.red_flags_detected && h.result.red_flags_detected.length > 0 && (
                <div className="bg-rose-950/30 p-5 rounded-xl border border-rose-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-rose-500 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-400 block mb-2">Red Flags Detected</span>
                      <p className="text-rose-300/90 text-sm">{h.result.red_flags_detected.join(", ")}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
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
const [roundSummary, setRoundSummary] = useState<any>(null); // Stores data from /feedback/round
const [loadingRoundFeedback, setLoadingRoundFeedback] = useState(false);
const [finalReport, setFinalReport] = useState<any>(null); // Stores data from /feedback/final
const [loadingFinalReport, setLoadingFinalReport] = useState(false);
const [showConfigModal, setShowConfigModal] = useState(false); // <--- NEW
const [lastDiagnosis, setLastDiagnosis] = useState<any>(null); // <--- NEW
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
// --- FETCH ROUND FEEDBACK ---
const fetchRoundFeedback = useCallback(async (finishedRound: string) => {
  if (!sessionId || !token) return;
  setLoadingRoundFeedback(true);
  try {
    const res = await fetch(`${API}/interview/feedback/round`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId, round: finishedRound }),
    });
    const data = await res.json();
    if (data.summary) {
      setRoundSummary(data.summary);
    }
  } catch (err) {
    console.error("Failed to fetch round feedback", err);
  } finally {
    setLoadingRoundFeedback(false);
  }
}, [sessionId, token, API]);

// --- FETCH FINAL REPORT ---
const fetchFinalReport = useCallback(async () => {
  if (!sessionId || !token) return;
  
  // 1. Set Loading State
  setLoadingFinalReport(true);

  const fetchWithRetry = async (retries = 3, delay = 1000) => {
    try {
      console.log(`📄 Fetching Final Report... (${retries} attempts left)`);
      const res = await fetch(`${API}/interview/feedback/final/${sessionId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Report not ready");
      
      const data = await res.json();
      
      // Validation: Ensure we actually have a verdict
      // If verdict is missing, treat as incomplete and retry
      if (!data.overall?.verdict && retries > 0) {
        throw new Error("Incomplete data");
      }

      console.log("✅ Final Report Loaded:", data);
      
      // 2. Update Data
      setFinalReport(data);
      
      // 3. FORCE Loading Off (Success Path)
      setLoadingFinalReport(false); 
      
    } catch (err) {
      if (retries > 0) {
        console.warn(`⚠️ Report fetch failed, retrying in ${delay}ms...`);
        setTimeout(() => fetchWithRetry(retries - 1, delay), delay);
      } else {
        console.error("❌ Failed to load final report after retries", err);
        // 4. FORCE Loading Off (Failure Path) - shows partial data or error
        setLoadingFinalReport(false); 
      }
    }
  };

  await fetchWithRetry();
}, [sessionId, token, API]);// Trigger Final Report when stage becomes "done"
// Trigger Final Report when stage becomes "done"
useEffect(() => {
  // Only auto-fetch if we don't have the report and aren't currently loading it
  if (stage === "done" && !finalReport && !loadingFinalReport) {
    console.log("🎬 Interview done. Waiting for AI generation to finish writing to DB...");
    
    // ⏳ DELAY FIX: Wait 2.5 seconds before fetching.
    // This prevents getting the "hardcoded" fallback data while the AI is still thinking.
    const timer = setTimeout(() => {
        console.log("🚀 Fetching final report now...");
        fetchFinalReport();
    }, 2500); 

    return () => clearTimeout(timer);
  }
}, [stage, finalReport, loadingFinalReport, fetchFinalReport]);
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
      // Accept either a string (old way) or the Config Object (new way)
      arg1: string | { role_title: string; company_style: string } = "Technical Interview",
      difficulty: string = "medium",
      techStack: string = ""
    ) => {
      
      // 1. Set Defaults
      let jobTitle = "Technical Interview";
      let roleTitle = "Backend Engineer"; // Default fallback
      let companyStyle = "FAANG";         // Default fallback

      // 2. 🧠 SMART ARGUMENT PARSING
      // If arg1 is the object from your Modal:
      if (typeof arg1 === 'object' && arg1 !== null && 'role_title' in arg1) {
         roleTitle = arg1.role_title;
         companyStyle = arg1.company_style;
         jobTitle = roleTitle; // Use role as job title
         console.log("✅ Configuration applied:", { roleTitle, companyStyle });
      } 
      // If arg1 is just a string (from Resume Uploader):
      else if (typeof arg1 === 'string') {
         jobTitle = arg1;
      }

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

        // 🚨 CRITICAL FIX: Use the FULL CONTEXT if available
        const richContext = (resumeParsed as any)?.full_context_for_prompt || resumeParsed?.summary || "";

        // STEP 3: Call backend
        const startPayload: any = {
          jobTitle,
          difficulty,
          techStack,
          resume_summary: richContext,
          allow_pii: false,
          referenceImage: capturedImage,
          
          // Send at root level (for legacy support)
          role_title: roleTitle,
          company_style: companyStyle,
          
          // 👇 CRITICAL FIX: Send inside 'options' for the Python Backend
          options: {
              role_title: roleTitle,
              company_style: companyStyle
          }
        };

        const startUrl = `${API || ""}/interview/start`;
        console.log("🚀 Starting interview payload:", startPayload);
        
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
          setLastDiagnosis(null);
          
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
  );  /* -------------------------
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
// 1. Handle Diagnosis (Instant Feedback)
      if (result?.technical_diagnosis) {
        setLastDiagnosis(result.technical_diagnosis);
      } else {
        setLastDiagnosis(null);
      }

      // 2. 🚨 CHECK FOR ELIMINATION / ENDED FIRST 🚨
      // If eliminated, the hook sets stage="done". We must stop here.
      if (result?.eliminated || result?.ended) {
        console.log("🛑 Interview Ended via Answer Response");
        // Force a fetch of the report after a short delay to allow DB save
        setTimeout(() => fetchFinalReport(), 2000); 
        return; 
      }

      // 3. Handle Round Transition
      const newRoundData = result?.round_info || result?.metadata;
      
      // ✅ FIX: Normalize strings for comparison to catch "Screening" vs "screening"
      const prevRound = (currentRound || "").toLowerCase().trim();
      const nextRoundRaw = (newRoundData?.current || newRoundData?.current_round || "").trim();
      const nextRound = nextRoundRaw.toLowerCase();

      // 🔍 Debug Log: Check your console to see exactly what is being compared
      console.log(`🔄 Round Transition Check: '${prevRound}' -> '${nextRound}'`);

      const isRoundChange = 
          nextRound && 
          nextRound !== prevRound && 
          nextRound !== "complete" && 
          nextRound !== "completed";

      if (isRoundChange) {
        console.log("🚀 TRANSITION DETECTED: Opening Modal");
        
        setNextRoundName(nextRoundRaw); // Store the nice looking name (e.g. "Technical")
        setRoundSummary(null);
        setShowRoundModal(true);
        
        // Fetch feedback for the round we just FINISHED (the currentRound state)
        fetchRoundFeedback(currentRound); 
        
        // Update progress bars in background, but DON'T change currentRound state yet
        if (newRoundData.progress) setRoundProgress(newRoundData.progress);
        
        // 🛑 RETURN EARLY: This prevents the UI from switching rounds immediately.
        // The switch happens when the user clicks the button in the modal.
        return; 
      }

      // 4. Normal Question Update (No Round Change)
      if (newRoundData) {
        setCurrentRound(nextRoundRaw || currentRound);
        if (newRoundData.progress) setRoundProgress(newRoundData.progress);
      }

    } catch (e) {
      console.error("Submit error:", e);
    }
  };

  // Helper for the modal button
  const handleNextRound = () => {
      setShowRoundModal(false);
      setCurrentRound(nextRoundName); // Update badge to new round only when user clicks
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="max-w-2xl w-full bg-white rounded-2xl p-8 shadow-2xl border border-slate-200 relative overflow-hidden">
        
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center shadow-inner border-4 border-white ring-2 ring-indigo-100">
            <CheckCircle size={40} className="text-indigo-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-2 capitalize">
            {currentRound} Round Complete
          </h3>
          <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-1 rounded-full">
            <span className="text-slate-500 font-medium text-sm">Next Stage:</span>
            <span className="text-indigo-700 font-bold uppercase tracking-wide text-sm">{nextRoundName}</span>
          </div>
        </div>

        {/* Feedback Container */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8 min-h-[160px] relative">
          {loadingRoundFeedback ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <span className="text-sm text-slate-500 font-medium animate-pulse">
                AI is analyzing your {currentRound} performance...
              </span>
            </div>
          ) : roundSummary ? (
            <div className="animate-in slide-in-from-bottom-2 duration-500">
               {/* Score */}
               <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                 <h4 className="font-bold text-slate-700">Round Performance</h4>
                 <div className="flex items-center gap-2">
                   <span className="text-sm text-slate-500">Score:</span>
                   <span className={`text-xl font-black ${
                     (roundSummary.score || 0) > 0.7 ? 'text-emerald-600' : 'text-amber-600'
                   }`}>
                     {Math.round((roundSummary.score || 0) * 100)}%
                   </span>
                 </div>
               </div>
               
               {/* AI Feedback Text */}
               <p className="text-sm text-slate-600 leading-relaxed mb-4">
                 {roundSummary.feedback || "No specific feedback generated."}
               </p>

               {/* Key Strengths Tags */}
               {roundSummary.strengths?.length > 0 && (
                 <div className="flex flex-wrap gap-2">
                   {roundSummary.strengths.slice(0, 3).map((s: string, i: number) => (
                     <span key={i} className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                       ✓ {s}
                     </span>
                   ))}
                 </div>
               )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <AlertCircle size={24} className="mb-2 opacity-50" />
              <span className="text-sm">Feedback unavailable for this round.</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={() => {
                // ✅ UPDATE STATE ONLY ON CLICK
                setShowRoundModal(false);
                setCurrentRound(nextRoundName); 
            }}
            className="group relative inline-flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-slate-800 hover:scale-[1.02] transition-all active:scale-95"
          >
            <span>Start {nextRoundName} Round</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
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
// --- IMPROVED PDF GENERATION LOGIC ---
  const generatePDF = () => {
    if (!finalDecision && !finalReport) return;

    // consolidate data source
    const reportData = finalReport || {};
    const decisionData = finalDecision || {};
    const metricsData = performanceMetrics || {};

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentPage = 1;

    // --- HELPER: COLORS (Fixed Tuples) ---
    // We strictly define these as tuples [r, g, b] to satisfy jspdf-autotable
    const COLORS = {
      primary: [79, 70, 229] as [number, number, number],      // Indigo 600
      primaryLight: [99, 102, 241] as [number, number, number], // Indigo 500
      secondary: [241, 245, 249] as [number, number, number],   // Slate 100
      textMain: [30, 41, 59] as [number, number, number],       // Slate 800
      textLight: [100, 116, 139] as [number, number, number],   // Slate 500
      success: [16, 185, 129] as [number, number, number],      // Emerald
      warning: [245, 158, 11] as [number, number, number],      // Amber
      danger: [239, 68, 68] as [number, number, number],        // Red
    };

    // --- HELPER: HEADER ---
    const drawHeader = (pageNum: number) => {
      // Background Banner
      doc.setFillColor(...COLORS.primary);
      doc.rect(0, 0, pageWidth, 40, "F");

      // Overlay Design
      doc.setFillColor(...COLORS.primaryLight);
      doc.rect(0, 0, pageWidth, 38, "F");

      // Title
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Technical Interview Report", 14, 18);

      // Subtitle with Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(226, 232, 240);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 28);

      // Footer Page Num
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${pageNum}`, pageWidth - 14, pageHeight - 10, { align: "right" });
    };

    // --- HELPER: VERDICT BADGE ---
    const drawVerdictBadge = (verdict: string) => {
      const v = (verdict || "pending").toLowerCase();
      let bg = COLORS.secondary;
      let textCol = COLORS.textMain;
      let label = "PENDING";

      if (v.includes("strong") || v.includes("hire")) {
        bg = COLORS.success;
        textCol = [255, 255, 255] as [number, number, number];
        label = "STRONG HIRE";
      } else if (v.includes("acceptable")) {
        bg = [59, 130, 246] as [number, number, number]; // Blue
        textCol = [255, 255, 255] as [number, number, number];
        label = "ACCEPTABLE";
      } else if (v.includes("weak") || v.includes("reject")) {
        bg = COLORS.danger;
        textCol = [255, 255, 255] as [number, number, number];
        label = "NOT RECOMMENDED";
      }

      const badgeWidth = 50;
      const xPos = pageWidth - badgeWidth - 14;
      
      doc.setFillColor(...bg);
      doc.roundedRect(xPos, 10, badgeWidth, 10, 2, 2, "F");
      
      doc.setTextColor(...textCol);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(label, xPos + (badgeWidth / 2), 16.5, { align: "center" });
    };

    // ================= START PAGE 1 =================
    drawHeader(currentPage);
    drawVerdictBadge(reportData.overall?.verdict || decisionData.verdict);

    let y = 55;

    // --- SECTION 1: METRICS ---
    const score = Math.round((reportData.overall?.score || metricsData.average_score || 0) * 100);
    const duration = reportData.meta?.duration_minutes || "N/A";
    const qCount = history.length;

    // Draw Metric Container
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(14, y, pageWidth - 28, 30, 3, 3, "FD");

    // Metrics Text
    const drawMetric = (label: string, value: string, x: number) => {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.primary);
      doc.text(value, x, y + 12, { align: "center" });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.textLight);
      doc.text(label, x, y + 22, { align: "center" });
    };

    const sectionW = (pageWidth - 28) / 3;
    drawMetric("Overall Score", `${score}%`, 14 + (sectionW / 2));
    drawMetric("Questions Answered", `${qCount}`, 14 + sectionW + (sectionW / 2));
    drawMetric("Duration (mins)", `${duration}`, 14 + (sectionW * 2) + (sectionW / 2));

    y += 45;

    // --- SECTION 2: EXECUTIVE SUMMARY ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.textMain);
    doc.text("Executive Summary", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
const summaryText = reportData.overall?.feedback_summary || decisionData.feedback_summary || decisionData.reason || "No summary available.";    const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 28);
    doc.text(splitSummary, 14, y);
    y += (splitSummary.length * 5) + 15;

    // --- SECTION 3: SWOT ANALYSIS ---
    const colWidth = (pageWidth - 34) / 2;
    const startY = y;

    // Strengths
    doc.setFillColor(236, 253, 245); // Emerald 50
    doc.roundedRect(14, y, colWidth, 8, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(6, 95, 70); // Emerald 800
    doc.text("Key Strengths", 18, y + 5.5);
    
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const strengths = reportData.details?.key_strengths || decisionData.key_strengths || [];
    strengths.slice(0, 5).forEach((s: string) => {
      const lines = doc.splitTextToSize(`• ${s}`, colWidth - 8);
      doc.text(lines, 18, y);
      y += lines.length * 5;
    });

    // Weaknesses (reset Y)
    let rightY = startY;
    doc.setFillColor(254, 242, 242); // Rose 50
    doc.roundedRect(14 + colWidth + 6, rightY, colWidth, 8, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(153, 27, 27); // Rose 800
    doc.text("Areas for Improvement", 18 + colWidth + 6, rightY + 5.5);

    rightY += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const weaks = reportData.details?.areas_for_improvement || decisionData.critical_weaknesses || [];
    weaks.slice(0, 5).forEach((w: string) => {
      const lines = doc.splitTextToSize(`• ${w}`, colWidth - 8);
      doc.text(lines, 18 + colWidth + 6, rightY);
      rightY += lines.length * 5;
    });

    y = Math.max(y, rightY) + 20;

    // --- SECTION 4: ROADMAP (IF AVAILABLE) ---
    // If we have a roadmap, add a dedicated page
    if (roadmap && roadmap.weekly_plan) {
      doc.addPage();
      currentPage++;
      drawHeader(currentPage);
      
      let rY = 55;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.textMain);
      doc.text(`Recommended Learning Path: ${roadmapTitle || "Personalized Plan"}`, 14, rY);
      rY += 15;

      const schedule = roadmap.weekly_plan || [];
      schedule.forEach((week: any, idx: number) => {
        // Prevent page overflow
        if (rY > pageHeight - 40) {
          doc.addPage();
          currentPage++;
          drawHeader(currentPage);
          rY = 55;
        }

        // Week Header
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, rY, pageWidth - 28, 12, 2, 2, "F");
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.primary);
        doc.text(`Week ${week.week}: ${week.theme}`, 18, rY + 8);
        rY += 20;

        // Goals
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.textMain);
        doc.text("Primary Goals:", 18, rY);
        rY += 6;
        
        doc.setFont("helvetica", "normal");
        (week.goals || []).forEach((goal: string) => {
           doc.text(`• ${goal}`, 22, rY);
           rY += 5;
        });
        rY += 5; // Spacer
      });
    }

    // --- SECTION 5: DETAILED TRANSCRIPT ---
    doc.addPage();
    currentPage++;
    drawHeader(currentPage);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.textMain);
    doc.text("Detailed Question Analysis", 14, 55);

    const tableRows = history.map((h, i) => {
      const qText = h.q?.questionText || "Question text missing";
      const scoreVal = Math.round((h.result?.overall_score || 0) * 100);
      const verdict = (h.result?.verdict || "N/A").toUpperCase();
      
      // Construct detailed feedback string
      let feedbackStr = h.result?.improvement || h.result?.rationale || "";
      
      // FIX 2: Cast result to 'any' to access new properties safely
      const resultAny = h.result as any; 

      // Append Diagnosis if exists
      const diag = resultAny?.technical_diagnosis;
      if (diag) {
        if (diag.gap?.issue) feedbackStr += `\n\nGAP: ${diag.gap.issue}`;
        if (diag.fix?.action) feedbackStr += `\nFIX: ${diag.fix.action}`;
      }

      // Append Complexity Analysis if exists (for code questions)
      // FIX 2 (continued): accessing 'complexity_analysis' safely
      const comp = resultAny?.complexity_analysis;
      let complexityStr = "";
      if (comp) {
        complexityStr = `Time: ${comp.actual_time || "N/A"}\nSpace: ${comp.actual_space || "N/A"}`;
      }

      return [
        `Q${i + 1}`,
        qText,
        complexityStr, // New Column
        `${scoreVal}%`,
        feedbackStr
      ];
    });

    autoTable(doc, {
      startY: 65,
      head: [['#', 'Question', 'Complexity', 'Score', 'Analysis & Feedback']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary, // FIX 1: This is now correctly typed as [number, number, number]
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 10, fontStyle: 'bold' },
        1: { cellWidth: 55 },
        2: { cellWidth: 25, fontSize: 8 }, // Complexity
        3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 'auto' } // Feedback gets remaining space
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        overflow: 'linebreak',
        lineColor: [226, 232, 240]
      },
      didParseCell: (data) => {
        // Color code Score
        if (data.section === 'body' && data.column.index === 3) {
          const val = parseInt(data.cell.raw as string);
          if (val >= 70) data.cell.styles.textColor = COLORS.success;
          else if (val >= 40) data.cell.styles.textColor = COLORS.warning;
          else data.cell.styles.textColor = COLORS.danger;
        }
      },
      didDrawPage: (data) => {
        // Redraw header if autoTable creates new pages
        if (data.pageNumber > currentPage) {
            currentPage = data.pageNumber;
            drawHeader(currentPage);
        }
      }
    });

    // --- FOOTER NOTE ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    if (finalY < pageHeight - 20) {
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.textLight);
        doc.setFont("helvetica", "italic");
        doc.text("Confidential Assessment - Powered by AI Interviewer", 14, finalY);
    }

    doc.save(`Interview_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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

  // Config for round colors (Updated for Dark/Lime Theme)
  const roundConfig: any = {
    screening: { label: "Screening", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
    technical: { label: "Technical", color: "text-[#cbe557] border-[#cbe557]/30 bg-[#cbe557]/10" },
    behavioral: { label: "Behavioral", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
    complete: { label: "Complete", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" }
  };

  const activeConfig = roundConfig[currentRound] || roundConfig.screening;

  return (
    <div className="mb-8 bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-4 animate-in fade-in slide-in-from-top-2 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Active Round Badge */}
        <div className="flex items-center gap-3">
           <div className={`px-5 py-2 rounded-xl font-bold text-sm border backdrop-blur-sm flex items-center gap-2 capitalize tracking-wide shadow-[0_0_15px_rgba(0,0,0,0.2)] ${activeConfig.color}`}>
              {currentRound === 'technical' && <Code size={16}/>}
              {currentRound === 'screening' && <Target size={16}/>}
              {activeConfig.label} Round
           </div>
           
           {isProbeQuestion && (
             <div className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse">
                <HelpCircle size={14} /> Deep Dive
             </div>
           )}
        </div>

        {/* Right: Progress Stats */}
        {roundProgress && (
          <div className="flex items-center gap-2 text-sm">
             {Object.entries(roundProgress).map(([r, d]: any) => {
               const isCurrent = r === currentRound;
               const count = d.questions || 0; 
               
               // Style logic: Dark Mode
               let style = "bg-white/5 text-neutral-500 border-transparent";
               if (isCurrent) style = "bg-white/10 text-white border-white/20 shadow-lg transform scale-105";
               else if (d.status === "passed" || d.status === "completed") style = "bg-[#cbe557]/10 text-[#cbe557] border-[#cbe557]/20";

               return (
                 <div key={r} className={`px-3 py-1.5 rounded-lg border transition-all ${style}`}>
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
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white pb-16 relative overflow-hidden">
  <div className="fixed inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
    <div className="absolute top-[-5%] right-[10%] w-[400px] h-[400px] bg-[#cbe557]/5 rounded-full blur-[150px]" />
    <div className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[150px]" />
  </div>

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


<div className="max-w-6xl mx-auto px-4 sm:px-6">
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

{/* --- HEADER SECTION --- */}
      <div className="mb-8 relative z-10">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-10 w-64 h-64 bg-[#cbe557]/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] -z-10"></div>

        <div className="backdrop-blur-2xl bg-neutral-900/50 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] p-6 rounded-2xl relative overflow-hidden group">
          
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                {/* Icon Glow */}
                <div className="absolute inset-0 bg-[#cbe557] rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                <div className="relative p-4 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md group-hover:border-[#cbe557]/50 transition-colors">
                  <Sparkles className="text-[#cbe557]" size={36} />
                </div>
              </div>

              <div>
<h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                  AI Technical <span className="text-[#cbe557]">Interview</span>
                </h1>
<p className="text-neutral-400 text-base font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#cbe557] rounded-full animate-pulse shadow-[0_0_10px_#cbe557]"></span>
                  Advanced technical assessment
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group/status">
                <div className="absolute inset-0 bg-[#cbe557]/20 rounded-2xl blur-lg opacity-0 group-hover/status:opacity-100 transition-opacity"></div>
                <div className="relative bg-neutral-800/50 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 shadow-lg group-hover/status:border-[#cbe557]/30 transition-all">
                  {stage === "running" ? (
                    <span className="flex items-center gap-3">
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#cbe557] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-[#cbe557] shadow-[0_0_10px_#cbe557]"></span>
                      </span>
                      <span className="font-bold text-lg text-white tracking-wide">
                        Live Session
                      </span>
                    </span>
                  ) : stage === "done" ? (
                    <span className="flex items-center gap-3 text-neutral-200 font-bold">
                      <CheckCircle size={20} className="text-[#cbe557]" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-neutral-400 font-bold">Ready to Start</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PERFORMANCE METRICS DASHBOARD --- */}
      {stage === "running" && performanceMetrics && (
        <div className="mb-6 relative group/metrics z-10">
          
<div className="relative backdrop-blur-xl bg-neutral-900/60 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl p-5 hover:bg-neutral-900/80 hover:border-white/20 transition-all duration-500">
            <div className="flex items-center justify-between flex-wrap gap-6">
              
              {/* Dashboard Title */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#cbe557] to-cyan-400 rounded-xl blur-md opacity-40"></div>
                  <div className="relative p-3 bg-neutral-800 rounded-xl border border-white/10 shadow-xl">
                    <Target size={24} className="text-white" />
                  </div>
                </div>
                <span className="font-bold text-xl text-white tracking-wide">
                  Performance Metrics
                </span>
              </div>

              <div className="flex items-center gap-10 flex-wrap">
                
                {/* Questions Count */}
                <div className="group/stat text-center transform hover:scale-105 transition-all duration-300 cursor-default">
                  <div className="relative mb-2">
<div className="relative text-2xl md:text-3xl font-black text-white group-hover/stat:text-[#cbe557] transition-colors">
                      {performanceMetrics.question_count}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 uppercase tracking-widest font-bold group-hover/stat:text-[#cbe557] transition-colors">
                    Questions
                  </div>
                </div>

                {/* Average Score with Acid Lime Ring */}
                <div className="group/stat relative text-center transform hover:scale-105 transition-all duration-300 cursor-default">
                  <div className="absolute inset-0 bg-[#cbe557]/10 rounded-full blur-xl opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    {/* Circular progress ring */}
                    <svg className="absolute -inset-2 w-20 h-20 -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="none" className="text-neutral-800" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="36" 
                        stroke="url(#limeGradient)" 
                        strokeWidth="4" 
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - performanceMetrics.average_score)}`}
                        className="transition-all duration-1000 drop-shadow-[0_0_4px_rgba(203,229,87,0.5)]"
                      />
                      <defs>
                        <linearGradient id="limeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#cbe557" />
                          <stop offset="100%" stopColor="#ffffff" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="relative text-4xl font-black text-white mb-2">
                      {Math.round(performanceMetrics.average_score * 100)}<span className="text-lg text-neutral-500">%</span>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                    Average
                  </div>
                </div>

                {/* Last Score */}
                {performanceMetrics.last_score !== null && (
                  <div className="text-center transform hover:scale-105 transition-all duration-300 cursor-default">
                    <div className="text-4xl font-black text-neutral-200 mb-2">
                      {Math.round(performanceMetrics.last_score * 100)}<span className="text-lg text-neutral-500">%</span>
                    </div>
                    <div className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                      Last Score
                    </div>
                  </div>
                )}

                {/* Trend with Solid Lime Accent */}
                <div className="relative group/trend">
                  <div className="absolute inset-0 bg-[#cbe557]/20 rounded-2xl blur-md opacity-0 group-hover/trend:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-4 px-6 py-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-[#cbe557]/50 transition-all">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#cbe557] shadow-[0_0_15px_rgba(203,229,87,0.4)] transform group-hover/trend:rotate-12 transition-all duration-300">
                      {/* Using the text-black here for contrast against the Acid Lime */}
                      {renderTrendIcon(performanceMetrics.trend)}
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-black text-white capitalize">
                        {performanceMetrics.trend.replace("_", " ")}
                      </div>
                      <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                        Trend
                      </div>
                    </div>
                  </div>
                </div>

                {/* Streak Indicator */}
                {(performanceMetrics.consecutive_wins > 0 || performanceMetrics.consecutive_fails > 0) && (
                  <div className={`relative group/streak overflow-hidden ${
                    performanceMetrics.consecutive_wins > 0 
                      ? 'bg-gradient-to-br from-[#cbe557]/10 to-transparent border-[#cbe557]/20' 
                      : 'bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20'
                  } px-6 py-4 rounded-2xl border backdrop-blur-sm transform hover:scale-105 transition-all duration-300 cursor-default`}>
                    
                    <div className="relative text-center">
                      <div className={`text-3xl font-black mb-1 drop-shadow-lg ${
                        performanceMetrics.consecutive_wins > 0 ? 'text-[#cbe557]' : 'text-red-400'
                      }`}>
                        {performanceMetrics.consecutive_wins > 0 ? (
                          <span className="inline-flex items-center gap-2">
                            🔥 {performanceMetrics.consecutive_wins}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            ⚠️ {performanceMetrics.consecutive_fails}
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] uppercase tracking-widest font-bold ${
                         performanceMetrics.consecutive_wins > 0 ? 'text-[#cbe557]/80' : 'text-red-400/80'
                      }`}>
                        {performanceMetrics.consecutive_wins > 0 ? 'Win Streak' : 'Needs Focus'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
  onClick={() => setShowConfigModal(true)} // 👈 OPEN MODAL, DON'T START YET
  disabled={loading || imageStatus !== "captured" || startAttemptRef.current}
  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-indigo-300 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
>
  {loading || startAttemptRef.current ? (
    <>
      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      <span>Starting...</span>
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
    {/* 👇 RENDER THE MODAL COMPONENT */}
{showConfigModal && (
  <InterviewConfigModal 
    onCancel={() => setShowConfigModal(false)}
    onStart={(config) => {
      setShowConfigModal(false);
      handleStart(config); // Pass the config to start logic
    }}
  />
)}
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
  <div className="space-y-6 max-w-5xl mx-auto text-white">
    {/* ==================== AI MENTOR FEEDBACK CARD ==================== */}
    {lastFeedback && (
      <div className="relative p-8 bg-neutral-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#cbe557]/20 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden group hover:shadow-[#cbe557]/10 transition-shadow">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#cbe557]/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

        <div className="relative z-10 flex items-start gap-5">
          <div className="shrink-0 p-4 bg-[#cbe557]/10 rounded-2xl shadow-inner border border-[#cbe557]/20 transform group-hover:rotate-12 transition-transform duration-300">
            <Lightbulb size={28} className="text-[#cbe557]" />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-sm font-black text-[#cbe557] uppercase tracking-wider flex items-center gap-2 bg-[#cbe557]/5 px-3 py-1 rounded-lg border border-[#cbe557]/20">
                💡 AI Mentor Feedback
              </h4>

              <button
                onClick={() => {
                  if (isSpeaking) {
                    if (isPaused) resumeSpeaking();
                    else pauseSpeaking();
                  } else {
                    speakText(lastFeedback, true);
                  }
                }}
                className="p-3 bg-white/5 hover:bg-[#cbe557] rounded-xl text-[#cbe557] hover:text-black transition-all shadow-md hover:shadow-lg border border-white/10 hover:border-[#cbe557] transform hover:scale-110 active:scale-95"
                title="Read Feedback"
              >
                {isSpeaking ? (
                  isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
            </div>

            <p className="text-neutral-200 text-lg leading-relaxed font-medium">
              {lastFeedback}
            </p>

            {lastDiagnosis && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <StructuredFeedback diagnosis={lastDiagnosis} />
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* ==================== MAIN QUESTION CARD ==================== */}
    <div className="bg-neutral-900/40 rounded-3xl shadow-2xl border border-white/10 overflow-hidden backdrop-blur-xl relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#cbe557]/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

<div className="p-5 md:p-6 border-b border-white/5 backdrop-blur-xl relative overflow-hidden">
        {/* Enhanced decorative orbs with animation */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#cbe557]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10">
          {/* Enhanced top bar */}
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            {/* Question Badge */}
            <div className="relative group">
              <div className="absolute inset-0 bg-[#cbe557]/20 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-xl">
                <Sparkles size={16} className="text-[#cbe557] animate-pulse" />
                <span className="text-xs font-black tracking-widest text-[#cbe557] uppercase">
                  Question {currentQuestion?.questionNumber || (history.filter(h => h.q?.questionId !== currentQuestion?.questionId).length + 1)}
                </span>
              </div>
            </div>

            {/* Controls Group */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Modernized TTS Controls */}
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-2xl p-1.5 shadow-xl border border-white/10">
                <button
                  onClick={toggleSpeak}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all transform hover:scale-105 active:scale-95 ${isSpeaking
                      ? isPaused
                        ? "bg-[#cbe557]/20 text-[#cbe557] shadow-md border border-[#cbe557]/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-white/5 text-neutral-300 hover:bg-[#cbe557] hover:text-black hover:shadow-[#cbe557]/20"
                    }`}
                  title={isSpeaking ? (isPaused ? "Resume" : "Pause") : "Read Question"}
                >
                  {isSpeaking ? (
                    isPaused ? (
                      <>
                        <Play size={16} fill="currentColor" />
                        <span className="hidden sm:inline">Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause size={16} />
                        <span className="hidden sm:inline">Pause</span>
                      </>
                    )
                  ) : (
                    <>
                      <Volume2 size={16} />
                      <span className="hidden sm:inline">Read</span>
                    </>
                  )}
                </button>

                {isSpeaking && (
                  <>
                    <button
                      onClick={stopSpeaking}
                      className="p-2.5 hover:bg-white/10 rounded-xl transition-all transform hover:scale-110 active:scale-95"
                      title="Stop"
                    >
                      <Square size={16} className="text-neutral-400 hover:text-white" />
                    </button>

                    <div className="flex items-center gap-2 px-3 border-l border-white/10">
                      <Zap size={14} className="text-[#cbe557]" />
                      <span className="text-xs text-white font-black">
                        {speechRate.toFixed(1)}x
                      </span>
                    </div>
                  </>
                )}

                <button
                  onClick={() => setShowVoiceSettings(true)}
                  className="p-2.5 hover:bg-white/10 rounded-xl transition-all transform hover:scale-110 active:scale-95"
                  title="Voice Settings"
                >
                  <Settings size={16} className="text-neutral-400 hover:text-white" />
                </button>
              </div>

              {/* Hint Button */}
              <button
                onClick={handleGetHint}
                disabled={loadingHint || !!hint}
                className={`flex items-center gap-2.5 text-xs font-black px-5 py-2.5 rounded-2xl border transition-all transform hover:scale-105 active:scale-95 shadow-lg ${hint
                    ? "bg-[#cbe557]/10 text-[#cbe557] border-[#cbe557]/30"
                    : "bg-black/40 text-neutral-300 border-white/10 hover:border-[#cbe557]/50 hover:text-[#cbe557]"
                  }`}
              >
                {loadingHint ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Lightbulb size={16} className={hint ? "text-[#cbe557] fill-[#cbe557]/20" : ""} />
                )}
                <span>{hint ? "Hint Active (-15%)" : "Get Hint"}</span>
              </button>
            </div>
          </div>

          {/* Difficulty Badge & Timer */}
          {currentQuestion.difficulty && (
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className={`relative inline-flex items-center gap-2.5 text-xs font-black uppercase px-5 py-2.5 rounded-xl shadow-lg border ${currentQuestion.difficulty === "expert" || currentQuestion.difficulty === "hard"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-[#cbe557]/10 text-[#cbe557] border-[#cbe557]/20"
                }`}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-current"></span>
                </span>
                {currentQuestion.difficulty.toUpperCase()}
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-400 bg-black/40 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 shadow-sm">
                <Timer size={14} className="text-[#cbe557]" />
                <span className="font-bold text-neutral-300">45 min remaining</span>
              </div>
            </div>
          )}

          {/* Question Text */}
<h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-4 tracking-tight">
            {currentQuestion.questionText}
          </h2>

          {/* Hint Display */}
          {hint && (
            <div className="mb-6 p-4 bg-[#cbe557]/5 border-l-4 border-[#cbe557] rounded-r-xl shadow-md">
              <div className="flex items-start gap-3">
                <Lightbulb size={20} className="text-[#cbe557] mt-0.5 flex-shrink-0 fill-[#cbe557]/20 animate-pulse" />
                <div>
                  <div className="font-black text-[#cbe557] text-sm mb-1 flex items-center gap-2">
                    💡 Hint <span className="text-xs font-normal text-neutral-400">(-15% score)</span>
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed">{hint}</p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Tags */}
          <div className="flex flex-wrap gap-3">
            {currentQuestion.target_project && (
              <span className="inline-flex items-center gap-2 text-xs bg-blue-500/10 text-blue-400 px-4 py-2.5 rounded-xl border border-blue-500/20 font-black shadow-sm cursor-default">
                🎯 {currentQuestion.target_project}
              </span>
            )}
            {currentQuestion.technology_focus && (
              <span className="inline-flex items-center gap-2 text-xs bg-purple-500/10 text-purple-400 px-4 py-2.5 rounded-xl border border-purple-500/20 font-black shadow-sm cursor-default">
                ⚡ {currentQuestion.technology_focus}
              </span>
            )}
            {currentQuestion.expectedAnswerType === "code" && (
              <span className={`inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl border font-black shadow-sm cursor-default ${currentQuestion.type === 'debugging'
                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}>
                {currentQuestion.type === 'debugging' ? (
                  <>
                    <Bug size={16} /> Debugging Challenge
                  </>
                ) : (
                  <>
                    <Code size={16} /> Code Expected
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ==================== ANSWER FORM AREA ==================== */}
<div className="bg-neutral-950/50 p-4 md:p-6 border-t border-white/10">        <form onSubmit={handleSubmitAnswer}>
          {currentQuestion.expectedAnswerType === "code" ? (
            /* ==================== CODE EDITOR - DARK MODE GLASS ==================== */
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-neutral-900 shadow-xl">

              {/* Editor Header */}
              <div className="bg-white/5 p-4 flex flex-wrap justify-between items-center gap-3 border-b border-white/10">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Language Badge */}
                  <span className="text-xs font-black text-white uppercase bg-white/10 px-3 py-2 rounded-xl shadow-sm border border-white/5">
                    {(resolvedChallengeForEditor.language || "PYTHON").toUpperCase()}
                  </span>

                  {/* Language-specific hints */}
                  {resolvedChallengeForEditor.language === "cpp" && (
                    <span className="text-xs text-[#cbe557] bg-[#cbe557]/10 px-3 py-1.5 rounded-lg border border-[#cbe557]/20 font-medium flex items-center gap-1.5">
                      <Code size={12} />
                      C++: Write complete program with <code className="bg-[#cbe557]/20 px-1 rounded">main()</code>
                    </span>
                  )}

                  {resolvedChallengeForEditor.language === "python" && (
                    <span className="text-xs text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 font-medium flex items-center gap-1.5">
                      <Code size={12} />
                      Python: Define <code className="bg-blue-500/20 px-1 rounded">solve()</code> or read from stdin
                    </span>
                  )}

                  {/* Debugging warning */}
                  {currentQuestion.type === 'debugging' && (
                    <span className="text-xs text-red-400 font-black bg-red-500/10 px-4 py-1.5 rounded-lg border border-red-500/20 flex items-center gap-2 animate-pulse">
                      <Bug size={14} />
                      ⚠️ BUG DETECTED: Find and fix the error
                    </span>
                  )}
                </div>

                {/* Run Code Button (LIME POP) */}
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={codeStatus === "running" || !answer.trim()}
                  className={`group/run px-5 py-2.5 text-sm font-black rounded-xl flex items-center gap-2.5 transition-all shadow-lg ${codeStatus === "running"
                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                      : "bg-[#cbe557] text-neutral-950 hover:bg-[#b5cc4e] hover:shadow-[#cbe557]/40 hover:scale-105 active:scale-95"
                    }`}
                >
                  {codeStatus === "running" ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" className="group-hover/run:scale-110 transition-transform" />
                      <span>Run Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Monaco Editor */}
              <div className="h-[400px] w-full relative bg-[#1e1e1e]">
                <Editor
                  key={resolvedChallengeForEditor.language || "python"}
                  height="100%"
                  defaultLanguage={(resolvedChallengeForEditor.language || "python").toLowerCase()}
                  value={answer}
                  onChange={(val) => setAnswer(val || "")}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    lineNumbers: "on",
                    renderLineHighlight: "all",
                    cursorBlinking: "smooth"
                  }}
                />
              </div>

              {/* Console Output Terminal */}
              <div className="bg-black text-neutral-300 p-5 font-mono text-sm border-t border-[#cbe557]/30">

                {/* Test Case Requirements Display */}
                <div className="mb-4 p-3 bg-neutral-900 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-neutral-500 font-black uppercase tracking-wider flex items-center gap-2">
                        <ArrowRight size={12} className="text-[#cbe557]" />
                        Input:
                      </span>
                      <code className="text-[#cbe557] bg-white/5 px-2 py-1 rounded font-medium">
                        {resolvedChallengeForEditor.test_case_input ?? resolvedChallengeForEditor.test_case ?? "[]"}
                      </code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-neutral-500 font-black uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle size={12} className="text-emerald-400" />
                        Expected Output:
                      </span>
                      <code className="text-emerald-300 bg-white/5 px-2 py-1 rounded font-medium">
                        {resolvedChallengeForEditor.expected_output ?? resolvedChallengeForEditor.expected ?? ""}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Console Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                    <Terminal size={14} className="text-[#cbe557]" />
                    Console Output
                  </div>

                  {/* Status Badges */}
                  {codeStatus === "success" && allTestsPassed && (
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-2 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/30 animate-in fade-in">
                      <CheckCircle size={14} /> All Tests Passed ✓
                    </span>
                  )}

                  {codeStatus === "error" && executionResult && !allTestsPassed && (
                    <span className="text-xs font-black text-red-400 flex items-center gap-2 bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/30 animate-in fade-in">
                      <XCircle size={14} /> Tests Failed ✗
                    </span>
                  )}
                </div>

                {/* Output Display Area */}
                <div className="bg-neutral-950/80 backdrop-blur-sm p-4 rounded-xl min-h-[100px] max-h-[220px] overflow-y-auto border border-white/10 shadow-inner">
                  {codeStatus === "idle" && !codeOutput && (
                    <span className="text-neutral-600 italic flex items-center gap-2">
                      <Play size={14} />
                      Click "Run Code" to see output...
                    </span>
                  )}

                  {codeStatus === "running" && (
                    <span className="text-[#cbe557] font-bold flex items-center gap-2 animate-pulse">
                      <Loader2 className="animate-spin" size={14} />
                      Executing code in container...
                    </span>
                  )}

                  {/* Actual Output */}
                  {codeOutput && (
                    <pre className={`whitespace-pre-wrap break-words font-mono text-sm leading-relaxed ${codeStatus === "error" && !allTestsPassed ? "text-red-400" : "text-emerald-400"
                      }`}>
                      {codeOutput}
                    </pre>
                  )}

                  {/* Debug Information */}
                  {executionResult?.debug && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="text-neutral-500 font-black text-xs mb-2 flex items-center gap-2">
                        <Bug size={12} className="text-[#cbe557]" />
                        Debug Information:
                      </div>
                      <pre className="text-[#cbe557] whitespace-pre-wrap text-xs bg-[#cbe557]/5 p-2 rounded border border-[#cbe557]/10">
                        {executionResult.debug}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

          ) : currentQuestion.expectedAnswerType === "system_design" ? (
            /* ==================== SYSTEM DESIGN WHITEBOARD - DARK ==================== */
            <div className="flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-neutral-900 shadow-xl">

              {/* Enhanced Header */}
              <div className="bg-white/5 p-4 flex flex-wrap justify-between items-center gap-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-[#cbe557] uppercase bg-[#cbe557]/10 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm border border-[#cbe557]/20">
                    <LayoutTemplate size={16} /> System Design
                  </span>
                  <span className="text-xs text-neutral-400 font-medium flex items-center gap-2">
                    <Sparkles size={12} className="text-purple-400" />
                    Draw your architecture below
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (excalidrawAPI) {
                        excalidrawAPI.scrollToContent();
                        excalidrawAPI.updateScene({
                          appState: { zoom: { value: 1 } }
                        });
                      }
                    }}
                    className="group/center text-xs px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 font-black transition-all hover:scale-105 active:scale-95 shadow-sm border border-blue-500/20 flex items-center gap-2"
                  >
                    <Target size={14} className="group-hover/center:rotate-90 transition-transform" />
                    Center View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (excalidrawAPI) {
                        excalidrawAPI.resetScene();
                        whiteboardElementsRef.current = [];
                      }
                    }}
                    className="group/clear text-xs px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 font-black transition-all hover:scale-105 active:scale-95 shadow-sm border border-red-500/20 flex items-center gap-2"
                  >
                    <Trash2 size={14} className="group-hover/clear:rotate-12 transition-transform" />
                    Clear Canvas
                  </button>
                </div>
              </div>

              {/* Canvas Area */}
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
                  viewModeEnabled={false}
                  zenModeEnabled={false}
                  gridModeEnabled={true}
                  initialData={{
                    appState: {
                      viewBackgroundColor: "#171717",
                      currentItemStrokeColor: "#cbe557",
                      currentItemBackgroundColor: "transparent",
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
              <div className="p-5 bg-neutral-900 border-t border-white/10 shrink-0">
                <label className="block text-xs font-black text-neutral-400 uppercase mb-3 flex items-center gap-2">
                  <FileText size={14} className="text-[#cbe557]" />
                  Architecture Explanation
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  placeholder="Describe your system architecture: components, data flow, scalability strategies, database choices, caching layers, load balancing..."
                  className="w-full p-4 text-sm bg-neutral-950 text-white rounded-xl border border-white/10 focus:ring-1 focus:ring-[#cbe557] focus:border-[#cbe557] outline-none resize-none shadow-inner placeholder:text-neutral-600 leading-relaxed"
                />
                <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Keyboard size={12} />
                    {answer.length} characters
                  </span>
                  <span className="italic">💡 Be specific about scalability and trade-offs</span>
                </div>
              </div>
            </div>

          ) : (
            /* ==================== TEXT/VOICE INPUT - DARK ==================== */
            <div className="relative group">

              {/* Header Status Bar */}
              <div className="flex justify-between items-center mb-3 px-1">
                <label className="text-xs font-black text-neutral-400 uppercase flex items-center gap-2">
                  <Edit3 size={14} className="text-[#cbe557]" />
                  Your Answer
                </label>

                <div className={`text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-2 transition-all h-8 ${isListening
                    ? "bg-[#cbe557]/10 border border-[#cbe557]/30 shadow-[0_0_15px_-3px_rgba(203,229,87,0.3)]"
                    : "bg-white/5 text-neutral-500 border border-white/5"
                  }`}>
                  {isListening ? (
                    <>
                      {/* Render Visualizer here */}
                      <AudioVisualizer isListening={isListening} />
                      <span className="text-[#cbe557] animate-pulse ml-1">Live</span>
                    </>
                  ) : (
                    <>
                      <Mic size={12} />
                      Type or Dictate
                    </>
                  )}
                </div>
              </div>

              {/* Input Container */}
              <div className={`relative rounded-2xl border transition-all bg-neutral-900/50 overflow-hidden shadow-lg ${isListening
                  ? "border-[#cbe557] shadow-[0_0_40px_rgba(203,229,87,0.1)] ring-1 ring-[#cbe557]/20"
                  : "border-white/10 hover:border-white/20 focus-within:border-[#cbe557] focus-within:ring-1 focus-within:ring-[#cbe557]/20"
                }`}>

                {/* Textarea */}
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here... or click the microphone to speak."
                  rows={8}
                  className="w-full p-6 text-base text-white outline-none resize-none bg-transparent relative z-10 placeholder:text-neutral-600 leading-relaxed"
                />

                {/* Floating Mic Button (LIME POP) */}
                <button
                  type="button"
                  onClick={handleMicToggle}
                  disabled={!isSupported}
                  className={`absolute bottom-5 right-5 p-4 rounded-2xl shadow-2xl transition-all z-30 flex items-center gap-2.5 font-black group/mic ${!isSupported
                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                      : isListening
                        ? "bg-red-500 text-white hover:bg-red-600 scale-110 ring-4 ring-red-500/30 animate-pulse"
                        : "bg-[#cbe557] text-black hover:bg-[#b5cc4e] hover:scale-105 hover:shadow-[0_0_20px_rgba(203,229,87,0.4)]"
                    }`}
                >
                  {isListening ? (
                    <>
                      <Square size={22} fill="currentColor" />
                      <span className="text-sm">Stop</span>
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-400 rounded-full animate-ping"></span>
                    </>
                  ) : (
                    <>
                      <Mic size={24} className="group-hover/mic:scale-110 group-hover/mic:rotate-12 transition-transform" />
                      <span className="text-sm opacity-0 group-hover/mic:opacity-100 transition-opacity whitespace-nowrap">
                        Speak
                      </span>
                    </>
                  )}
                </button>

                {/* Live Transcript Overlay */}
                {isListening && transcriptBuffer && (
                  <div className="absolute bottom-28 left-5 right-5 z-20 animate-in slide-in-from-bottom-4">
                    <div className="bg-neutral-900/90 text-white p-5 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1.5">
                          {[...Array(3)].map((_, i) => (
                            <span
                              key={i}
                              className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-black uppercase text-red-400 tracking-widest">
                          🔴 Recording
                        </span>
                        <div className="ml-auto flex items-center gap-2 text-xs text-neutral-400">
                          <Zap size={12} className="text-[#cbe557]" />
                          <span className="font-bold text-[#cbe557]">
                            {transcriptBuffer.split(' ').filter(w => w).length}
                          </span>
                          words
                        </div>
                      </div>
                      <p className="text-base font-medium leading-relaxed text-neutral-200">
                        {transcriptBuffer}
                        <span className="inline-block w-0.5 h-5 ml-1.5 align-middle bg-[#cbe557] animate-pulse" />
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Stats */}
              <div className="mt-3 flex items-center justify-between text-xs px-1">
                <span className="flex items-center gap-2 text-neutral-500 font-medium">
                  <Keyboard size={13} />
                  <span className="font-black text-neutral-300">{answer.length}</span>
                  <span className="text-neutral-600">characters</span>
                </span>
                <span className="text-neutral-500 italic flex items-center gap-1.5">
                  {isListening ? (
                    <>
                      <Mic size={12} className="text-[#cbe557] animate-pulse" />
                      Processing voice input...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="text-[#cbe557]" />
                      You can edit text while speaking
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* ==================== COMPLEXITY INPUTS (Code Questions) ==================== */}
          {currentQuestion.expectedAnswerType === "code" && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group/complexity bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-[#cbe557]/50 transition-all shadow-sm">
                <label className="block text-xs font-black text-neutral-400 uppercase mb-3 flex items-center gap-2">
                  <Zap size={14} className="text-[#cbe557]" />
                  Time Complexity
                </label>
                <input
                  type="text"
                  placeholder="e.g. O(n log n)"
                  value={timeComplexity}
                  onChange={(e) => setTimeComplexity(e.target.value)}
                  className="w-full text-base font-mono font-bold text-white outline-none bg-transparent placeholder:text-neutral-600 focus:text-[#cbe557]"
                />
              </div>
              <div className="group/complexity bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-purple-400/50 transition-all shadow-sm">
                <label className="block text-xs font-black text-neutral-400 uppercase mb-3 flex items-center gap-2">
                  <Layers size={14} className="text-purple-400" />
                  Space Complexity
                </label>
                <input
                  type="text"
                  placeholder="e.g. O(1)"
                  value={spaceComplexity}
                  onChange={(e) => setSpaceComplexity(e.target.value)}
                  className="w-full text-base font-mono font-bold text-white outline-none bg-transparent placeholder:text-neutral-600 focus:text-purple-400"
                />
              </div>
            </div>
          )}

          {/* ==================== ACTION BUTTONS ==================== */}
          <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
            {/* Clear Button */}
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
              className="group/clear flex items-center gap-2.5 text-neutral-500 text-sm font-black hover:text-white transition-all px-5 py-3 hover:bg-white/10 rounded-xl border border-transparent hover:border-white/10"
            >
              <Trash2 size={16} className="group-hover/clear:rotate-12 group-hover/clear:scale-110 transition-transform" />
              Clear Answer
            </button>

            {/* Submit Button (LIME PRIMARY) */}
            <button
              type="submit"
              disabled={loading || !token || !answer.trim()}
              className={`relative group/submit px-8 md:px-12 py-4 md:py-5 rounded-xl font-black text-base md:text-lg shadow-2xl transition-all transform active:scale-95 flex items-center gap-4 overflow-hidden ${!token || !answer.trim() || loading
                  ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                  : "bg-[#cbe557] text-neutral-950 hover:shadow-[#cbe557]/40 hover:shadow-2xl hover:scale-[1.03]"
                }`}
            >
              {/* Animated shine */}
              {!loading && token && answer.trim() && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/submit:translate-x-full transition-transform duration-1000"></div>

                  {/* Sparkle particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-black rounded-full opacity-0 group-hover/submit:opacity-50 group-hover/submit:animate-ping"
                        style={{
                          left: `${15 + i * 18}%`,
                          top: `${25 + i * 12}%`,
                          animationDelay: `${i * 0.15}s`
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              <span className="relative z-10 flex items-center gap-3">
                {loading ? (
                  <>
                    <div className="w-7 h-7 border-4 border-black/30 border-t-black rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <CheckCircle size={26} className="group-hover/submit:scale-110 group-hover/submit:rotate-12 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
)}

        {/* FINAL RESULTS (unchanged) */}
        {/* FINAL RESULTS - UPDATED */}
        {stage === "done" && (
          <div className="max-w-5xl mx-auto animate-in fade-in zoom-in duration-500">
<div className="p-6 md:p-8 rounded-2xl bg-white border-2 border-slate-200 shadow-2xl">
              
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white mb-6 shadow-xl ring-4 ring-green-100">
                  <Award size={48} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-2">
                  Assessment Complete
                </h2>
                <p className="text-slate-500 text-lg font-medium">
                  {finalReport?.meta?.duration_minutes 
                    ? `Completed in ${finalReport.meta.duration_minutes} minutes` 
                    : "Here is your comprehensive performance analysis"}
                </p>
              </div>

              {/* 1. LOADING STATE FOR REPORT */}
 {loadingFinalReport ? (
  <div className="py-20 text-center border-2 border-dashed border-indigo-100 rounded-2xl bg-indigo-50/30">
    <Loader2 className="animate-spin text-indigo-600 w-12 h-12 mx-auto mb-4" />
    <h3 className="text-xl font-bold text-slate-800">Compiling Final Report...</h3>
    <p className="text-slate-500 mt-2 mb-6">AI is aggregating your round performance and generating detailed insights.</p>
    
    {/* Manual Retry Button */}
    <button 
      onClick={() => fetchFinalReport()}
      className="px-6 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm"
    >
      Click here if this takes too long
    </button>
  </div>
              ) : (
                <>
                  {/* 2. TOP METRICS CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {/* Verdict Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center text-center shadow-sm">
                      <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Final Verdict</span>
                      <div className="transform scale-110">
                        {renderVerdictBadge(finalReport?.overall?.verdict || finalDecision?.verdict)}
                      </div>
                      {finalReport?.overall?.decision_reason && (
                        <p className="mt-4 text-sm text-slate-500 italic max-w-sm">
                          "{finalReport.overall.decision_reason}"
                        </p>
                      )}
                    </div>
                    
                    {/* Score Card */}
                    <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Target size={100} />
                      </div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Overall Technical Score</span>
                      <div className="text-7xl font-black text-slate-900 mb-2 tracking-tighter">
                        {Math.round((finalReport?.overall?.score || performanceMetrics?.average_score || 0) * 100)}%
                      </div>
                      <div className="flex gap-1 mt-2">
                        {/* Star Rating Visualization using Sparkles as Stars */}
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Sparkles 
                            key={star} 
                            size={24} 
                            className={`${
                              star <= Math.round(((finalReport?.overall?.score || performanceMetrics?.average_score || 0) * 5)) 
                                ? "text-amber-400 fill-amber-400" 
                                : "text-slate-200"
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. EXECUTIVE SUMMARY */}
               <div className="mb-12 bg-slate-50 p-8 rounded-2xl border-l-4 border-indigo-500 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <FileText size={24} className="text-indigo-600" />
                      Executive Summary
                    </h3>
                    <p className="text-slate-700 text-lg leading-relaxed font-medium">
                      {/* 👇 UPDATED LINE: Check finalDecision.feedback_summary before reason */}
                      {finalReport?.overall?.feedback_summary || finalDecision?.feedback_summary || finalDecision?.reason || "Analysis pending..."}
                    </p>
                  </div>

                  {/* 4. ROUND-BY-ROUND PERFORMANCE (NEW) */}
                  {finalReport?.rounds && Object.keys(finalReport.rounds).length > 0 && (
                    <div className="mb-12 animate-in fade-in slide-in-from-bottom-4">
                      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Layout size={24} className="text-slate-400" />
                        Round Performance
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(finalReport.rounds).map(([name, data]: [string, any]) => (
                          <div key={name} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                              <span className="capitalize font-bold text-slate-800 text-lg">{name}</span>
                              <span className={`text-sm font-black px-3 py-1 rounded-full ${
                                data.score > 0.7 ? 'bg-emerald-100 text-emerald-700' : 
                                data.score > 0.4 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {Math.round(data.score * 100)}%
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed mb-4 min-h-[5rem]">
                              {data.feedback}
                            </p>
                            {data.weaknesses?.length > 0 && (
                              <div className="pt-4 border-t border-slate-100">
                                <div className="text-xs font-bold text-rose-600 uppercase mb-1 flex items-center gap-1">
                                  <TrendingDown size={12} /> Key Weakness
                                </div>
                                <div className="text-xs text-slate-700 font-medium truncate">
                                  {data.weaknesses[0]}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. DETAILED STRENGTHS & WEAKNESSES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {/* Left: Strengths */}
                    <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100">
                      <h4 className="font-bold text-emerald-800 mb-6 flex items-center gap-2 text-lg">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <TrendingUp size={20} className="text-emerald-600" /> 
                        </div>
                        Key Strengths
                      </h4>
                      <div className="space-y-3">
                        {(finalReport?.details?.key_strengths || finalDecision?.key_strengths || []).map((s: string, i: number) => (
                          <div key={i} className="flex gap-3 p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
                            <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-emerald-900 font-semibold">{s}</span>
                          </div>
                        ))}
                        {(finalReport?.details?.key_strengths || finalDecision?.key_strengths || []).length === 0 && (
                          <div className="text-sm text-slate-400 italic px-4">None detected yet.</div>
                        )}
                      </div>
                    </div>

                    {/* Right: Weaknesses */}
                    <div className="bg-rose-50/30 p-6 rounded-2xl border border-rose-100">
                      <h4 className="font-bold text-rose-800 mb-6 flex items-center gap-2 text-lg">
                        <div className="p-2 bg-rose-100 rounded-lg">
                          <AlertCircle size={20} className="text-rose-600" />
                        </div>
                        Areas for Growth
                      </h4>
                      <div className="space-y-3">
                        {(finalReport?.details?.areas_for_improvement || finalDecision?.critical_weaknesses || []).map((w: string, i: number) => (
                          <div key={i} className="flex gap-3 p-4 bg-white rounded-xl border border-rose-100 shadow-sm">
                            <Target size={20} className="text-rose-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-rose-900 font-semibold">{w}</span>
                          </div>
                        ))}
                       {(finalReport?.details?.areas_for_improvement || finalDecision?.critical_weaknesses || []).length === 0 && (
  <div className="text-sm text-slate-400 italic px-4">
    {(finalReport?.overall?.verdict || finalDecision?.verdict) === "reject"
      ? "Specific weaknesses not listed due to early termination."
      : "None detected. Great job!"}
  </div>
)}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 6. RECOMMENDED ROLE */}
              {(finalReport?.details?.recommended_role || finalDecision?.recommended_role) && (
                <div className="mb-10 text-center">
                  <div className="inline-block bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Recommended Role: {finalReport?.details?.recommended_role || finalDecision?.recommended_role}
                  </div>
                </div>
              )}

{/* 7. ACTION BUTTONS */}
              <div className="flex flex-col md:flex-row justify-center gap-4 mt-8 pt-8 border-t border-slate-100 flex-wrap">
                <button
                  onClick={() => setShowReport(!showReport)}
                  className="px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition-all shadow-sm hover:shadow-md"
                >
                  {showReport ? "Hide Transcript" : "View Full Transcript"}
                </button>

                <button
onClick={() => speakText(finalReport?.overall?.feedback_summary || finalDecision?.feedback_summary || finalDecision?.reason)}
                  className="px-6 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-50 font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <Volume2 size={20} /> Listen to Report
                </button>
                
                <button
                  onClick={generatePDF}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl shadow-lg hover:shadow-emerald-200 hover:-translate-y-1 transition-all font-bold flex items-center justify-center gap-2"
                >
                  <FileText size={20} /> Download PDF
                </button>

                {/* 🔥 NEW: Generate Roadmap Button */}
                <button
                  onClick={fetchRoadmap}
                  disabled={loadingRoadmap || !!roadmap}
                  className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                    roadmap 
                      ? "bg-slate-100 text-slate-400 cursor-default" 
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-blue-200 hover:-translate-y-1"
                  }`}
                >
                  {loadingRoadmap ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Map size={20} />
                  )}
                  {roadmap ? "Roadmap Generated" : "Generate 4-Week Roadmap"}
                </button>

                <button
                  onClick={() => setConfirmRestartVisible(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-indigo-200 hover:-translate-y-1 font-bold transition-all shadow-lg"
                >
                  Start New Interview
                </button>
              </div>

              {/* 🔥 8. ROADMAP DISPLAY (Added Here) */}
              {roadmap && (
                <div className="mt-12 w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
                   <RoadmapDisplay plan={roadmap} title={roadmapTitle} />
                </div>
              )}

              {/* 9. CONFIRM RESTART MODAL */}
              {confirmRestartVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                  <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in">
                    <h4 className="font-bold text-xl mb-2 text-slate-900">Start a new interview?</h4>
                    <p className="text-slate-600 mb-6">
                      This will clear your current progress and results. Are you sure you want to proceed?
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                        onClick={() => setConfirmRestartVisible(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md"
                        onClick={() => {
                          localStorage.removeItem("active_interview_session");
                          window.location.reload();
                        }}
                      >
                        Yes, Start New
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. FULL TRANSCRIPT (CONDITIONAL) */}
              {showReport && (
                <div className="mt-12 pt-10 border-t-2 border-slate-100 space-y-6">
                  <h3 className="font-black text-2xl text-slate-900 flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                    Complete Transcript
                  </h3>
                  <div className="grid gap-6">
                    {history.map((h, idx) => (
                      <TranscriptCard key={idx} h={h} idx={idx} renderScoreBadge={renderScoreBadge} />
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}