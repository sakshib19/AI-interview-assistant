"use client";

import React from 'react';
import dynamic from 'next/dynamic';

/**
 * 1. FIX: Explicitly access the default export in the dynamic import. 
 * This resolves the common Next.js issue where the module is wrapped in an object.
 * 2. FIX: Added a loading placeholder to prevent layout shift (CLS).
 */
const Lottie = dynamic(() => import('lottie-react').then((mod) => mod.default), { 
  ssr: false,
  loading: () => <div className="w-24 h-24 rounded-full bg-slate-100 animate-pulse border-2 border-slate-200" />
});

// 3. Ensure the JSON is in your public folder and tsconfig allows JSON imports
import avatarAnimation from '../../../public/animations/ai-avatar.json';

interface InterviewerAvatarProps {
  isSpeaking: boolean;
}

export const InterviewerAvatar = ({ isSpeaking }: InterviewerAvatarProps) => {
  return (
    <div 
      className={`fixed bottom-6 left-6 z-40 transition-all duration-500 pointer-events-none ${
        isSpeaking ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      aria-hidden={!isSpeaking}
    >
      {/* Speech Indicator Bubble */}
      <div className={`absolute -top-12 left-4 bg-white px-3 py-1.5 rounded-lg rounded-bl-none shadow-lg border border-slate-200 transition-opacity duration-300 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex gap-1 items-center justify-center h-full">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>

      <div className="w-24 h-24 bg-white/90 backdrop-blur rounded-full shadow-2xl p-2 border-2 border-indigo-200 flex items-center justify-center overflow-hidden">
        <Lottie 
          animationData={avatarAnimation} 
          loop={true} 
          // 4. FIX: lottie-react uses camelCase 'autoPlay', not lowercase 'autoplay'
          autoPlay={isSpeaking}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};