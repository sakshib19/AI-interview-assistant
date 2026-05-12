"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Video, Minimize2 } from 'lucide-react';

interface DraggableCameraProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
}

export const DraggableCamera = ({ videoRef, isActive }: DraggableCameraProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition({ x: window.innerWidth - 260, y: 20 });
    setIsMounted(true);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.camera-button')) return;
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;

    // Strict boundary enforcement
    const newX = Math.max(0, Math.min(e.clientX - offsetRef.current.x, window.innerWidth - width));
    const newY = Math.max(0, Math.min(e.clientY - offsetRef.current.y, window.innerHeight - height));

    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isActive || !isMounted) return null;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-[90] bg-black rounded-xl shadow-2xl overflow-hidden border-2 border-slate-700 transition-all ${
        isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
      } ${isCollapsed ? 'w-16 h-16' : 'w-60 h-40'}`}
    >
      {isCollapsed ? (
        <button 
          onClick={() => setIsCollapsed(false)} 
          className="camera-button w-full h-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 transition-colors"
          aria-label="Expand camera"
        >
          <Video size={24} className="text-white" />
        </button>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1] pointer-events-none"
          />
          <button 
            onClick={() => setIsCollapsed(true)} 
            className="camera-button absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-colors"
            aria-label="Minimize camera"
          >
            <Minimize2 size={12} className="text-white" />
          </button>
          <div className="absolute bottom-2 left-2 flex gap-1.5 items-center bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-none">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-white font-mono font-bold tracking-wider">REC</span>
          </div>
        </>
      )}
    </div>
  );
};