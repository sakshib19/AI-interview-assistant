"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Video, Volume2, Clock, Minimize2, Maximize2, Move, Terminal } from 'lucide-react';

interface FloatingDockProps {
  isListening: boolean;
  onMicToggle: () => void;
  cameraActive: boolean;
  onCameraToggle: () => void;
  isSpeaking: boolean;
  onTTSToggle: () => void;
  onToggleConsole: () => void; // <--- Added this property
  timeElapsed: number;
  timeRecommended: number;
}

export const FloatingDock = ({ 
  isListening, 
  onMicToggle, 
  cameraActive, 
  onCameraToggle, 
  isSpeaking, 
  onTTSToggle, 
  onToggleConsole, // <--- Destructured here
  timeElapsed, 
  timeRecommended 
}: FloatingDockProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Set initial position on client side only
    setPosition({ x: window.innerWidth / 2 - 150, y: window.innerHeight - 100 });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging when clicking buttons
    if ((e.target as HTMLElement).closest('.dock-button')) return;
    
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const timePercent = Math.min((timeElapsed / timeRecommended) * 100, 100);
  
  // Prevent rendering on server
  if (position.x === 0 && position.y === 0) return null;

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-[100] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 transition-all cursor-move ${
        isMinimized ? 'w-12 h-12 p-2' : 'px-4 py-3'
      }`}
    >
      {isMinimized ? (
        <button onClick={() => setIsMinimized(false)} className="w-full h-full flex items-center justify-center">
          <Maximize2 size={20} className="text-slate-600" />
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <Move size={14} className="text-slate-400 mr-2" />
          
          {/* Mic Toggle */}
          <button onClick={onMicToggle} className={`dock-button p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
            <Mic size={20} />
          </button>

          {/* Camera Toggle */}
          <button onClick={onCameraToggle} className={`dock-button p-3 rounded-xl transition-all ${cameraActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
            <Video size={20} />
          </button>

          {/* TTS Toggle */}
          <button onClick={onTTSToggle} className={`dock-button p-3 rounded-xl transition-all ${isSpeaking ? 'bg-purple-500 text-white animate-pulse' : 'bg-slate-100 hover:bg-slate-200'}`}>
            <Volume2 size={20} />
          </button>

          {/* NEW: Console/Terminal Toggle */}
          <button onClick={onToggleConsole} className="dock-button p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all text-slate-700">
             <Terminal size={20} />
          </button>

          {/* Timer */}
          <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl min-w-[60px]">
            <Clock size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-700">
              {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
            </span>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${timePercent}%` }} />
            </div>
          </div>

          <button onClick={() => setIsMinimized(true)} className="ml-2 p-1 hover:bg-slate-100 rounded">
            <Minimize2 size={16} className="text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
};