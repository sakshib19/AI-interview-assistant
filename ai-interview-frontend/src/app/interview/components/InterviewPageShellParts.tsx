"use client";

import React from "react";
import InterviewConfigModal from "../../components/InterviewConfigModal";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Code,
  HelpCircle,
  Loader2,
  Play,
  Settings,
  Target,
  X,
  XCircle,
} from "lucide-react";

export type ImageStatus = "pending" | "capturing" | "captured" | "error";

export const getImageStatusIndicator = (imageStatus: ImageStatus) => {
  switch (imageStatus) {
    case "captured":
      return {
        text: (
          <>
            <CheckCircle size={14} className="inline mr-1" /> Ready
          </>
        ),
        className: "bg-emerald-50 text-emerald-800 border-emerald-300",
      };
    case "capturing":
      return {
        text: (
          <>
            <Loader2 size={14} className="inline mr-1 animate-spin" /> Capturing...
          </>
        ),
        className: "bg-indigo-50 text-indigo-800 border-indigo-300",
      };
    case "error":
      return {
        text: (
          <>
            <AlertCircle size={14} className="inline mr-1" /> Failed - Click to Retry
          </>
        ),
        className: "bg-rose-50 text-rose-800 border-rose-300 cursor-pointer",
      };
    case "pending":
    default:
      return {
        text: "Initializing Camera...",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
  }
};

type EliminationModalProps = {
  terminatedByViolation: boolean;
  stage: string;
  violationReason: string | null;
  cameraError: string | null;
  violationCount: number;
  onReturnToStart: () => void;
};

export const EliminationModal = ({
  terminatedByViolation,
  stage,
  violationReason,
  cameraError,
  violationCount,
  onReturnToStart,
}: EliminationModalProps) => {
  if (!terminatedByViolation || stage !== "running") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-xl w-full bg-white rounded-xl p-8 shadow-lg">
        <div className="text-center">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={40} className="text-rose-600" />
          </div>

          <h3 className="text-2xl font-bold mb-2 text-slate-900">Interview Ended</h3>

          <p className="text-slate-600 mb-4">
            {violationReason ||
              cameraError ||
              "The interview has been terminated due to multiple integrity violations."}
          </p>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-rose-800">
              <strong>Violation Count:</strong> {violationCount}
            </div>
          </div>

          <button
            onClick={onReturnToStart}
            className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-bold"
          >
            Return to Start
          </button>
        </div>
      </div>
    </div>
  );
};

type VoiceSettingsModalProps = {
  show: boolean;
  onClose: () => void;
  autoReadQuestions: boolean;
  onToggleAutoReadQuestions: () => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  selectedVoice: SpeechSynthesisVoice | null;
  availableVoices: SpeechSynthesisVoice[];
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
  onTestVoice: () => void;
};

