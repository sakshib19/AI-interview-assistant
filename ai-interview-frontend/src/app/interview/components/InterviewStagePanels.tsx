"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */

import React from "react";
import Editor from "@monaco-editor/react";
import { AudioVisualizer } from "../../components/AudioVisualizer";
import {
  RoadmapDisplay,
  StructuredFeedback,
  TranscriptCard,
  renderScoreBadge,
  renderVerdictBadge,
} from "./InterviewPageSections";
import {
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  Play,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  XCircle,
  HelpCircle,
  Lightbulb,
  Loader2,
  FileText,
  ArrowRight,
  LayoutTemplate,
  Map,
  Code,
  Layout,
  Zap,
  Mic,
  Square,
  Keyboard,
  Edit3,
  Volume2,
  Pause,
  Settings,
  Bug,
  Layers,
  Terminal,
  Trash2,
  Timer,
} from "lucide-react";

export const InterviewRunningSection = (props: any) => {
  const {
    stage,
    currentQuestion,
    terminatedByViolation,
    lastFeedback,
    isSpeaking,
    isPaused,
    resumeSpeaking,
    pauseSpeaking,
    speakText,
    lastDiagnosis,
    toggleSpeak,
    stopSpeaking,
    speechRate,
    setShowVoiceSettings,
    handleGetHint,
    loadingHint,
    hint,
    history,
    resolvedChallengeForEditor,
    handleRunCode,
    codeStatus,
    answer,
    setAnswer,
    handleEditorDidMount,
    executionResult,
    allTestsPassed,
    codeOutput,
    setCodeOutput,
    setCodeStatus,
    handleSubmitAnswer,
    timeComplexity,
    setTimeComplexity,
    spaceComplexity,
    setSpaceComplexity,
    handleMicToggle,
    isListening,
    isSupported,
    transcriptBuffer,
    showVoiceSettings,
    roundProgress,
    isProbeQuestion,
    whiteboardElements,
    setWhiteboardElements,
    excalidrawAPI,
    setExcalidrawAPI,
    handleExcalidrawChange,
    handleExcalidrawAPI,
    ExcalidrawWrapper,
    currentRound,
    loading,
    token,
  } = props;

  return (
    <>{stage === "running" && currentQuestion && !terminatedByViolation && (
  <div className="space-y-6 max-w-5xl mx-auto text-white">
    {/* ==================== AI MENTOR FEEDBACK CARD ==================== */}
    {lastFeedback && (
      <div className="relative p-8 bg-neutral-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#cbe557]/20 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden group hover:shadow-[#cbe557]/10 transition-shadow">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#cbe557]/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

        <div className="relative z-10 flex items-start gap-5">
          <div className="shrink-0 p-4 bg-[#cbe557]/10 rounded-2xl shadow-inner border border-[#cbe557]/20 transform group-hover:rotate-12 transition-transform duration-300">
            <Lightbulb size={28} className="text-[#cbe557]" />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-sm font-black text-[#cbe557] uppercase tracking-wider flex items-center gap-2 bg-[#cbe557]/5 px-3 py-1 rounded-lg border border-[#cbe557]/20">
                💡 AI Mentor Feedback
              </h4>

              <button
                onClick={() => {
                  if (isSpeaking) {
                    if (isPaused) resumeSpeaking();
                    else pauseSpeaking();
                  } else {
                    speakText(lastFeedback, true);
                  }
                }}
                className="p-3 bg-white/5 hover:bg-[#cbe557] rounded-xl text-[#cbe557] hover:text-black transition-all shadow-md hover:shadow-lg border border-white/10 hover:border-[#cbe557] transform hover:scale-110 active:scale-95"
                title="Read Feedback"
              >
                {isSpeaking ? (
                  isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
            </div>

            <p className="text-neutral-200 text-lg leading-relaxed font-medium">
              {lastFeedback}
            </p>

            {lastDiagnosis && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <StructuredFeedback diagnosis={lastDiagnosis} />
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* ==================== MAIN QUESTION CARD ==================== */}
    <div className="bg-neutral-900/40 rounded-3xl shadow-2xl border border-white/10 overflow-hidden backdrop-blur-xl relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#cbe557]/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

<div className="p-5 md:p-6 border-b border-white/5 backdrop-blur-xl relative overflow-hidden">
        {/* Enhanced decorative orbs with animation */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#cbe557]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10">
          {/* Enhanced top bar */}
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            {/* Question Badge */}
            <div className="relative group">
              <div className="absolute inset-0 bg-[#cbe557]/20 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-xl">
                <Sparkles size={16} className="text-[#cbe557] animate-pulse" />
                <span className="text-xs font-black tracking-widest text-[#cbe557] uppercase">
                  Question {currentQuestion?.questionNumber || (history.filter((h: any) => h.q?.questionId !== currentQuestion?.questionId).length + 1)}
                </span>
              </div>
            </div>

            {/* Controls Group */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Modernized TTS Controls */}
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-2xl p-1.5 shadow-xl border border-white/10">
                <button
                  onClick={toggleSpeak}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all transform hover:scale-105 active:scale-95 ${isSpeaking
                      ? isPaused
                        ? "bg-[#cbe557]/20 text-[#cbe557] shadow-md border border-[#cbe557]/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-white/5 text-neutral-300 hover:bg-[#cbe557] hover:text-black hover:shadow-[#cbe557]/20"
                    }`}
                  title={isSpeaking ? (isPaused ? "Resume" : "Pause") : "Read Question"}
                >
                  {isSpeaking ? (
                    isPaused ? (
                      <>
                        <Play size={16} fill="currentColor" />
                        <span className="hidden sm:inline">Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause size={16} />
                        <span className="hidden sm:inline">Pause</span>
                      </>
                    )
                  ) : (
                    <>
                      <Volume2 size={16} />
                      <span className="hidden sm:inline">Read</span>
                    </>
                  )}
                </button>

                {isSpeaking && (
                  <>
                    <button
                      onClick={stopSpeaking}
                      className="p-2.5 hover:bg-white/10 rounded-xl transition-all transform hover:scale-110 active:scale-95"
                      title="Stop"
                    >
                      <Square size={16} className="text-neutral-400 hover:text-white" />
                    </button>

                    <div className="flex items-center gap-2 px-3 border-l border-white/10">
                      <Zap size={14} className="text-[#cbe557]" />
                      <span className="text-xs text-white font-black">
                        {speechRate.toFixed(1)}x
                      </span>
                    </div>
                  </>
                )}

                <button
                  onClick={() => setShowVoiceSettings(true)}
                  className="p-2.5 hover:bg-white/10 rounded-xl transition-all transform hover:scale-110 active:scale-95"
                  title="Voice Settings"
                >
                  <Settings size={16} className="text-neutral-400 hover:text-white" />
                </button>
              </div>

              {/* Hint Button */}
              <button
                onClick={handleGetHint}
                disabled={loadingHint || !!hint}
                className={`flex items-center gap-2.5 text-xs font-black px-5 py-2.5 rounded-2xl border transition-all transform hover:scale-105 active:scale-95 shadow-lg ${hint
                    ? "bg-[#cbe557]/10 text-[#cbe557] border-[#cbe557]/30"
                    : "bg-black/40 text-neutral-300 border-white/10 hover:border-[#cbe557]/50 hover:text-[#cbe557]"
                  }`}
              >
                {loadingHint ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Lightbulb size={16} className={hint ? "text-[#cbe557] fill-[#cbe557]/20" : ""} />
                )}
                <span>{hint ? "Hint Active (-15%)" : "Get Hint"}</span>
              </button>
            </div>
          </div>

          {/* Difficulty Badge & Timer */}
          {currentQuestion.difficulty && (
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className={`relative inline-flex items-center gap-2.5 text-xs font-black uppercase px-5 py-2.5 rounded-xl shadow-lg border ${currentQuestion.difficulty === "expert" || currentQuestion.difficulty === "hard"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-[#cbe557]/10 text-[#cbe557] border-[#cbe557]/20"
                }`}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-current"></span>
                </span>
                {currentQuestion.difficulty.toUpperCase()}
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-400 bg-black/40 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 shadow-sm">
                <Timer size={14} className="text-[#cbe557]" />
                <span className="font-bold text-neutral-300">45 min remaining</span>
              </div>
            </div>
          )}

          {/* Question Text */}
<h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-4 tracking-tight">
            {currentQuestion.questionText}
          </h2>

          {/* Hint Display */}
          {hint && (
            <div className="mb-6 p-4 bg-[#cbe557]/5 border-l-4 border-[#cbe557] rounded-r-xl shadow-md">
              <div className="flex items-start gap-3">
                <Lightbulb size={20} className="text-[#cbe557] mt-0.5 flex-shrink-0 fill-[#cbe557]/20 animate-pulse" />
                <div>
                  <div className="font-black text-[#cbe557] text-sm mb-1 flex items-center gap-2">
                    💡 Hint <span className="text-xs font-normal text-neutral-400">(-15% score)</span>
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed">{hint}</p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Tags */}
          <div className="flex flex-wrap gap-3">
            {currentQuestion.target_project && (
              <span className="inline-flex items-center gap-2 text-xs bg-blue-500/10 text-blue-400 px-4 py-2.5 rounded-xl border border-blue-500/20 font-black shadow-sm cursor-default">
                🎯 {currentQuestion.target_project}
              </span>
            )}
            {currentQuestion.technology_focus && (
              <span className="inline-flex items-center gap-2 text-xs bg-purple-500/10 text-purple-400 px-4 py-2.5 rounded-xl border border-purple-500/20 font-black shadow-sm cursor-default">
                ⚡ {currentQuestion.technology_focus}
              </span>
            )}
            {currentQuestion.expectedAnswerType === "code" && (
              <span className={`inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl border font-black shadow-sm cursor-default ${currentQuestion.type === 'debugging'
                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}>
                {currentQuestion.type === 'debugging' ? (
                  <>
                    <Bug size={16} /> Debugging Challenge
                  </>
                ) : (
                  <>
                    <Code size={16} /> Code Expected
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ==================== ANSWER FORM AREA ==================== */}
<div className="bg-neutral-950/50 p-4 md:p-6 border-t border-white/10">        <form onSubmit={handleSubmitAnswer}>
          {currentQuestion.expectedAnswerType === "code" ? (
            /* ==================== CODE EDITOR - DARK MODE GLASS ==================== */
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-neutral-900 shadow-xl">

              {/* Editor Header */}
              <div className="bg-white/5 p-4 flex flex-wrap justify-between items-center gap-3 border-b border-white/10">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Language Badge */}
                  <span className="text-xs font-black text-white uppercase bg-white/10 px-3 py-2 rounded-xl shadow-sm border border-white/5">
                    {(resolvedChallengeForEditor.language || "PYTHON").toUpperCase()}
                  </span>

                  {/* Language-specific hints */}
                  {resolvedChallengeForEditor.language === "cpp" && (
                    <span className="text-xs text-[#cbe557] bg-[#cbe557]/10 px-3 py-1.5 rounded-lg border border-[#cbe557]/20 font-medium flex items-center gap-1.5">
                      <Code size={12} />
                      C++: Write complete program with <code className="bg-[#cbe557]/20 px-1 rounded">main()</code>
                    </span>
                  )}

                  {resolvedChallengeForEditor.language === "python" && (
                    <span className="text-xs text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 font-medium flex items-center gap-1.5">
                      <Code size={12} />
                      Python: Define <code className="bg-blue-500/20 px-1 rounded">solve()</code> or read from stdin
                    </span>
                  )}

                  {/* Debugging warning */}
                  {currentQuestion.type === 'debugging' && (
                    <span className="text-xs text-red-400 font-black bg-red-500/10 px-4 py-1.5 rounded-lg border border-red-500/20 flex items-center gap-2 animate-pulse">
                      <Bug size={14} />
                      ⚠️ BUG DETECTED: Find and fix the error
                    </span>
                  )}
                </div>

                {/* Run Code Button (LIME POP) */}
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={codeStatus === "running" || !answer.trim()}
                  className={`group/run px-5 py-2.5 text-sm font-black rounded-xl flex items-center gap-2.5 transition-all shadow-lg ${codeStatus === "running"
                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                      : "bg-[#cbe557] text-neutral-950 hover:bg-[#b5cc4e] hover:shadow-[#cbe557]/40 hover:scale-105 active:scale-95"
                    }`}
                >
                  {codeStatus === "running" ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" className="group-hover/run:scale-110 transition-transform" />
                      <span>Run Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Monaco Editor */}
              <div className="h-[400px] w-full relative bg-[#1e1e1e]">
                <Editor
                  key={resolvedChallengeForEditor.language || "python"}
                  height="100%"
                  defaultLanguage={(resolvedChallengeForEditor.language || "python").toLowerCase()}
                  value={answer}
                  onChange={(val) => setAnswer(val || "")}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    lineNumbers: "on",
                    renderLineHighlight: "all",
                    cursorBlinking: "smooth"
                  }}
                />
              </div>

              {/* Console Output Terminal */}
              <div className="bg-black text-neutral-300 p-5 font-mono text-sm border-t border-[#cbe557]/30">

                {/* Test Case Requirements Display */}
                <div className="mb-4 p-3 bg-neutral-900 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-neutral-500 font-black uppercase tracking-wider flex items-center gap-2">
                        <ArrowRight size={12} className="text-[#cbe557]" />
                        Input:
                      </span>
                      <code className="text-[#cbe557] bg-white/5 px-2 py-1 rounded font-medium">
                        {resolvedChallengeForEditor.test_case_input ?? resolvedChallengeForEditor.test_case ?? "[]"}
                      </code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-neutral-500 font-black uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle size={12} className="text-emerald-400" />
                        Expected Output:
                      </span>
                      <code className="text-emerald-300 bg-white/5 px-2 py-1 rounded font-medium">
                        {resolvedChallengeForEditor.expected_output ?? resolvedChallengeForEditor.expected ?? ""}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Console Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                    <Terminal size={14} className="text-[#cbe557]" />
                    Console Output
                  </div>

                  {/* Status Badges */}
                  {codeStatus === "success" && allTestsPassed && (
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-2 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/30 animate-in fade-in">
                      <CheckCircle size={14} /> All Tests Passed ✓
                    </span>
                  )}

                  {codeStatus === "error" && executionResult && !allTestsPassed && (
                    <span className="text-xs font-black text-red-400 flex items-center gap-2 bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/30 animate-in fade-in">
                      <XCircle size={14} /> Tests Failed ✗
                    </span>
                  )}
                </div>

                {/* Output Display Area */}
                <div className="bg-neutral-950/80 backdrop-blur-sm p-4 rounded-xl min-h-[100px] max-h-[220px] overflow-y-auto border border-white/10 shadow-inner">
                  {codeStatus === "idle" && !codeOutput && (
                    <span className="text-neutral-600 italic flex items-center gap-2">
                      <Play size={14} />
                      Click "Run Code" to see output...
                    </span>
                  )}

                  {codeStatus === "running" && (
                    <span className="text-[#cbe557] font-bold flex items-center gap-2 animate-pulse">
                      <Loader2 className="animate-spin" size={14} />
                      Executing code in container...
                    </span>
                  )}

                  {/* Actual Output */}
                  {codeOutput && (
                    <pre className={`whitespace-pre-wrap break-words font-mono text-sm leading-relaxed ${codeStatus === "error" && !allTestsPassed ? "text-red-400" : "text-emerald-400"
                      }`}>
                      {codeOutput}
                    </pre>
                  )}

                  {/* Debug Information */}
                  {executionResult?.debug && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="text-neutral-500 font-black text-xs mb-2 flex items-center gap-2">
                        <Bug size={12} className="text-[#cbe557]" />
                        Debug Information:
                      </div>
                      <pre className="text-[#cbe557] whitespace-pre-wrap text-xs bg-[#cbe557]/5 p-2 rounded border border-[#cbe557]/10">
                        {executionResult.debug}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

          ) : currentQuestion.expectedAnswerType === "system_design" ? (
            /* ==================== SYSTEM DESIGN WHITEBOARD - DARK ==================== */
            <div className="flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-neutral-900 shadow-xl">

              {/* Enhanced Header */}
              <div className="bg-white/5 p-4 flex flex-wrap justify-between items-center gap-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-[#cbe557] uppercase bg-[#cbe557]/10 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm border border-[#cbe557]/20">
                    <LayoutTemplate size={16} /> System Design
                  </span>
                  <span className="text-xs text-neutral-400 font-medium flex items-center gap-2">
                    <Sparkles size={12} className="text-purple-400" />
                    Draw your architecture below
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (excalidrawAPI) {
                        excalidrawAPI.scrollToContent();
                        excalidrawAPI.updateScene({
                          appState: { zoom: { value: 1 } }
                        });
                      }
                    }}
                    className="group/center text-xs px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 font-black transition-all hover:scale-105 active:scale-95 shadow-sm border border-blue-500/20 flex items-center gap-2"
                  >
                    <Target size={14} className="group-hover/center:rotate-90 transition-transform" />
                    Center View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (excalidrawAPI) {
                        excalidrawAPI.resetScene();
                        setWhiteboardElements([]);
                      }
                    }}
                    className="group/clear text-xs px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 font-black transition-all hover:scale-105 active:scale-95 shadow-sm border border-red-500/20 flex items-center gap-2"
                  >
                    <Trash2 size={14} className="group-hover/clear:rotate-12 transition-transform" />
                    Clear Canvas
                  </button>
                </div>
              </div>

              {/* Canvas Area */}
              <div
                style={{
                  width: "100%",
                  height: "500px",
                  position: "relative",
                  isolation: "isolate",
                }}
              >
                <ExcalidrawWrapper
                  onChange={handleExcalidrawChange}
                  excalidrawAPI={handleExcalidrawAPI}
                  viewModeEnabled={false}
                  zenModeEnabled={false}
                  gridModeEnabled={true}
                  initialData={{
                    appState: {
                      viewBackgroundColor: "#171717",
                      currentItemStrokeColor: "#cbe557",
                      currentItemBackgroundColor: "transparent",
                      currentItemStrokeWidth: 2,
                      zoom: { value: 1 },
                      scrollX: 0,
                      scrollY: 0,
                    },
                    elements: [],
                  }}
                />
              </div>

              {/* Text Explanation Area */}
              <div className="p-5 bg-neutral-900 border-t border-white/10 shrink-0">
                <label className="block text-xs font-black text-neutral-400 uppercase mb-3 flex items-center gap-2">
                  <FileText size={14} className="text-[#cbe557]" />
                  Architecture Explanation
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  placeholder="Describe your system architecture: components, data flow, scalability strategies, database choices, caching layers, load balancing..."
                  className="w-full p-4 text-sm bg-neutral-950 text-white rounded-xl border border-white/10 focus:ring-1 focus:ring-[#cbe557] focus:border-[#cbe557] outline-none resize-none shadow-inner placeholder:text-neutral-600 leading-relaxed"
                />
                <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Keyboard size={12} />
                    {answer.length} characters
                  </span>
                  <span className="italic">💡 Be specific about scalability and trade-offs</span>
                </div>
              </div>
            </div>

          ) : (
            /* ==================== TEXT/VOICE INPUT - DARK ==================== */
            <div className="relative group">

              {/* Header Status Bar */}
              <div className="flex justify-between items-center mb-3 px-1">
                <label className="text-xs font-black text-neutral-400 uppercase flex items-center gap-2">
                  <Edit3 size={14} className="text-[#cbe557]" />
                  Your Answer
                </label>

                <div className={`text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-2 transition-all h-8 ${isListening
                    ? "bg-[#cbe557]/10 border border-[#cbe557]/30 shadow-[0_0_15px_-3px_rgba(203,229,87,0.3)]"
                    : "bg-white/5 text-neutral-500 border border-white/5"
                  }`}>
                  {isListening ? (
                    <>
                      {/* Render Visualizer here */}
                      <AudioVisualizer isListening={isListening} />
                      <span className="text-[#cbe557] animate-pulse ml-1">Live</span>
                    </>
                  ) : (
                    <>
                      <Mic size={12} />
                      Type or Dictate
                    </>
                  )}
                </div>
              </div>

              {/* Input Container */}
              <div className={`relative rounded-2xl border transition-all bg-neutral-900/50 overflow-hidden shadow-lg ${isListening
                  ? "border-[#cbe557] shadow-[0_0_40px_rgba(203,229,87,0.1)] ring-1 ring-[#cbe557]/20"
                  : "border-white/10 hover:border-white/20 focus-within:border-[#cbe557] focus-within:ring-1 focus-within:ring-[#cbe557]/20"
                }`}>

                {/* Textarea */}
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here... or click the microphone to speak."
                  rows={8}
                  className="w-full p-6 text-base text-white outline-none resize-none bg-transparent relative z-10 placeholder:text-neutral-600 leading-relaxed"
                />

                {/* Floating Mic Button (LIME POP) */}
                <button
                  type="button"
                  onClick={handleMicToggle}
                  disabled={!isSupported}
                  className={`absolute bottom-5 right-5 p-4 rounded-2xl shadow-2xl transition-all z-30 flex items-center gap-2.5 font-black group/mic ${!isSupported
                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                      : isListening
                        ? "bg-red-500 text-white hover:bg-red-600 scale-110 ring-4 ring-red-500/30 animate-pulse"
                        : "bg-[#cbe557] text-black hover:bg-[#b5cc4e] hover:scale-105 hover:shadow-[0_0_20px_rgba(203,229,87,0.4)]"
                    }`}
                >
                  {isListening ? (
                    <>
                      <Square size={22} fill="currentColor" />
                      <span className="text-sm">Stop</span>
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-400 rounded-full animate-ping"></span>
                    </>
                  ) : (
                    <>
                      <Mic size={24} className="group-hover/mic:scale-110 group-hover/mic:rotate-12 transition-transform" />
                      <span className="text-sm opacity-0 group-hover/mic:opacity-100 transition-opacity whitespace-nowrap">
                        Speak
                      </span>
                    </>
                  )}
                </button>

                {/* Live Transcript Overlay */}
                {isListening && transcriptBuffer && (
                  <div className="absolute bottom-28 left-5 right-5 z-20 animate-in slide-in-from-bottom-4">
                    <div className="bg-neutral-900/90 text-white p-5 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1.5">
                          {[...Array(3)].map((_, i) => (
                            <span
                              key={i}
                              className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-black uppercase text-red-400 tracking-widest">
                          🔴 Recording
                        </span>
                        <div className="ml-auto flex items-center gap-2 text-xs text-neutral-400">
                          <Zap size={12} className="text-[#cbe557]" />
                          <span className="font-bold text-[#cbe557]">
                            {transcriptBuffer.split(' ').filter((w: string) => w).length}
                          </span>
                          words
                        </div>
                      </div>
                      <p className="text-base font-medium leading-relaxed text-neutral-200">
                        {transcriptBuffer}
                        <span className="inline-block w-0.5 h-5 ml-1.5 align-middle bg-[#cbe557] animate-pulse" />
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Stats */}
              <div className="mt-3 flex items-center justify-between text-xs px-1">
                <span className="flex items-center gap-2 text-neutral-500 font-medium">
                  <Keyboard size={13} />
                  <span className="font-black text-neutral-300">{answer.length}</span>
                  <span className="text-neutral-600">characters</span>
                </span>
                <span className="text-neutral-500 italic flex items-center gap-1.5">
                  {isListening ? (
                    <>
                      <Mic size={12} className="text-[#cbe557] animate-pulse" />
                      Processing voice input...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="text-[#cbe557]" />
                      You can edit text while speaking
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* ==================== COMPLEXITY INPUTS (Code Questions) ==================== */}
          {currentQuestion.expectedAnswerType === "code" && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group/complexity bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-[#cbe557]/50 transition-all shadow-sm">
                <label className="block text-xs font-black text-neutral-400 uppercase mb-3 flex items-center gap-2">
                  <Zap size={14} className="text-[#cbe557]" />
                  Time Complexity
                </label>
                <input
                  type="text"
                  placeholder="e.g. O(n log n)"
                  value={timeComplexity}
                  onChange={(e) => setTimeComplexity(e.target.value)}
                  className="w-full text-base font-mono font-bold text-white outline-none bg-transparent placeholder:text-neutral-600 focus:text-[#cbe557]"
                />
              </div>
              <div className="group/complexity bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-purple-400/50 transition-all shadow-sm">
                <label className="block text-xs font-black text-neutral-400 uppercase mb-3 flex items-center gap-2">
                  <Layers size={14} className="text-purple-400" />
                  Space Complexity
                </label>
                <input
                  type="text"
                  placeholder="e.g. O(1)"
                  value={spaceComplexity}
                  onChange={(e) => setSpaceComplexity(e.target.value)}
                  className="w-full text-base font-mono font-bold text-white outline-none bg-transparent placeholder:text-neutral-600 focus:text-purple-400"
                />
              </div>
            </div>
          )}

          {/* ==================== ACTION BUTTONS ==================== */}
          <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
            {/* Clear Button */}
            <button
              type="button"
              onClick={() => {
                setAnswer("");
                setCodeOutput(null);
                setCodeStatus("idle");
                setTimeComplexity("");
                setSpaceComplexity("");
                setWhiteboardElements([]);
                if (excalidrawAPI) {
                  excalidrawAPI.resetScene();
                }
              }}
              className="group/clear flex items-center gap-2.5 text-neutral-500 text-sm font-black hover:text-white transition-all px-5 py-3 hover:bg-white/10 rounded-xl border border-transparent hover:border-white/10"
            >
              <Trash2 size={16} className="group-hover/clear:rotate-12 group-hover/clear:scale-110 transition-transform" />
              Clear Answer
            </button>

            {/* Submit Button (LIME PRIMARY) */}
            <button
              type="submit"
              disabled={loading || !token || !answer.trim()}
              className={`relative group/submit px-8 md:px-12 py-4 md:py-5 rounded-xl font-black text-base md:text-lg shadow-2xl transition-all transform active:scale-95 flex items-center gap-4 overflow-hidden ${!token || !answer.trim() || loading
                  ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                  : "bg-[#cbe557] text-neutral-950 hover:shadow-[#cbe557]/40 hover:shadow-2xl hover:scale-[1.03]"
                }`}
            >
              {/* Animated shine */}
              {!loading && token && answer.trim() && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/submit:translate-x-full transition-transform duration-1000"></div>

                  {/* Sparkle particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-black rounded-full opacity-0 group-hover/submit:opacity-50 group-hover/submit:animate-ping"
                        style={{
                          left: `${15 + i * 18}%`,
                          top: `${25 + i * 12}%`,
                          animationDelay: `${i * 0.15}s`
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              <span className="relative z-10 flex items-center gap-3">
                {loading ? (
                  <>
                    <div className="w-7 h-7 border-4 border-black/30 border-t-black rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <CheckCircle size={26} className="group-hover/submit:scale-110 group-hover/submit:rotate-12 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
)}

        {/* FINAL RESULTS (unchanged) */}
    </>
  );
};

export const InterviewFinalSection = (props: any) => {
  const {
    stage,
    terminatedByViolation,
    finalDecision,
    loadingFinalReport,
    finalReport,
    performanceMetrics,
    showReport,
    setShowReport,
    speakText,
    generatePDF,
    fetchRoadmap,
    loadingRoadmap,
    roadmap,
    setConfirmRestartVisible,
    confirmRestartVisible,
    roadmapTitle,
    history,
    fetchFinalReport,
  } = props;

  return (
    <>{stage === "done" && (
          <div className="max-w-6xl mx-auto animate-in fade-in zoom-in duration-700 pb-20">
            
            {/* Main Result Card - Dark Glassmorphism */}
            <div className="relative overflow-hidden rounded-3xl bg-neutral-900/80 border border-white/10 shadow-2xl backdrop-blur-xl">
              
              {/* Animated Background Glow */}
              <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
              <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-[#cbe557]/5 rounded-full blur-[100px] pointer-events-none"></div>

              <div className="relative z-10 p-8 md:p-12">
                
                {/* Header Section */}
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#cbe557] to-emerald-600 text-black mb-6 shadow-[0_0_40px_rgba(203,229,87,0.3)] ring-4 ring-[#cbe557]/20">
                    <Award size={48} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                    Assessment Complete
                  </h2>
                  <p className="text-neutral-400 text-lg font-medium">
                    {finalReport?.meta?.duration_minutes 
                      ? `Completed in ${finalReport.meta.duration_minutes} minutes` 
                      : "Here is your comprehensive performance analysis"}
                  </p>
                </div>

                {/* 1. LOADING STATE FOR REPORT */}
                {loadingFinalReport ? (
                  <div className="py-24 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                    <Loader2 className="animate-spin text-[#cbe557] w-14 h-14 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">Compiling AI Report...</h3>
                    <p className="text-neutral-400 max-w-md mx-auto mb-8">
                      Analyzing code quality, time complexity, and verbal responses to generate actionable insights.
                    </p>
                    
                    <button 
                      onClick={() => fetchFinalReport()}
                      className="px-6 py-2 bg-neutral-800 border border-white/10 text-neutral-300 rounded-lg text-sm font-bold hover:bg-neutral-700 hover:text-white transition-colors"
                    >
                      Click here if this takes too long
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 2. TOP METRICS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                      {/* Verdict Card */}
                      <div className="relative group overflow-hidden bg-gradient-to-br from-white/5 to-white/0 p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center hover:border-[#cbe557]/30 transition-all duration-500">
                        <div className="absolute inset-0 bg-[#cbe557]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <span className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">Final Verdict</span>
                        
                        <div className="transform scale-125 drop-shadow-2xl">
                          {renderVerdictBadge(finalReport?.overall?.verdict || finalDecision?.verdict)}
                        </div>
                        
                        {finalReport?.overall?.decision_reason && (
                          <p className="mt-6 text-sm text-neutral-400 italic max-w-sm border-t border-white/10 pt-4">
                            "{finalReport.overall.decision_reason}"
                          </p>
                        )}
                      </div>
                      
                      {/* Score Card */}
                      <div className="relative group overflow-hidden bg-black/40 p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                          <Target size={120} className="text-white" />
                        </div>
                        
                        <span className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Technical Score</span>
                        
                        <div className="relative z-10">
                          <div className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            {Math.round((finalReport?.overall?.score || performanceMetrics?.average_score || 0) * 100)}<span className="text-4xl text-neutral-600">%</span>
                          </div>
                        </div>

                        {/* Star Rating Visualization */}
                        <div className="flex gap-2 mt-4 relative z-10 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Sparkles 
                              key={star} 
                              size={20} 
                              className={`${
                                star <= Math.round(((finalReport?.overall?.score || performanceMetrics?.average_score || 0) * 5)) 
                                  ? "text-[#cbe557] fill-[#cbe557] drop-shadow-[0_0_8px_#cbe557]" 
                                  : "text-neutral-700"
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 3. EXECUTIVE SUMMARY */}
                    <div className="mb-12 bg-white/5 p-8 md:p-10 rounded-3xl border-l-4 border-[#cbe557] backdrop-blur-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                        <FileText size={100} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                        <span className="p-2 bg-[#cbe557] rounded-lg text-black">
                          <FileText size={24} />
                        </span>
                        Executive Summary
                      </h3>
                      <p className="text-neutral-300 text-lg leading-relaxed font-light">
                        {finalReport?.overall?.feedback_summary || finalDecision?.feedback_summary || finalDecision?.reason || "Analysis pending..."}
                      </p>
                    </div>

                    {/* 4. ROUND-BY-ROUND PERFORMANCE */}
                    {finalReport?.rounds && Object.keys(finalReport.rounds).length > 0 && (
                      <div className="mb-12 animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                          <Layout size={24} className="text-[#cbe557]" />
                          Round Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {Object.entries(finalReport.rounds).map(([name, data]: [string, any]) => (
                            <div key={name} className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1 group">
                              <div className="flex justify-between items-start mb-4">
                                <span className="capitalize font-bold text-white text-lg tracking-wide">{name}</span>
                                <span className={`text-xs font-black px-3 py-1.5 rounded-lg border ${
                                  data.score > 0.7 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                  data.score > 0.4 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {Math.round(data.score * 100)}%
                                </span>
                              </div>
                              <p className="text-sm text-neutral-400 line-clamp-4 leading-relaxed mb-4 min-h-[5rem] group-hover:text-neutral-300 transition-colors">
                                {data.feedback}
                              </p>
                              {data.weaknesses?.length > 0 && (
                                <div className="pt-4 border-t border-white/5">
                                  <div className="text-[10px] font-bold text-rose-400 uppercase mb-1 flex items-center gap-1">
                                    <TrendingDown size={10} /> Key Weakness
                                  </div>
                                  <div className="text-xs text-neutral-300 truncate">
                                    {data.weaknesses[0]}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5. DETAILED STRENGTHS & WEAKNESSES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                      {/* Left: Strengths */}
                      <div className="bg-gradient-to-b from-emerald-900/20 to-transparent p-8 rounded-3xl border border-emerald-500/20">
                        <h4 className="font-bold text-emerald-400 mb-6 flex items-center gap-3 text-lg">
                          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <TrendingUp size={20} /> 
                          </div>
                          Key Strengths
                        </h4>
                        <div className="space-y-4">
                          {(finalReport?.details?.key_strengths || finalDecision?.key_strengths || []).map((s: string, i: number) => (
                            <div key={i} className="flex gap-4 p-4 bg-black/40 rounded-xl border border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
                              <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-sm text-neutral-200 font-medium leading-relaxed">{s}</span>
                            </div>
                          ))}
                          {(finalReport?.details?.key_strengths || finalDecision?.key_strengths || []).length === 0 && (
                            <div className="text-sm text-neutral-500 italic px-4">None detected yet.</div>
                          )}
                        </div>
                      </div>

                      {/* Right: Weaknesses */}
                      <div className="bg-gradient-to-b from-rose-900/20 to-transparent p-8 rounded-3xl border border-rose-500/20">
                        <h4 className="font-bold text-rose-400 mb-6 flex items-center gap-3 text-lg">
                          <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                            <AlertCircle size={20} />
                          </div>
                          Areas for Growth
                        </h4>
                        <div className="space-y-4">
                          {(finalReport?.details?.areas_for_improvement || finalDecision?.critical_weaknesses || []).map((w: string, i: number) => (
                            <div key={i} className="flex gap-4 p-4 bg-black/40 rounded-xl border border-rose-500/10 hover:border-rose-500/30 transition-colors">
                              <Target size={20} className="text-rose-500 shrink-0 mt-0.5" />
                              <span className="text-sm text-neutral-200 font-medium leading-relaxed">{w}</span>
                            </div>
                          ))}
                          {(finalReport?.details?.areas_for_improvement || finalDecision?.critical_weaknesses || []).length === 0 && (
                            <div className="text-sm text-neutral-500 italic px-4">
                              {(finalReport?.overall?.verdict || finalDecision?.verdict) === "reject"
                                ? "Specific weaknesses not listed due to early termination."
                                : "None detected. Great job!"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 6. RECOMMENDED ROLE */}
                {(finalReport?.details?.recommended_role || finalDecision?.recommended_role) && (
                  <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-3 bg-white/5 px-8 py-3 rounded-full border border-white/10 backdrop-blur-md">
                      <span className="text-neutral-400 text-sm font-bold uppercase tracking-wider">Recommended Role</span>
                      <div className="h-4 w-px bg-white/20"></div>
                      <span className="text-white text-base font-black tracking-wide">
                        {finalReport?.details?.recommended_role || finalDecision?.recommended_role}
                      </span>
                    </div>
                  </div>
                )}

                {/* 7. ACTION BUTTONS - Modern Dark Style */}
                <div className="flex flex-col md:flex-row justify-center gap-4 mt-8 pt-8 border-t border-white/10 flex-wrap">
                  <button
                    onClick={() => setShowReport(!showReport)}
                    className="px-8 py-4 bg-neutral-800 text-white rounded-2xl hover:bg-neutral-700 font-bold transition-all shadow-lg hover:-translate-y-1 border border-white/5"
                  >
                    {showReport ? "Hide Transcript" : "View Transcript"}
                  </button>

                  <button
                    onClick={() => speakText(finalReport?.overall?.feedback_summary || finalDecision?.feedback_summary || finalDecision?.reason)}
                    className="px-8 py-4 bg-neutral-800 text-[#cbe557] rounded-2xl hover:bg-neutral-700 font-bold transition-all shadow-lg hover:-translate-y-1 border border-white/5 flex items-center justify-center gap-3"
                  >
                    <Volume2 size={20} /> Listen Report
                  </button>
                  
                  <button
                    onClick={generatePDF}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all font-bold flex items-center justify-center gap-3 border border-white/10"
                  >
                    <FileText size={20} /> Download PDF
                  </button>

                  {/* 🔥 NEW: Generate Roadmap Button */}
                  <button
                    onClick={fetchRoadmap}
                    disabled={loadingRoadmap || !!roadmap}
                    className={`px-8 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 border border-white/10 hover:-translate-y-1 ${
                      roadmap 
                        ? "bg-neutral-800 text-neutral-500 cursor-default" 
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-900/30 hover:shadow-blue-500/20"
                    }`}
                  >
                    {loadingRoadmap ? <Loader2 className="animate-spin" size={20} /> : <Map size={20} />}
                    {roadmap ? "Roadmap Ready" : "Generate Roadmap"}
                  </button>

                  <button
                    onClick={() => setConfirmRestartVisible(true)}
                    className="px-8 py-4 bg-gradient-to-r from-[#cbe557] to-[#a3b846] text-black rounded-2xl hover:shadow-[#cbe557]/30 hover:-translate-y-1 font-black transition-all shadow-lg border border-white/20"
                  >
                    Start New Interview
                  </button>
                </div>

                {/* 8. ROADMAP DISPLAY */}
                {roadmap && (
                  <div className="mt-16 w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
                     <RoadmapDisplay plan={roadmap} title={roadmapTitle} />
                  </div>
                )}

                {/* 9. CONFIRM RESTART MODAL */}
                {confirmRestartVisible && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
                    <div className="max-w-md w-full bg-neutral-900 rounded-3xl p-8 shadow-2xl border border-white/10 animate-in zoom-in">
                      <h4 className="font-bold text-2xl mb-3 text-white">Start a new interview?</h4>
                      <p className="text-neutral-400 mb-8 leading-relaxed">
                        This will clear your current progress and results. Are you sure you want to proceed?
                      </p>
                      <div className="flex gap-4 justify-end">
                        <button
                          className="px-6 py-3 rounded-xl border border-white/10 text-neutral-300 font-bold hover:bg-white/5 transition-colors"
                          onClick={() => setConfirmRestartVisible(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-6 py-3 rounded-xl bg-[#cbe557] text-black font-bold hover:bg-[#b5cc4e] shadow-lg shadow-[#cbe557]/20 transition-all"
                          onClick={() => {
                            localStorage.removeItem("active_interview_session");
                            window.location.reload();
                          }}
                        >
                          Yes, Start New
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. FULL TRANSCRIPT */}
                {showReport && (
                  <div className="mt-16 pt-12 border-t border-white/10 space-y-8">
                    <h3 className="font-black text-3xl text-white flex items-center gap-4">
                      <div className="w-2 h-10 bg-[#cbe557] rounded-full shadow-[0_0_15px_#cbe557]"></div>
                      Complete Transcript
                    </h3>
                    <div className="grid gap-8">
                      {history.map((h: any, idx: number) => (
                        <TranscriptCard key={idx} h={h} idx={idx} renderScoreBadge={renderScoreBadge} />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
    </>
  );
};