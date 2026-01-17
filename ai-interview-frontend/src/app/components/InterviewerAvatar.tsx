"use client";
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import avatarAnimation from '../../../public/animations/ai-avatar.json'; // Make sure this file exists!

export const InterviewerAvatar = ({ isSpeaking }: { isSpeaking: boolean }) => {
  return (
    <div className={`fixed bottom-6 left-6 z-40 transition-all duration-500 ${isSpeaking ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="w-24 h-24 bg-white/80 backdrop-blur rounded-full shadow-2xl p-2 border-2 border-indigo-200">
            <Lottie 
                animationData={avatarAnimation} 
                loop={true} 
                autoplay={isSpeaking} 
            />
        </div>
    </div>
  );
};