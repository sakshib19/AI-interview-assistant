"use client";

import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Sparkles,
  CheckCircle,
  AlertCircle,
  Play,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  XCircle,
  Lightbulb,
  ArrowRight,
  Map,
  Calendar,
  BookOpen,
  Video,
  Code,
  ExternalLink,
  Zap,
  ChevronUp,
  ChevronDown,
  Clock,
  Database,
  Bug,
} from "lucide-react";
export const renderScoreBadge = (score: number | undefined) => {
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

export const renderVerdictBadge = (verdict: string | undefined) => {
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

export const renderTrendIcon = (trend: string) => {
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

export const RoadmapDisplay = ({ plan, title }: { plan: any, title?: string }) => {
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
export const StructuredFeedback = ({ diagnosis }: { diagnosis?: any }) => {
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
export const TranscriptCard = ({ h, idx, renderScoreBadge }: { h: any, idx: number, renderScoreBadge: any }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Check if this specific history item was a debugging task
  const isDebugging = h.type === 'debugging' || (h.q?.metadata?.type === 'debugging');

  return (
    <div 
      className={`rounded-2xl border transition-all duration-300 overflow-hidden backdrop-blur-md ${
        isDebugging 
          ? "bg-amber-950/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" // Glowing Amber for Debugging
          : "bg-neutral-900/40 border-white/10 hover:border-white/20 shadow-xl" // Dark Glass for normal
      }`}
    >
      <div 
        className="p-6 cursor-pointer select-none hover:bg-white/5 transition-colors group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex gap-5 items-start">
          {/* Question Number / Icon Box */}
          <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg border transition-transform group-hover:scale-105 ${
            isDebugging 
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-amber-900/20" 
              : "bg-[#cbe557] text-neutral-950 border-[#cbe557] shadow-[#cbe557]/20" // Lime Accent
          }`}>
            {isDebugging ? <Bug size={24} /> : `Q${idx + 1}`}
          </div>

          <div className="flex-1">
            {/* Header Text - White for dark mode */}
            <div className="font-bold text-white text-xl leading-tight group-hover:text-[#cbe557] transition-colors">
              {h.q?.questionText || "Question text missing"}
            </div>
            
            {/* Debugging Badge */}
            {isDebugging && (
               <span className="inline-flex items-center mt-3 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 shadow-sm">
                 <Bug size={12} className="mr-1.5" /> Debugging Task
               </span>
            )}
          </div>

          <div className="text-neutral-500 shrink-0 transition-transform duration-300">
            {isExpanded ? <ChevronUp size={24} className="text-[#cbe557]" /> : <ChevronDown size={24} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* User Answer Area - Dark Terminal Style */}
          <div className="bg-black/60 p-5 rounded-xl border border-white/10 relative overflow-hidden shadow-inner group/terminal">
            {/* Aesthetic Side Bar */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[#cbe557]/50 group-hover/terminal:bg-[#cbe557] transition-colors"></div>
            
            <div className="flex items-center gap-2 mb-3">
              <Code size={16} className="text-[#cbe557]" />
              <span className="text-xs font-black text-neutral-400 uppercase tracking-wider">Your Answer</span>
            </div>
            <div className="text-neutral-300 font-mono text-sm leading-relaxed whitespace-pre-wrap selection:bg-[#cbe557] selection:text-black">
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

          {/* AI Analysis Results Container */}
          {h.result && (
            <div className="space-y-5">
              {/* Score & Verdict Row */}
              <div className="flex items-center gap-4 flex-wrap p-4 bg-white/5 rounded-xl border border-white/10 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 font-black uppercase tracking-wider">Score</span>
                  <div className="scale-110 origin-left">
                    {renderScoreBadge(h.result.overall_score)}
                  </div>
                </div>
                
                {h.result.verdict && (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-px bg-white/10 mx-2"></div>
                    <span className="text-xs text-neutral-400 font-black uppercase tracking-wider">Verdict</span>
                    <span className={`text-sm font-black px-4 py-1.5 rounded-lg uppercase tracking-wider border shadow-[0_0_10px_rgba(0,0,0,0.2)] ${
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
                <div className="text-neutral-200">
                  <ComplexityFeedback analysis={h.result.complexity_analysis} />
                </div>
              )}

              {/* Technical Diagnosis */}
              <StructuredFeedback diagnosis={h.result.technical_diagnosis} />

              {/* Improvement / Feedback Text - Dark Mode Lime Theme */}
              {(!h.result.technical_diagnosis?.win && !h.result.technical_diagnosis?.gap?.issue && h.result.improvement) && (
                <div className="bg-[#cbe557]/5 p-5 rounded-xl border-l-4 border-[#cbe557] relative overflow-hidden">
                  {/* Subtle Background Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#cbe557]/5 rounded-full blur-2xl -z-10"></div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#cbe557]/10 rounded-lg shrink-0">
                      <Lightbulb size={18} className="text-[#cbe557]" />
                    </div>
                    <div>
                      <span className="font-bold text-white block mb-2 text-sm tracking-wide">AI Feedback</span>
                      <p className="text-neutral-300 leading-relaxed text-sm">{h.result.improvement}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Rationale */}
              {h.result.rationale && (
                <div className="text-xs text-neutral-500 italic border-t border-white/10 pt-4 mt-2 flex gap-2">
                  <span className="font-bold text-neutral-400 not-italic whitespace-nowrap">Rationale:</span>
                  <span className="opacity-80">{h.result.rationale}</span>
                </div>
              )}

              {/* Red Flags */}
              {h.result.red_flags_detected && h.result.red_flags_detected.length > 0 && (
                <div className="bg-rose-950/20 p-5 rounded-xl border border-rose-500/30 shadow-inner">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg shrink-0">
                        <AlertCircle size={18} className="text-rose-500" />
                    </div>
                    <div>
                      <span className="font-bold text-rose-400 block mb-2 text-sm tracking-wide">Red Flags Detected</span>
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
