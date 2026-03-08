"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseInterviewSpeechControlsParams = {
  stage: string;
  currentQuestionText?: string;
  currentQuestionId?: string | number;
  lastFeedback?: string;
  isListening: boolean;
  stopListening: () => void;
  startListening: (callback?: (text: string) => void) => void;
  transcriptBuffer: string;
  setAnswer: React.Dispatch<React.SetStateAction<string>>;
};

export const useInterviewSpeechControls = ({
  stage,
  currentQuestionText,
  currentQuestionId,
  lastFeedback,
  isListening,
  stopListening,
  startListening,
  transcriptBuffer,
  setAnswer,
}: UseInterviewSpeechControlsParams) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [autoReadQuestions, setAutoReadQuestions] = useState(true);

  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const speakTextRef = useRef<(text: string, priority?: boolean) => void>(() => {});

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        const preferredVoice =
          voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
          voices.find((v) => v.lang.startsWith("en"));
        if (preferredVoice) setSelectedVoice(preferredVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speakText = useCallback(
    (text: string, priority = false) => {
      if (!text || typeof window === "undefined" || !window.speechSynthesis) return;

      if (priority) {
        window.speechSynthesis.cancel();
        speechQueueRef.current = [];
      }

      if (!priority && window.speechSynthesis.speaking) {
        speechQueueRef.current.push(text);
        return;
      }

      const cleanText = text
        .replace(/```[\s\S]*?```/g, "code block")
        .replace(/[*#`]/g, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = speechRate;
      utterance.pitch = 1;
      utterance.volume = 1;
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        if (speechQueueRef.current.length > 0) {
          const next = speechQueueRef.current.shift();
          if (next) setTimeout(() => speakTextRef.current(next, false), 250);
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") {
          console.warn("Speech error:", e);
        }
        setIsSpeaking(false);
      };

      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [selectedVoice, speechRate]
  );

  useEffect(() => {
    speakTextRef.current = speakText;
  }, [speakText]);

  const pauseSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    speechQueueRef.current = [];
  }, []);

  const toggleSpeak = useCallback(() => {
    if (isSpeaking) {
      if (isPaused) resumeSpeaking();
      else pauseSpeaking();
    } else if (currentQuestionText) {
      speakText(currentQuestionText, true);
    }
  }, [currentQuestionText, isPaused, isSpeaking, pauseSpeaking, resumeSpeaking, speakText]);

  useEffect(() => {
    if (currentQuestionText && stage === "running" && autoReadQuestions) {
      const timer = setTimeout(() => speakText(currentQuestionText, true), 800);
      return () => clearTimeout(timer);
    }
  }, [autoReadQuestions, currentQuestionId, currentQuestionText, speakText, stage]);

  useEffect(() => {
    if (stage === "done" || stage === "idle") {
      const timer = window.setTimeout(() => stopSpeaking(), 0);
      return () => window.clearTimeout(timer);
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stage, stopSpeaking]);

  useEffect(() => {
    if (lastFeedback && stage === "running" && autoReadQuestions) {
      const timer = setTimeout(() => speakText(lastFeedback, false), 1500);
      return () => clearTimeout(timer);
    }
  }, [autoReadQuestions, lastFeedback, speakText, stage]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      if (transcriptBuffer && transcriptBuffer.trim().length > 0) {
        const wordCount = transcriptBuffer.trim().split(/\s+/).length;
        speakText(`Captured ${wordCount} word${wordCount !== 1 ? "s" : ""}`, false);
      }
      return;
    }

    if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }
    stopSpeaking();

    startListening((newSentence) => {
      setAnswer((prev) => {
        const cleaned = prev.trim();
        const separator =
          cleaned.length > 0
            ? cleaned.endsWith(".") || cleaned.endsWith("!") || cleaned.endsWith("?")
              ? " "
              : ". "
            : "";
        return cleaned + separator + newSentence;
      });
    });
  }, [
    isListening,
    setAnswer,
    speakText,
    startListening,
    stopListening,
    stopSpeaking,
    transcriptBuffer,
  ]);

  useEffect(() => {
    if (stage !== "running") return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        handleMicToggle();
      }
      if (e.code === "Escape" && isListening) {
        stopListening();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleMicToggle, isListening, stage, stopListening]);

  return {
    isSpeaking,
    isPaused,
    speechRate,
    setSpeechRate,
    selectedVoice,
    setSelectedVoice,
    availableVoices,
    showVoiceSettings,
    setShowVoiceSettings,
    autoReadQuestions,
    setAutoReadQuestions,
    speakText,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,
    toggleSpeak,
    handleMicToggle,
  };
};
