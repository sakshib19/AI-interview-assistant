"use client";

import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Zap, 
  TrendingUp, 
  BookOpen, 
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { DetailedRound } from '../page';

// Helper to determine color themes based on score
const getTheme = (score: number) => {
  if (score >= 80) return { 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-400', 
    border: 'border-emerald-500/20', 
    badge: 'bg-emerald-500/10',
    icon: <CheckCircle2 size={16} />
  };
  if (score >= 60) return { 
    color: 'text-amber-400', 
    bg: 'bg-amber-400', 
    border: 'border-amber-500/20', 
    badge: 'bg-amber-500/10',
    icon: <AlertTriangle size={16} />
  };
  return { 
    color: 'text-red-400', 
    bg: 'bg-red-400', 
    border: 'border-red-500/20', 
    badge: 'bg-red-500/10',
    icon: <XCircle size={16} />
  };
};

const RoundCard = ({ title, data, icon: Icon }: { title: string, data?: DetailedRound, icon: any }) => {
  if (!data) return (
    <div className="bg-neutral-900/20 border border-white/5 rounded-2xl p-6 mb-4 flex items-center justify-between opacity-50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/5 rounded-lg"><Icon size={20} className="text-neutral-500" /></div>
        <span className="font-semibold text-neutral-400">{title} Round</span>
      </div>
      <span className="text-xs uppercase tracking-widest font-bold text-neutral-600">Pending</span>
    </div>
  );

  const percentage = Math.round(data.score * 100);
  const theme = getTheme(percentage);

  return (
    <div className={`relative overflow-hidden bg-neutral-900/40 border border-white/5 rounded-2xl p-6 mb-6 transition-all duration-300 hover:border-white/10 group`}>
      
      {/* Decorative Gradient Background */}
      <div className={`absolute top-0 right-0 w-64 h-64 ${theme.bg} opacity-[0.03] blur-[80px] rounded-full pointer-events-none -mr-10 -mt-10`} />

      {/* --- HEADER: Score & Status --- */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 shadow-inner`}>
             <Icon size={22} className={title === 'Screening' ? 'text-[#cbe557]' : title === 'Technical' ? 'text-blue-400' : 'text-purple-400'} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {title}
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${theme.border} ${theme.color} ${theme.badge} flex items-center gap-1`}>
                {theme.icon} {data.status}
              </span>
            </h3>
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mt-1">Automated Analysis</p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className={`text-3xl font-black ${theme.color} tracking-tighter`}>{percentage}%</span>
          <span className="text-xs text-neutral-500 font-medium">Score</span>
        </div>
      </div>

      {/* --- PROGRESS BAR --- */}
      <div className="w-full h-1.5 bg-neutral-800/50 rounded-full mb-6 overflow-hidden relative">
        <div 
          className={`h-full ${theme.bg} shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* --- FEEDBACK SECTION --- */}
      <div className="mb-6 bg-black/20 border border-white/5 rounded-xl p-4 relative">
        <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-xl ${theme.bg} opacity-50`} />
        <p className="text-sm text-neutral-300 leading-relaxed pl-2 italic">
          "{data.feedback}"
        </p>
      </div>

      {/* --- DATA MERGE: SWOT Analysis --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* Strengths Column */}
        <div>
          <h4 className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
            <TrendingUp size={14} className="text-emerald-500" /> Key Strengths
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.strengths.length > 0 ? (
              data.strengths.map((str, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                  {str}
                </span>
              ))
            ) : (
              <span className="text-xs text-neutral-600 italic">No specific strengths recorded</span>
            )}
          </div>
        </div>

        {/* Weaknesses Column */}
        <div>
           <h4 className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
             <AlertCircle size={14} className="text-amber-500" /> Areas for Improvement
           </h4>
          <div className="flex flex-wrap gap-2">
            {data.weaknesses.length > 0 ? (
              data.weaknesses.map((wk, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/5 text-red-400 border border-red-500/10">
                  {wk}
                </span>
              ))
            ) : (
              <span className="text-xs text-neutral-600 italic">No critical issues found</span>
            )}
          </div>
        </div>
      </div>
      
      {/* --- RECOMMENDATION FOOTER --- */}
      {data.recommendation && (
        <div className="mt-6 pt-4 border-t border-white/5 flex items-start gap-3">
          <div className="p-1.5 bg-[#cbe557]/10 rounded-full mt-0.5 shrink-0 animate-pulse-slow">
             <Lightbulb size={14} className="text-[#cbe557]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#cbe557] uppercase tracking-wider block mb-1">AI Action Item</span>
            <p className="text-sm text-neutral-400 leading-snug">{data.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function RoundWiseAnalysis({ rounds }: { rounds: any }) {
  return (
    <div className="flex flex-col w-full">
      <RoundCard title="Screening" data={rounds.screening} icon={Zap} />
      <RoundCard title="Technical" data={rounds.technical} icon={TrendingUp} />
      <RoundCard title="Behavioral" data={rounds.behavioral} icon={BookOpen} />
    </div>
  );
}