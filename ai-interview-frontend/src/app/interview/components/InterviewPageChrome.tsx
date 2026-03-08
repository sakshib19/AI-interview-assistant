"use client";

import React from "react";
import { AlertCircle, CheckCircle, Loader2, Sparkles, Target, X } from "lucide-react";
import {
  EliminationModal,
  VoiceSettingsModal,
  RoundTransitionModal,
  RoundIndicator,
} from "./InterviewPageShellParts";
import { renderTrendIcon } from "./InterviewPageSections";

type InterviewPageChromeProps = {
  stage: string;
  cameraActive: boolean;
  proctorVideoRef: React.RefObject<HTMLVideoElement | null>;
  captureCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  imageStatus: string;
  showViolationWarning: boolean;
  terminatedByViolation: boolean;
  violationReason: string | null;
  fullscreenPromptVisible: boolean;
  setFullscreenPromptVisible: (value: boolean) => void;
  setNeedsFullscreen: (value: boolean) => void;
  pendingArgsRef: React.MutableRefObject<any>;
  handleStart: (
    arg1?: string | { role_title: string; company_style: string },
    difficulty?: string,
    techStack?: string
  ) => Promise<void>;
  tryRequestFullscreen: () => Promise<boolean>;
  reenterPromptVisible: boolean;
  countdown: number;
  countdownTimerRef: React.MutableRefObject<number | null>;
  endingRef: React.MutableRefObject<boolean>;
  setTerminatedByViolation: (value: boolean) => void;
  stopCamera: () => void;
  endInterview?: (reason: string, isViolation?: boolean) => Promise<any> | void;
  setReenterPromptVisible: (value: boolean) => void;
  setShowViolationWarning: (value: boolean) => void;
  setCountdown: (value: number) => void;
  setViolationReason: (value: string | null) => void;
  violationCount: number;
  cameraError: string | null;
  currentRound: string;
  nextRoundName: string;
  showRoundModal: boolean;
  loadingRoundFeedback: boolean;
  roundSummary: any;
  setShowRoundModal: (value: boolean) => void;
  setCurrentRound: (value: string) => void;
  showVoiceSettings: boolean;
  setShowVoiceSettings: (value: boolean) => void;
  autoReadQuestions: boolean;
  setAutoReadQuestions: (value: boolean) => void;
  speechRate: number;
  setSpeechRate: (value: number) => void;
  selectedVoice: SpeechSynthesisVoice | null;
  availableVoices: SpeechSynthesisVoice[];
  setSelectedVoice: (value: SpeechSynthesisVoice | null) => void;
  speakText: (text: string, priority?: boolean) => void;
  performanceMetrics: any;
  isProbeQuestion: boolean;
  roundProgress: any;
  children: React.ReactNode;
};

