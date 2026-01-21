import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Video, Volume2, Clock, Minimize2, Maximize2,
  Move, X, Settings, Terminal, Code, Sparkles
} from 'lucide-react';

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
  onMinimize
}) => {
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 200, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('.dock-button')) return;
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const timePercent = Math.min((timeElapsed / timeRecommended) * 100, 100);
  const timeColor = timePercent < 50 ? 'text-emerald-600' : timePercent < 80 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div
      ref={dragRef}
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
          {/* Drag Handle */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <Move size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Focus Mode
            </span>
            <button
              onClick={() => setIsMinimized(true)}
              className="dock-button p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <Minimize2 size={14} className="text-slate-400" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Mic Toggle */}
            <button
              onClick={onMicToggle}
              className={`dock-button flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                isListening
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white scale-110 shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Toggle Microphone"
            >
              <Mic size={20} />
              <span className="text-[10px] font-bold">
                {isListening ? 'REC' : 'MIC'}
              </span>
            </button>

            {/* Camera Toggle */}
            <button
              onClick={onCameraToggle}
              className={`dock-button flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                cameraActive
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Toggle Camera"
            >
              <Video size={20} />
              <span className="text-[10px] font-bold">CAM</span>
            </button>

            {/* TTS Toggle */}
            <button
              onClick={onTTSToggle}
              className={`dock-button flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                isSpeaking
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Toggle Text-to-Speech"
            >
              <Volume2 size={20} />
              <span className="text-[10px] font-bold">TTS</span>
            </button>

            {/* Timer */}
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-100 min-w-[70px]">
              <Clock size={20} className={timeColor} />
              <div className="text-xs font-bold text-slate-700">
                {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
              </div>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all ${
                    timePercent < 50 ? 'bg-emerald-500' : timePercent < 80 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${timePercent}%` }}
                />
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
export const InterviewTimer = ({ timeElapsed, timeRecommended, questionType }) => {
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
      {/* Progress Bar */}
      <div className="h-2 bg-slate-200 relative overflow-hidden">
        <div
          className={`h-full ${status.color} transition-all duration-500 relative`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>

      {/* Status Badge */}
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
export const MarkdownAnswerEditor = ({ value, onChange, isPreview }) => {
  const [showPreview, setShowPreview] = useState(isPreview);

  // Simple syntax highlighting patterns
  const highlightCode = (text) => {
    return text
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-rose-600 px-1 rounded">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="italic text-slate-700">$1</em>');
  };

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(false)}
            className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
              !showPreview ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Code size={12} className="inline mr-1" />
            Edit
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
              showPreview ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles size={12} className="inline mr-1" />
            Preview
          </button>
        </div>
        <span className="text-xs text-slate-500">
          Use `code` for inline code, **bold**, *italic*
        </span>
      </div>

      {showPreview ? (
        <div
          className="min-h-[200px] p-5 bg-white rounded-xl border-2 border-slate-300 prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: highlightCode(value) }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here... Use `backticks` for code snippets."
          rows={8}
          className="w-full p-5 text-base text-slate-800 bg-white rounded-xl border-2 border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none font-mono"
        />
      )}
    </div>
  );
};

// ==========================================
// FEATURE 4A: GHOST INTERVIEWER AVATAR
// ==========================================
export const InterviewerAvatar = ({ isSpeaking, mood = 'neutral' }) => {
  const moodColors = {
    neutral: 'from-slate-600 to-slate-800',
    positive: 'from-emerald-500 to-green-700',
    thinking: 'from-indigo-500 to-purple-700',
    concerned: 'from-amber-500 to-orange-700'
  };

  const moodEmojis = {
    neutral: '🤖',
    positive: '😊',
    thinking: '🤔',
    concerned: '🧐'
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-end gap-3">
      {/* Avatar */}
      <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${moodColors[mood]} flex items-center justify-center text-3xl shadow-2xl border-4 border-white ${
        isSpeaking ? 'animate-pulse scale-110' : ''
      } transition-all`}>
        {moodEmojis[mood]}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
        )}
      </div>

      {/* Speech Bubble */}
      {isSpeaking && (
        <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-xl border border-slate-200 max-w-xs animate-in slide-in-from-left-4 fade-in">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce animation-delay-100" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce animation-delay-200" />
            </div>
            <span className="text-xs font-bold text-slate-600">AI Interviewer</span>
          </div>
          <p className="text-sm text-slate-700">Speaking...</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// FEATURE 4D: DRAGGABLE CAMERA PREVIEW
// ==========================================
export const DraggableCamera = ({ videoRef, isActive }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 180, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('.camera-button')) return;
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: Math.max(0, Math.min(e.clientX - offsetRef.current.x, window.innerWidth - 160)),
      y: Math.max(0, Math.min(e.clientY - offsetRef.current.y, window.innerHeight - 120))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      className={`bg-white rounded-xl shadow-2xl border-4 border-white overflow-hidden transition-all ${
        isCollapsed ? 'w-12 h-12' : 'w-40 h-30'
      }`}
    >
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full h-full flex items-center justify-center camera-button bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <Video size={20} className="text-white" />
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
            className="camera-button absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <Minimize2 size={12} className="text-white" />
          </button>
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-white font-bold">REC</span>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// FEATURE 4D: CUSTOM STDIN INPUT & VIM MODE
// ==========================================
export const CodeEditorEnhancements = ({ onStdinChange, vimMode, onVimToggle }) => {
  const [showStdin, setShowStdin] = useState(false);
  const [stdinValue, setStdinValue] = useState('');

  return (
    <div className="flex items-center gap-3 mb-3">
      {/* Vim Mode Toggle */}
      <button
        onClick={onVimToggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          vimMode
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
        title="Toggle Vim Keybindings"
      >
        <Terminal size={14} />
        Vim Mode {vimMode ? 'ON' : 'OFF'}
      </button>

      {/* Custom Stdin Toggle */}
      <button
        onClick={() => setShowStdin(!showStdin)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          showStdin
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        <Code size={14} />
        Custom Input
      </button>

      {showStdin && (
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={stdinValue}
            onChange={(e) => {
              setStdinValue(e.target.value);
              onStdinChange(e.target.value);
            }}
            placeholder="Enter custom stdin (e.g., 5 10)"
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          <button
            onClick={() => {
              setStdinValue('');
              onStdinChange('');
              setShowStdin(false);
            }}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={14} className="text-slate-500" />
          </button>
        </div>
      )}
    </div>
  );
};

// Demo Component showing all features
export default function InterviewEnhancementsDemo() {
  const [isListening, setIsListening] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(180);
  const [vimMode, setVimMode] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-slate-200">
          <h1 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <Sparkles className="text-indigo-600" size={32} />
            Interview Platform Enhancements
          </h1>

          <div className="space-y-8">
            {/* Feature Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                  <Move size={16} /> 1. Draggable Floating Dock
                </h3>
                <p className="text-sm text-emerald-700">
                  Control all interview tools from one draggable, collapsible panel. Includes mic, camera, TTS, and timer.
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <Clock size={16} /> 2. Visual Timer & Pacing
                </h3>
                <p className="text-sm text-amber-700">
                  Top progress bar changes color based on time remaining. Helps maintain optimal interview pace.
                </p>
              </div>

              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <Code size={16} /> 3. Markdown Editor
                </h3>
                <p className="text-sm text-indigo-700">
                  Live preview for code snippets in text answers. Use `backticks` for inline code highlighting.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                  <Sparkles size={16} /> 4. AI Avatar & IDE Tools
                </h3>
                <p className="text-sm text-purple-700">
                  Animated interviewer avatar, draggable camera, Vim mode, and custom stdin input for code challenges.
                </p>
              </div>
            </div>

            {/* Live Demo Controls */}
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Try Interactive Demo:</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsListening(!isListening)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold"
                >
                  Toggle Mic {isListening ? '(ON)' : '(OFF)'}
                </button>
                <button
                  onClick={() => setIsSpeaking(!isSpeaking)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
                >
                  Toggle TTS {isSpeaking ? '(ON)' : '(OFF)'}
                </button>
                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold"
                >
                  Toggle Camera {cameraActive ? '(ON)' : '(OFF)'}
                </button>
                <button
                  onClick={() => setVimMode(!vimMode)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
                >
                  Vim Mode {vimMode ? '(ON)' : '(OFF)'}
                </button>
              </div>
            </div>

            {/* Implementation Guide */}
            <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
              <h3 className="font-bold text-blue-900 mb-3 text-lg">📦 Integration Guide:</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Import components at the top of your interview page</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Replace fixed camera with <code className="bg-blue-100 px-1 rounded">&lt;DraggableCamera /&gt;</code></span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>Add <code className="bg-blue-100 px-1 rounded">&lt;InterviewTimer /&gt;</code> at top of page</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>Add <code className="bg-blue-100 px-1 rounded">&lt;FloatingDock /&gt;</code> in running stage</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">5.</span>
                  <span>Use <code className="bg-blue-100 px-1 rounded">&lt;MarkdownAnswerEditor /&gt;</code> for text questions</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">6.</span>
                  <span>Add <code className="bg-blue-100 px-1 rounded">&lt;InterviewerAvatar /&gt;</code> during questions</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">7.</span>
                  <span>For Monaco Editor: Pass <code className="bg-blue-100 px-1 rounded">options={`{ vimMode: vimModeEnabled }`}</code></span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Live Components */}
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

      <InterviewTimer
        timeElapsed={timeElapsed}
        timeRecommended={300}
        questionType="coding"
      />

      <DraggableCamera
        videoRef={videoRef}
        isActive={cameraActive}
      />

      <InterviewerAvatar
        isSpeaking={isSpeaking}
        mood={isSpeaking ? 'positive' : 'neutral'}
      />
    </div>
  );
}
