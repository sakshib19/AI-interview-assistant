"use client";

import React from 'react';
import { Target, BarChart3, BrainCircuit, Lightbulb } from 'lucide-react';
import { DetailedRound } from '../page';

export default function AIInsights({ rounds }: { rounds: any }) {
  // 1. Gather all valid rounds
  const allRounds: DetailedRound[] = [rounds.screening, rounds.technical, rounds.behavioral].filter(Boolean);
  
  if (allRounds.length === 0) return <div className="text-neutral-500 text-sm p-4">No analysis data available yet.</div>;

  // 2. Calculate Consistency Metrics
  const scores = allRounds.map(r => r.score * 100);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const variance = maxScore - minScore;
  
  // Logic: Low variance (<10) is high consistency. 100% consistent if variance is 0.
  const consistencyScore = Math.max(0, 100 - (variance * 1.5)); 

  // 3. Find the "weakest link" recommendation
  const lowestRound = allRounds.sort((a,b) => a.score - b.score)[0];

  return (
    <div className="grid grid-cols-1 gap-6">
      
      {/* --- Metrics Row --- */}
      <div className="grid grid-cols-2 gap-4">
        {/* Consistency Card */}
        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="text-blue-500 w-12 h-12" />
          </div>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Consistency</p>
          <div className="flex items-end gap-2">
             <span className="text-2xl font-bold text-white">{Math.round(consistencyScore)}%</span>
          </div>
          <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${consistencyScore}%` }} />
          </div>
        </div>

        {/* Variance Card */}
        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 className="text-orange-500 w-12 h-12" />
          </div>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Variance</p>
          <div className="flex items-end gap-2">
             <span className="text-2xl font-bold text-white">{Math.round(variance)}%</span>
          </div>
          <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${variance}%` }} />
          </div>
        </div>
      </div>

      {/* --- Aggregated Strengths Cloud --- */}
      <div className="bg-gradient-to-b from-neutral-900/50 to-neutral-900 border border-white/10 rounded-2xl p-5">
         <div className="flex items-center gap-2 mb-4">
           <BrainCircuit className="text-[#cbe557]" size={18} />
           <h4 className="text-sm font-bold text-white">Aggregated Skill Profile</h4>
         </div>

         <div className="flex flex-wrap gap-2 mb-6">
            {allRounds.flatMap(r => r.strengths).slice(0, 8).map((str, i) => (
               <span key={i} className="text-xs font-medium text-neutral-300 bg-white/5 border border-white/10 px-2 py-1 rounded">
                 {str}
               </span>
            ))}
         </div>

         <div className="pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-yellow-500" />
              <span className="text-xs font-bold text-neutral-400 uppercase">Primary Focus Area</span>
            </div>
            <p className="text-sm text-neutral-400 italic">
               "{lowestRound?.recommendation || "Maintain current performance standards."}"
            </p>
         </div>
      </div>

    </div>
  );
}