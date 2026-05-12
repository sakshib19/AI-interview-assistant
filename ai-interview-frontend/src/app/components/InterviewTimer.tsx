"use client";

import React from 'react';

interface InterviewTimerProps {
  timeElapsed: number;
  timeRecommended: number;
}

export const InterviewTimer = ({ timeElapsed, timeRecommended }: InterviewTimerProps) => {
  // Ensure percentage doesn't exceed 100 or drop below 0
  const percentage = Math.max(0, Math.min((timeElapsed / timeRecommended) * 100, 100));
  
  // Determine color based on how much time is left
  let color = 'bg-emerald-500';
  if (percentage > 50) color = 'bg-amber-500';
  if (percentage > 85) color = 'bg-rose-500';

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[150]"
      role="progressbar" 
      aria-valuenow={percentage} 
      aria-valuemin={0} 
      aria-valuemax={100}
      aria-label="Interview Time Remaining"
    >
      <div className="h-1.5 bg-slate-200/50 backdrop-blur-sm w-full">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(0,0,0,0.1)] relative`}
          style={{ width: `${percentage}%` }}
        >
           {/* Add a subtle pulsing effect when time is critically low */}
           {percentage > 85 && (
             <div className="absolute inset-0 bg-white/30 animate-pulse" />
           )}
        </div>
      </div>
    </div>
  );
};