export const VoiceSettingsModal = ({
  show,
  onClose,
  autoReadQuestions,
  onToggleAutoReadQuestions,
  speechRate,
  onSpeechRateChange,
  selectedVoice,
  availableVoices,
  onSelectVoice,
  onTestVoice,
}: VoiceSettingsModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in fade-in">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Settings size={20} />
              Voice Settings
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">Auto-read questions</label>
            <button
              onClick={onToggleAutoReadQuestions}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoReadQuestions ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoReadQuestions ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">Read AI feedback aloud</label>
            <button
              onClick={onToggleAutoReadQuestions}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoReadQuestions ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoReadQuestions ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">
              Speech Rate: {speechRate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">
              Voice Selection
            </label>
            <select
              value={selectedVoice?.name || ""}
              onChange={(e) => {
                const voice = availableVoices.find((v) => v.name === e.target.value);
                if (voice) onSelectVoice(voice);
              }}
              className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
            >
              {availableVoices
                .filter((v) => v.lang.startsWith("en"))
                .map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
            </select>
          </div>

          <button
            onClick={onTestVoice}
            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
          >
            Test Voice
          </button>
        </div>
      </div>
    </div>
  );
};

type RoundSummary = {
  score?: number;
  feedback?: string;
  strengths?: string[];
};

type RoundTransitionModalProps = {
  show: boolean;
  currentRound: string;
  nextRoundName: string;
  loadingRoundFeedback: boolean;
  roundSummary: RoundSummary | null;
  onStartNextRound: () => void;
};

export const RoundTransitionModal = ({
  show,
  currentRound,
  nextRoundName,
  loadingRoundFeedback,
  roundSummary,
  onStartNextRound,
}: RoundTransitionModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="max-w-2xl w-full bg-white rounded-2xl p-8 shadow-2xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center shadow-inner border-4 border-white ring-2 ring-indigo-100">
            <CheckCircle size={40} className="text-indigo-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-2 capitalize">
            {currentRound} Round Complete
          </h3>
          <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-1 rounded-full">
            <span className="text-slate-500 font-medium text-sm">Next Stage:</span>
            <span className="text-indigo-700 font-bold uppercase tracking-wide text-sm">
              {nextRoundName}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8 min-h-[160px] relative">
          {loadingRoundFeedback ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <span className="text-sm text-slate-500 font-medium animate-pulse">
                AI is analyzing your {currentRound} performance...
              </span>
            </div>
          ) : roundSummary ? (
            <div className="animate-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                <h4 className="font-bold text-slate-700">Round Performance</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Score:</span>
                  <span
                    className={`text-xl font-black ${
                      (roundSummary.score || 0) > 0.7 ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {Math.round((roundSummary.score || 0) * 100)}%
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {roundSummary.feedback || "No specific feedback generated."}
              </p>

              {roundSummary.strengths?.length ? (
                <div className="flex flex-wrap gap-2">
                  {roundSummary.strengths.slice(0, 3).map((strength, index) => (
                    <span
                      key={`${strength}-${index}`}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100"
                    >
                      ✓ {strength}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <AlertCircle size={24} className="mb-2 opacity-50" />
              <span className="text-sm">Feedback unavailable for this round.</span>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={onStartNextRound}
            className="group relative inline-flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-slate-800 hover:scale-[1.02] transition-all active:scale-95"
          >
            <span>Start {nextRoundName} Round</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

type RoundProgressEntry = {
  questions?: number;
  status?: string;
};

type RoundIndicatorProps = {
  stage: string;
  currentRound: string;
  isProbeQuestion: boolean;
  roundProgress: Record<string, RoundProgressEntry> | null;
};

export const RoundIndicator = ({
  stage,
  currentRound,
  isProbeQuestion,
  roundProgress,
}: RoundIndicatorProps) => {
  if (stage !== "running") return null;

  const roundConfig: Record<string, { label: string; color: string }> = {
    screening: {
      label: "Screening",
      color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    },
    technical: {
      label: "Technical",
      color: "text-[#cbe557] border-[#cbe557]/30 bg-[#cbe557]/10",
    },
    behavioral: {
      label: "Behavioral",
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    },
    complete: {
      label: "Complete",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    },
  };

  const activeConfig = roundConfig[currentRound] || roundConfig.screening;

  return (
    <div className="mb-8 bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-4 animate-in fade-in slide-in-from-top-2 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`px-5 py-2 rounded-xl font-bold text-sm border backdrop-blur-sm flex items-center gap-2 capitalize tracking-wide shadow-[0_0_15px_rgba(0,0,0,0.2)] ${activeConfig.color}`}
          >
            {currentRound === "technical" && <Code size={16} />}
            {currentRound === "screening" && <Target size={16} />}
            {activeConfig.label} Round
          </div>

          {isProbeQuestion && (
            <div className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse">
              <HelpCircle size={14} /> Deep Dive
            </div>
          )}
        </div>

        {roundProgress ? (
          <div className="flex items-center gap-2 text-sm">
            {Object.entries(roundProgress).map(([round, data]) => {
              const isCurrent = round === currentRound;
              const count = data.questions || 0;

              let style = "bg-white/5 text-neutral-500 border-transparent";
              if (isCurrent) {
                style = "bg-white/10 text-white border-white/20 shadow-lg transform scale-105";
              } else if (data.status === "passed" || data.status === "completed") {
                style = "bg-[#cbe557]/10 text-[#cbe557] border-[#cbe557]/20";
              }

              return (
                <div key={round} className={`px-3 py-1.5 rounded-lg border transition-all ${style}`}>
                  <span className="capitalize font-medium">{round}</span>:{" "}
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};

type IdleInterviewStartPanelProps = {
  visible: boolean;
  previewVideoRef: React.RefObject<HTMLVideoElement | null>;
  previewCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  captureCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraError: string | null;
  imageStatus: ImageStatus;
  speechError: string | null;
  onCaptureReferenceImage: () => void;
  loading: boolean;
  startAttemptInProgress: boolean;
  showConfigModal: boolean;
  onOpenConfig: () => void;
  onCloseConfig: () => void;
  onStartConfig: (config: { role_title: string; company_style: string }) => void;
};

export const IdleInterviewStartPanel = ({
  visible,
  previewVideoRef,
  previewCanvasRef,
  captureCanvasRef,
  cameraError,
  imageStatus,
  speechError,
  onCaptureReferenceImage,
  loading,
  startAttemptInProgress,
  showConfigModal,
  onOpenConfig,
  onCloseConfig,
  onStartConfig,
}: IdleInterviewStartPanelProps) => {
  if (!visible) return null;

  const indicator = getImageStatusIndicator(imageStatus);

  return (
    <div className="mb-8 flex flex-col items-center">
      <div className="mb-6 relative group">
        <div className="w-80 h-60 bg-slate-900 rounded-2xl overflow-hidden border-4 border-white shadow-xl ring-4 ring-indigo-100 relative">
          <video
            ref={previewVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />

          <canvas ref={previewCanvasRef} style={{ display: "none" }} />
          <canvas ref={captureCanvasRef} style={{ display: "none" }} />

          {cameraError ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-rose-100 text-sm p-6 text-center bg-black/80 cursor-pointer hover:bg-black/90 transition-colors z-20"
              onClick={onCaptureReferenceImage}
            >
              <AlertCircle size={32} className="mb-2 text-rose-400" />
              <div className="font-bold mb-1">Check Failed</div>
              <div className="text-xs opacity-90">{cameraError}</div>
              <div className="mt-3 px-3 py-1 bg-white/10 rounded-full text-xs font-bold border border-white/20">
                Tap to Retry
              </div>
            </div>
          ) : null}

          {!cameraError && imageStatus !== "capturing" ? (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 cursor-pointer z-10"
              onClick={onCaptureReferenceImage}
            >
              <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20 flex items-center gap-2 transform hover:scale-105 transition-transform">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                Click to Recapture
              </div>
            </div>
          ) : null}

          {imageStatus === "capturing" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
              <Loader2 size={32} className="text-white animate-spin mb-2" />
              <span className="text-white text-xs font-bold">Verifying...</span>
            </div>
          ) : null}
        </div>

        {speechError ? (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm animate-in fade-in">
            <AlertCircle size={20} className="shrink-0" />
            <div>
              <div className="font-bold">Speech Recognition Issue</div>
              <div className="text-sm">{speechError}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full shadow-lg text-xs font-bold whitespace-nowrap border cursor-pointer hover:scale-105 transition-transform z-10 ${indicator.className}`}
        onClick={onCaptureReferenceImage}
      >
        {indicator.text}
      </div>

      <button
        onClick={onOpenConfig}
        disabled={loading || imageStatus !== "captured" || startAttemptInProgress}
        className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-indigo-300 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-8"
      >
        {loading || startAttemptInProgress ? (
          <>
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Starting...</span>
          </>
        ) : (
          <>
            <span>Begin Technical Interview</span>
            <div className="bg-white/20 p-2 rounded-full group-hover:translate-x-1 transition-transform">
              <Play size={20} fill="currentColor" />
            </div>
          </>
        )}
      </button>

      {showConfigModal ? (
        <InterviewConfigModal
          onCancel={onCloseConfig}
          onStart={(config) => {
            onCloseConfig();
            onStartConfig(config);
          }}
        />
      ) : null}
    </div>
  );
};
