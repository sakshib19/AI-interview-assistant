"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, Video, Volume2, Clock, Minimize2, Maximize2,
  Move, X, Settings, Terminal, Code, Sparkles
} from 'lucide-react';

// ==========================================
// TYPES
// ==========================================
interface FloatingDockProps {
  isListening: boolean;
  onMicToggle: () => void;
  cameraActive: boolean;
  onCameraToggle: () => void;
  isSpeaking: boolean;
  onTTSToggle: () => void;
  timeElapsed: number;
  timeRecommended: number;
  onMinimize?: () => void;
}

interface InterviewTimerProps {
  timeElapsed: number;
  timeRecommended: number;
  questionType?: string;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  isPreview?: boolean;
}

interface InterviewerAvatarProps {
  isSpeaking: boolean;
  mood?: 'neutral' | 'positive' | 'thinking' | 'concerned';
}

interface DraggableCameraProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
}

interface CodeEnhancementProps {
  onStdinChange: (val: string) => void;
  vimMode: boolean;
  onVimToggle: () => void;
}

// ==========================================
// FEATURE 1: DRAGGABLE FLOATING DOCK
// ==========================================
export const FloatingDock = ({ 
  isListening, 
  onMicToggle,
  cameraActive,
  onCameraToggle,
  isSpeaking,
  onTTSToggle,
  timeElapsed,
  timeRecommended,
}: FloatingDockProps) => {
  const [position, setPosition] = useState({ x: 200, y: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Handle initial window-based positioning safely for SSR
  useEffect(() => {
    setPosition({ x: window.innerWidth / 2 - 200, y: window.innerHeight - 100 });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dock-button')) return;
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y
    });
  }, [isDragging, position.x, position.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const timePercent = Math.min((timeElapsed / timeRecommended) * 100, 100);
  const timeColor = timePercent < 50 ? 'text-emerald-600' : timePercent < 80 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-slate-200 transition-all ${
        isMinimized ? 'w-16 h-16' : 'px-4 py-3'
      }`}
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full h-full flex items-center justify-center dock-button hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Maximize2 size={20} className="text-slate-600" />
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <Move size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Focus Mode</span>
            <button
              onClick={() => setIsMinimized(true)}
              className="dock-button p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <Minimize2 size={14} className="text-slate-400" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onMicToggle}
              className={`dock-button flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                isListening ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Mic size={20} />
              <span className="text-[10px] font-bold">{isListening ? 'REC' : 'MIC'}</span>
            </button>

            <button
              onClick={onCameraToggle}
              className={`dock-button flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                cameraActive ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Video size={20} />
              <span className="text-[10px] font-bold">CAM</span>
            </button>

            <button
              onClick={onTTSToggle}
              className={`dock-button flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                isSpeaking ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Volume2 size={20} />
              <span className="text-[10px] font-bold">TTS</span>
            </button>

            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-100 min-w-[70px]">
              <Clock size={20} className={timeColor} />
              <div className="text-xs font-bold text-slate-700">
                {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// FEATURE 2: INTERVIEW TIMER & PACING BAR
// ==========================================
export const InterviewTimer = ({ timeElapsed, timeRecommended }: InterviewTimerProps) => {
  const percentage = Math.min((timeElapsed / timeRecommended) * 100, 100);
  
  const getTimerStatus = () => {
    if (percentage < 50) return { color: 'bg-emerald-500', label: 'On Track', icon: '✓' };
    if (percentage < 80) return { color: 'bg-amber-500', label: 'Moderate Pace', icon: '⚡' };
    if (percentage < 100) return { color: 'bg-orange-500', label: 'Time Running Out', icon: '⏰' };
    return { color: 'bg-rose-500', label: 'Over Time', icon: '⚠️' };
  };

  const status = getTimerStatus();

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-2 bg-slate-200 relative overflow-hidden">
        <div
          className={`h-full ${status.color} transition-all duration-500 relative`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
      <div className="absolute top-3 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2">
        <span className="text-lg">{status.icon}</span>
        <div className="text-xs">
          <div className="font-bold text-slate-700">{status.label}</div>
          <div className="text-slate-500">
            {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')} / {Math.floor(timeRecommended / 60)}:{(timeRecommended % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// FEATURE 3: MARKDOWN EDITOR FOR VERBAL ANSWERS
// ==========================================
export const MarkdownAnswerEditor = ({ value, onChange, isPreview = false }: MarkdownEditorProps) => {
  const [showPreview, setShowPreview] = useState(isPreview);

  const highlightCode = (text: string) => {
    return text
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-rose-600 px-1 rounded">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="italic text-slate-700">$1</em>');
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${!showPreview ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${showPreview ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Preview
          </button>
        </div>
      </div>

      {showPreview ? (
        <div
          className="min-h-[200px] p-5 bg-white rounded-xl border-2 border-slate-300 prose prose-slate max-w-none text-slate-800"
          dangerouslySetInnerHTML={{ __html: highlightCode(value) }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          rows={8}
          className="w-full p-5 text-base text-slate-800 bg-white rounded-xl border-2 border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none font-mono"
        />
      )}
    </div>
  );
};

// ==========================================
// FEATURE 4: GHOST INTERVIEWER AVATAR
// ==========================================
export const InterviewerAvatar = ({ isSpeaking, mood = 'neutral' }: InterviewerAvatarProps) => {
  const moodColors = {
    neutral: 'from-slate-600 to-slate-800',
    positive: 'from-emerald-500 to-green-700',
    thinking: 'from-indigo-500 to-purple-700',
    concerned: 'from-amber-500 to-orange-700'
  };

  const moodEmojis = { neutral: '🤖', positive: '😊', thinking: '🤔', concerned: '🧐' };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-end gap-3">
      <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${moodColors[mood]} flex items-center justify-center text-3xl shadow-2xl border-4 border-white ${isSpeaking ? 'animate-pulse scale-110' : ''}`}>
        {moodEmojis[mood]}
        {isSpeaking && <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />}
      </div>
    </div>
  );
};

// ==========================================
// FEATURE 5: DRAGGABLE CAMERA PREVIEW
// ==========================================
export const DraggableCamera = ({ videoRef, isActive }: DraggableCameraProps) => {
  const [position, setPosition] = useState({ x: 0, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setPosition({ x: window.innerWidth - 180, y: 20 });
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
    if (!isDragging) return;
    setPosition({
      x: Math.max(0, Math.min(e.clientX - offsetRef.current.x, window.innerWidth - 160)),
      y: Math.max(0, Math.min(e.clientY - offsetRef.current.y, window.innerHeight - 120))
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isActive) return null;

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{ position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, zIndex: 1000, cursor: isDragging ? 'grabbing' : 'grab' }}
      className={`bg-white rounded-xl shadow-2xl border-4 border-white overflow-hidden transition-all ${isCollapsed ? 'w-12 h-12' : 'w-40 h-30'}`}
    >
      {isCollapsed ? (
        <button onClick={() => setIsCollapsed(false)} className="w-full h-full flex items-center justify-center camera-button bg-slate-800">
          <Video size={20} className="text-white" />
        </button>
      ) : (
        <>
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
          <button onClick={() => setIsCollapsed(true)} className="camera-button absolute top-2 right-2 p-1 bg-black/50 rounded-full">
            <Minimize2 size={12} className="text-white" />
          </button>
        </>
      )}
    </div>
  );
};

// ==========================================
// FEATURE 6: CODE ENHANCEMENTS
// ==========================================
export const CodeEditorEnhancements = ({ onStdinChange, vimMode, onVimToggle }: CodeEnhancementProps) => {
  const [showStdin, setShowStdin] = useState(false);
  const [stdinValue, setStdinValue] = useState('');

  return (
    <div className="flex items-center gap-3 mb-3">
      <button
        type="button"
        onClick={onVimToggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${vimMode ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
      >
        <Terminal size={14} /> Vim Mode {vimMode ? 'ON' : 'OFF'}
      </button>

      <button
        type="button"
        onClick={() => setShowStdin(!showStdin)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showStdin ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
      >
        <Code size={14} /> Custom Input
      </button>

      {showStdin && (
        <input
          type="text"
          value={stdinValue}
          onChange={(e) => { setStdinValue(e.target.value); onStdinChange(e.target.value); }}
          placeholder="Enter stdin..."
          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none text-slate-800"
        />
      )}
    </div>
  );
};

// ==========================================
// MAIN DEMO COMPONENT
// ==========================================
export default function InterviewEnhancementsDemo() {
  const [isListening, setIsListening] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(180);
  const [vimMode, setVimMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <FloatingDock
        isListening={isListening}
        onMicToggle={() => setIsListening(!isListening)}
        cameraActive={cameraActive}
        onCameraToggle={() => setCameraActive(!cameraActive)}
        isSpeaking={isSpeaking}
        onTTSToggle={() => setIsSpeaking(!isSpeaking)}
        timeElapsed={timeElapsed}
        timeRecommended={300}
      />

      <InterviewTimer timeElapsed={timeElapsed} timeRecommended={300} />
      <DraggableCamera videoRef={videoRef} isActive={cameraActive} />
      <InterviewerAvatar isSpeaking={isSpeaking} mood={isSpeaking ? 'positive' : 'neutral'} />
      
      <div className="max-w-4xl mx-auto mt-20 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Code & Answer Editor</h2>
        <CodeEditorEnhancements vimMode={vimMode} onVimToggle={() => setVimMode(!vimMode)} onStdinChange={() => {}} />
        <MarkdownAnswerEditor value="**Sample** answer" onChange={() => {}} />
      </div>
    </div>
  );
}