export const InterviewPageChrome = ({
  stage,
  cameraActive,
  proctorVideoRef,
  captureCanvasRef,
  imageStatus,
  showViolationWarning,
  terminatedByViolation,
  violationReason,
  fullscreenPromptVisible,
  setFullscreenPromptVisible,
  setNeedsFullscreen,
  pendingArgsRef,
  handleStart,
  tryRequestFullscreen,
  reenterPromptVisible,
  countdown,
  countdownTimerRef,
  endingRef,
  setTerminatedByViolation,
  stopCamera,
  endInterview,
  setReenterPromptVisible,
  setShowViolationWarning,
  setCountdown,
  setViolationReason,
  violationCount,
  cameraError,
  currentRound,
  nextRoundName,
  showRoundModal,
  loadingRoundFeedback,
  roundSummary,
  setShowRoundModal,
  setCurrentRound,
  showVoiceSettings,
  setShowVoiceSettings,
  autoReadQuestions,
  setAutoReadQuestions,
  speechRate,
  setSpeechRate,
  selectedVoice,
  availableVoices,
  setSelectedVoice,
  speakText,
  performanceMetrics,
  isProbeQuestion,
  roundProgress,
  children,
}: InterviewPageChromeProps) => {
  return (
    <>
      {stage === "running" && (
        <div
          className={`fixed top-4 right-4 z-40 w-40 h-30 bg-white rounded-xl shadow-xl border-4 border-white overflow-hidden transform scale-x-[-1] transition-transform duration-300 ${
            cameraActive ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
          }`}
        >
          <video ref={proctorVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <canvas ref={captureCanvasRef} style={{ display: "none" }} />
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-white font-bold tracking-wider">REC</span>
          </div>
        </div>
      )}

      {stage === "running" && imageStatus === "pending" && (
        <div className="fixed top-20 right-4 z-40 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-xl max-w-xs animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-amber-600" size={20} />
            <div>
              <div className="font-bold text-amber-900 text-sm">Restoring Camera...</div>
              <div className="text-xs text-amber-700">Reconnecting proctoring system</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {showViolationWarning && !terminatedByViolation && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-start gap-3 shadow animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            <div>
              <div className="font-bold">Warning â€” Do not change screen</div>
              <div className="text-sm">
                We detected that you switched away from the interview or exited fullscreen:{" "}
                <span className="font-medium">{violationReason}</span>. This is a formal warning. You must
                re-enter fullscreen within 30 seconds or the interview will be terminated.
              </div>
            </div>
          </div>
        )}

        {terminatedByViolation && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-3 shadow animate-in fade-in slide-in-from-top-2">
            <X size={20} className="shrink-0" />
            <div>
              <div className="font-bold">Interview Terminated</div>
              <div className="text-sm">
                The interview was terminated because you changed the screen or exited fullscreen after a previous
                warning:
                <span className="font-medium"> {violationReason}</span>. Your session has ended. Contact the
                administrator if you think this was an error.
              </div>
            </div>
          </div>
        )}

        {fullscreenPromptVisible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-lg w-full bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-2">Enter Full Screen to Begin</h3>
              <p className="mb-4 text-sm text-slate-700 leading-relaxed">
                For exam integrity we require the interview to run in fullscreen. When you enter fullscreen we will
                lock the interview flow to this window. Please click <strong>Enter Fullscreen & Start</strong>. If
                your browser blocks fullscreen, follow its instructions or press <kbd>F11</kbd>. If you prefer not to
                use fullscreen, you may choose <strong>Start anyway (not recommended)</strong> but this may limit your
                eligibility.
              </p>

              <div className="flex justify-between items-center gap-3">
                <div className="text-sm text-slate-600">Fullscreen is strongly recommended to protect test integrity.</div>

                <div className="flex items-center gap-3">
                  <button
                    className="px-4 py-2 rounded border"
                    onClick={async () => {
                      setFullscreenPromptVisible(false);
                      setNeedsFullscreen(false);
                      const args = pendingArgsRef.current || {
                        arg1: "Technical Interview",
                        difficulty: "medium",
                        techStack: "",
                      };
                      await handleStart(args.arg1, args.difficulty, args.techStack);
                    }}
                  >
                    Start anyway (not recommended)
                  </button>

                  <button
                    className="px-4 py-2 rounded bg-indigo-600 text-white"
                    onClick={async () => {
                      setFullscreenPromptVisible(false);
                      const entered = await tryRequestFullscreen();
                      if (entered) {
                        const args = pendingArgsRef.current || {
                          arg1: "Technical Interview",
                          difficulty: "medium",
                          techStack: "",
                        };
                        await handleStart(args.arg1, args.difficulty, args.techStack);
                      } else {
                        setFullscreenPromptVisible(true);
                      }
                    }}
                  >
                    Enter Fullscreen & Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {reenterPromptVisible && !terminatedByViolation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-w-xl w-full bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-rose-700">Immediate Action Required â€” Re-enter Full Screen</h3>
              <p className="mb-3 text-sm text-slate-700 leading-relaxed">
                We detected activity that may indicate you left the interview window: <strong>{violationReason}</strong>.
                For the integrity of this assessment you must re-enter fullscreen within the countdown below.
              </p>

              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-rose-600">{countdown}s</div>
                  <div className="text-sm text-slate-600">remaining to re-enter fullscreen</div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="px-4 py-2 rounded border"
                    onClick={async () => {
                      try {
                        if (countdownTimerRef.current) {
                          window.clearInterval(countdownTimerRef.current);
                          countdownTimerRef.current = null;
                        }
                        endingRef.current = true;
                        setTerminatedByViolation(true);
                        stopCamera();
                        await endInterview?.("Candidate chose to end interview after warning", true);
                        localStorage.removeItem("active_interview_session");
                      } finally {
                        setReenterPromptVisible(false);
                      }
                    }}
                  >
                    End Interview
                  </button>

                  <button
                    className="px-4 py-2 rounded bg-indigo-600 text-white"
                    onClick={async () => {
                      const entered = await tryRequestFullscreen();
                      if (entered) {
                        if (countdownTimerRef.current) {
                          window.clearInterval(countdownTimerRef.current);
                          countdownTimerRef.current = null;
                        }
                        setReenterPromptVisible(false);
                        setShowViolationWarning(false);
                        setCountdown(30);
                      } else {
                        setViolationReason(
                          "Fullscreen blocked or not supported â€” try pressing F11 or allowing fullscreen in your browser."
                        );
                      }
                    }}
                  >
                    Re-enter Fullscreen Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <EliminationModal
          terminatedByViolation={terminatedByViolation}
          stage={String(stage)}
          violationReason={violationReason}
          cameraError={cameraError}
          violationCount={violationCount}
          onReturnToStart={() => {
            stopCamera();
            window.location.reload();
          }}
        />

        <RoundTransitionModal
          show={showRoundModal}
          currentRound={currentRound}
          nextRoundName={nextRoundName}
          loadingRoundFeedback={loadingRoundFeedback}
          roundSummary={roundSummary}
          onStartNextRound={() => {
            setShowRoundModal(false);
            setCurrentRound(nextRoundName);
          }}
        />

        <VoiceSettingsModal
          show={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
          autoReadQuestions={autoReadQuestions}
          onToggleAutoReadQuestions={() => setAutoReadQuestions(!autoReadQuestions)}
          speechRate={speechRate}
          onSpeechRateChange={(rate) => setSpeechRate(rate)}
          selectedVoice={selectedVoice}
          availableVoices={availableVoices}
          onSelectVoice={(voice) => setSelectedVoice(voice)}
          onTestVoice={() => speakText("This is a test of the selected voice and speed", true)}
        />

        <div className="mb-8 relative z-10">
          <div className="absolute top-0 left-10 w-64 h-64 bg-[#cbe557]/10 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute bottom-0 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] -z-10"></div>

          <div className="backdrop-blur-2xl bg-neutral-900/50 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#cbe557] rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                  <div className="relative p-4 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md group-hover:border-[#cbe557]/50 transition-colors">
                    <Sparkles className="text-[#cbe557]" size={36} />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                    AI Technical <span className="text-[#cbe557]">Interview</span>
                  </h1>
                  <p className="text-neutral-400 text-base font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#cbe557] rounded-full animate-pulse shadow-[0_0_10px_#cbe557]"></span>
                    Advanced technical assessment
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group/status">
                  <div className="absolute inset-0 bg-[#cbe557]/20 rounded-2xl blur-lg opacity-0 group-hover/status:opacity-100 transition-opacity"></div>
                  <div className="relative bg-neutral-800/50 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 shadow-lg group-hover/status:border-[#cbe557]/30 transition-all">
                    {stage === "running" ? (
                      <span className="flex items-center gap-3">
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#cbe557] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#cbe557] shadow-[0_0_10px_#cbe557]"></span>
                        </span>
                        <span className="font-bold text-lg text-white tracking-wide">Live Session</span>
                      </span>
                    ) : stage === "done" ? (
                      <span className="flex items-center gap-3 text-neutral-200 font-bold">
                        <CheckCircle size={20} className="text-[#cbe557]" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-neutral-400 font-bold">Ready to Start</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {stage === "running" && performanceMetrics && (
          <div className="mb-6 relative group/metrics z-10">
            <div className="relative backdrop-blur-xl bg-neutral-900/60 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl p-5 hover:bg-neutral-900/80 hover:border-white/20 transition-all duration-500">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#cbe557] to-cyan-400 rounded-xl blur-md opacity-40"></div>
                    <div className="relative p-3 bg-neutral-800 rounded-xl border border-white/10 shadow-xl">
                      <Target size={24} className="text-white" />
                    </div>
                  </div>
                  <span className="font-bold text-xl text-white tracking-wide">Performance Metrics</span>
                </div>
                <div className="flex items-center gap-10 flex-wrap">
                  <div className="group/stat text-center transform hover:scale-105 transition-all duration-300 cursor-default">
                    <div className="relative mb-2">
                      <div className="relative text-2xl md:text-3xl font-black text-white group-hover/stat:text-[#cbe557] transition-colors">
                        {performanceMetrics.question_count}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500 uppercase tracking-widest font-bold group-hover/stat:text-[#cbe557] transition-colors">
                      Questions
                    </div>
                  </div>

                  <div className="group/stat relative text-center transform hover:scale-105 transition-all duration-300 cursor-default">
                    <div className="absolute inset-0 bg-[#cbe557]/10 rounded-full blur-xl opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <svg className="absolute -inset-2 w-20 h-20 -rotate-90">
                        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="none" className="text-neutral-800" />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="url(#limeGradient)"
                          strokeWidth="4"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 36}`}
                          strokeDashoffset={`${2 * Math.PI * 36 * (1 - performanceMetrics.average_score)}`}
                          className="transition-all duration-1000 drop-shadow-[0_0_4px_rgba(203,229,87,0.5)]"
                        />
                        <defs>
                          <linearGradient id="limeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#cbe557" />
                            <stop offset="100%" stopColor="#ffffff" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="relative text-4xl font-black text-white mb-2">
                        {Math.round(performanceMetrics.average_score * 100)}
                        <span className="text-lg text-neutral-500">%</span>
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Average</div>
                  </div>

                  {performanceMetrics.last_score !== null && (
                    <div className="text-center transform hover:scale-105 transition-all duration-300 cursor-default">
                      <div className="text-4xl font-black text-neutral-200 mb-2">
                        {Math.round(performanceMetrics.last_score * 100)}
                        <span className="text-lg text-neutral-500">%</span>
                      </div>
                      <div className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Last Score</div>
                    </div>
                  )}

                  <div className="relative group/trend">
                    <div className="absolute inset-0 bg-[#cbe557]/20 rounded-2xl blur-md opacity-0 group-hover/trend:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-4 px-6 py-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-[#cbe557]/50 transition-all">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#cbe557] shadow-[0_0_15px_rgba(203,229,87,0.4)] transform group-hover/trend:rotate-12 transition-all duration-300">
                        {renderTrendIcon(performanceMetrics.trend)}
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black text-white capitalize">{performanceMetrics.trend.replace("_", " ")}</div>
                        <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Trend</div>
                      </div>
                    </div>
                  </div>

                  {(performanceMetrics.consecutive_wins > 0 || performanceMetrics.consecutive_fails > 0) && (
                    <div
                      className={`relative group/streak overflow-hidden ${
                        performanceMetrics.consecutive_wins > 0
                          ? "bg-gradient-to-br from-[#cbe557]/10 to-transparent border-[#cbe557]/20"
                          : "bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20"
                      } px-6 py-4 rounded-2xl border backdrop-blur-sm transform hover:scale-105 transition-all duration-300 cursor-default`}
                    >
                      <div className="relative text-center">
                        <div
                          className={`text-3xl font-black mb-1 drop-shadow-lg ${
                            performanceMetrics.consecutive_wins > 0 ? "text-[#cbe557]" : "text-red-400"
                          }`}
                        >
                          {performanceMetrics.consecutive_wins > 0 ? (
                            <span className="inline-flex items-center gap-2">ðŸ”¥ {performanceMetrics.consecutive_wins}</span>
                          ) : (
                            <span className="inline-flex items-center gap-2">âš ï¸ {performanceMetrics.consecutive_fails}</span>
                          )}
                        </div>
                        <div
                          className={`text-[10px] uppercase tracking-widest font-bold ${
                            performanceMetrics.consecutive_wins > 0 ? "text-[#cbe557]/80" : "text-red-400/80"
                          }`}
                        >
                          {performanceMetrics.consecutive_wins > 0 ? "Win Streak" : "Needs Focus"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <RoundIndicator
          stage={String(stage)}
          currentRound={currentRound}
          isProbeQuestion={isProbeQuestion}
          roundProgress={roundProgress}
        />

        {children}
      </div>
    </>
  );
};

