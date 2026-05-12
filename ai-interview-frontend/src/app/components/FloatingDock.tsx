"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Video, Volume2, Clock, Minimize2, Maximize2, Move, Terminal } from "lucide-react";

export interface FloatingDockProps {
  isListening: boolean;
  onMicToggle: () => void;
  cameraActive: boolean;
  onCameraToggle: () => void;
  isSpeaking: boolean;
  onTTSToggle: () => void;
  onToggleConsole: () => void;
  timeElapsed: number;
  timeRecommended: number;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({ 
  isListening, 
  onMicToggle, 
  cameraActive, 
  onCameraToggle, 
  isSpeaking, 
  onTTSToggle, 
  onToggleConsole,
  timeElapsed, 
  timeRecommended 
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dockRef = useRef<HTMLDivElement>(null);

  // Initialize position only on the client to avoid SSR hydration mismatch
  useEffect(() => {
    setPosition({ 
      x: window.innerWidth / 2 - 150, 
      y: window.innerHeight - 100 
    });
    setIsMounted(true);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging when clicking interactive buttons
    if ((e.target as HTMLElement).closest(".dock-button")) return;
    
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dockRef.current) return;

    const dockWidth = dockRef.current.offsetWidth;
    const dockHeight = dockRef.current.offsetHeight;

    // Calculate new position with boundary constraints
    const newX = Math.max(0, Math.min(e.clientX - offsetRef.current.x, window.innerWidth - dockWidth));
    const newY = Math.max(0, Math.min(e.clientY - offsetRef.current.y, window.innerHeight - dockHeight));

    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isMounted) return null;

  // Safe math calculation to prevent NaN if timeRecommended is 0
  const safeTimeRecommended = timeRecommended > 0 ? timeRecommended : 1;
  const timePercent = Math.min((timeElapsed / safeTimeRecommended) * 100, 100);
  
  const timeColor = timePercent < 50 ? "text-emerald-600" : timePercent < 80 ? "text-amber-600" : "text-rose-600";
  const progressColor = timePercent < 50 ? "bg-emerald-500" : timePercent < 80 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div
      ref={dockRef}
      onMouseDown={handleMouseDown}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-[100] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 transition-all ${
        isDragging ? "cursor-grabbing select-none" : "cursor-grab"
      } ${isMinimized ? "w-14 h-14 p-2" : "px-4 py-3"}`}
      role="toolbar"
      aria-label="Interview Controls"
    >
      {isMinimized ? (
        <button 
          onClick={() => setIsMinimized(false)} 
          className="dock-button w-full h-full flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Expand controls"
        >
          <Maximize2 size={20} className="text-slate-600" />
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <Move size={14} className="text-slate-400 mr-2 cursor-grab hidden sm:block" aria-hidden="true" />
          
          <button 
            onClick={onMicToggle} 
            className={`dock-button flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${isListening ? "bg-red-500 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            aria-label={isListening ? "Mute Microphone" : "Unmute Microphone"}
            aria-pressed={isListening}
          >
            <Mic size={20} />
          </button>

          <button 
            onClick={onCameraToggle} 
            className={`dock-button flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${cameraActive ? "bg-emerald-500 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            aria-label={cameraActive ? "Turn Off Camera" : "Turn On Camera"}
            aria-pressed={cameraActive}
          >
            <Video size={20} />
          </button>

          <button 
            onClick={onTTSToggle} 
            className={`dock-button flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${isSpeaking ? "bg-purple-500 text-white animate-pulse shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            aria-label={isSpeaking ? "Disable Text-to-Speech" : "Enable Text-to-Speech"}
            aria-pressed={isSpeaking}
          >
            <Volume2 size={20} />
          </button>

          <button 
            onClick={onToggleConsole} 
            className="dock-button p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all text-slate-700"
            aria-label="Toggle Console"
          >
             <Terminal size={20} />
          </button>

          {/* Timer Display */}
          <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 border border-slate-100 rounded-xl min-w-[65px]">
            <Clock size={14} className={timeColor} aria-hidden="true" />
            <span className="text-xs font-bold text-slate-700 font-mono">
              {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, "0")}
            </span>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={timePercent} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full ${progressColor} transition-all duration-1000`} style={{ width: `${timePercent}%` }} />
            </div>
          </div>

          <button 
            onClick={() => setIsMinimized(true)} 
            className="dock-button ml-1 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Minimize controls"
          >
            <Minimize2 size={16} className="text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
};