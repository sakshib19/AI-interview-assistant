"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Video, Minimize2 } from 'lucide-react';

interface DraggableCameraProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
}

export const DraggableCamera = ({ videoRef, isActive }: DraggableCameraProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setPosition({ x: window.innerWidth - 240, y: 20 });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.camera-button')) return;
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

  if (!isActive) return null;

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-[100] bg-black rounded-xl shadow-2xl overflow-hidden border-2 border-slate-700 cursor-move transition-all ${
        isCollapsed ? 'w-16 h-16' : 'w-60 h-40'
      }`}
    >
      {isCollapsed ? (
        <button onClick={() => setIsCollapsed(false)} className="w-full h-full flex items-center justify-center camera-button">
          <Video size={24} className="text-white" />
        </button>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <button 
            onClick={() => setIsCollapsed(true)} 
            className="camera-button absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full"
          >
            <Minimize2 size={12} className="text-white" />
          </button>
          <div className="absolute bottom-2 left-2 flex gap-1 items-center bg-black/50 px-2 py-0.5 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-white font-mono">LIVE</span>
          </div>
        </>
      )}
    </div>
  );
};