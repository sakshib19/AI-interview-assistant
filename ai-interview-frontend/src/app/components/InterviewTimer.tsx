"use client";
import React from 'react';

export const InterviewTimer = ({ timeElapsed, timeRecommended }: { timeElapsed: number, timeRecommended: number }) => {
  const percentage = Math.min((timeElapsed / timeRecommended) * 100, 100);
  
  let color = 'bg-emerald-500';
  if (percentage > 50) color = 'bg-amber-500';
  if (percentage > 85) color = 'bg-rose-500';

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1.5 bg-slate-200 w-full">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-linear`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};