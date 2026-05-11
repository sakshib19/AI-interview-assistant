import { useCallback, useEffect, useRef, useState } from "react";

/* eslint-disable react-hooks/set-state-in-effect */

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export const useWebSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptCallback = useRef<((text: string) => void) | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldListenRef = useRef(false);
  const isRunningRef = useRef(false);
  const restartAttemptsRef = useRef(0);
  const lastStartAtRef = useRef(0);

  const clearRestartTimer = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as SpeechRecognitionWindow).SpeechRecognition ||
      (window as SpeechRecognitionWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition() as SpeechRecognitionLike;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interimText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          const cleaned = text
            .trim()
            .replace(/\s+/g, " ")
            .replace(/^\w/, (c: string) => c.toUpperCase());

          finalText += `${cleaned} `;
        } else {
          interimText += text;
        }
      }

      if (finalText) {
        restartAttemptsRef.current = 0;
        setTranscript((prev) => {
          const next = prev + finalText;
          onTranscriptCallback.current?.(finalText.trim());
          return next;
        });
      }

      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === "no-speech") {
        setError(null);
        return;
      }

      if (["audio-capture", "not-allowed", "service-not-allowed", "network"].includes(event.error)) {
        shouldListenRef.current = false;
        setIsListening(false);
      }

      if (event.error === "audio-capture") {
        setError("Microphone is not accessible. Check your input device.");
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access was blocked. Allow microphone permission and try again.");
      } else if (event.error === "network") {
        setError("Speech recognition network error. Check your connection.");
      } else {
        setError(null);
      }
    };

    recognition.onstart = () => {
      isRunningRef.current = true;
      lastStartAtRef.current = Date.now();
      setIsListening(true);
    };

    recognition.onend = () => {
      isRunningRef.current = false;

      if (!shouldListenRef.current) {
        setIsListening(false);
        setInterimTranscript("");
        return;
      }

      const ranForMs = Date.now() - lastStartAtRef.current;
      restartAttemptsRef.current = ranForMs < 700 ? restartAttemptsRef.current + 1 : 0;

      if (restartAttemptsRef.current >= 4) {
        shouldListenRef.current = false;
        setIsListening(false);
        setInterimTranscript("");
        setError("Speech recognition stopped repeatedly. Check microphone permissions and try again.");
        return;
      }

      const delay = Math.min(400 + restartAttemptsRef.current * 350, 1500);
      console.log(`Recognition ended, restarting in ${delay}ms...`);
      clearRestartTimer();
      restartTimeoutRef.current = setTimeout(() => {
        if (!shouldListenRef.current || isRunningRef.current) return;

        try {
          recognition.start();
        } catch (err) {
          console.warn("Failed to restart recognition:", err);
        }
      }, delay);
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      shouldListenRef.current = false;
      clearRestartTimer();
      try {
        recognition.stop();
      } catch {
        // It may already be stopped.
      }
      recognitionRef.current = null;
    };
  }, [clearRestartTimer]);

  const startListening = useCallback((callback?: (text: string) => void) => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setError("Speech recognition is not initialized.");
      return;
    }

    onTranscriptCallback.current = callback || null;
    shouldListenRef.current = true;

    if (isRunningRef.current) {
      setIsListening(true);
      return;
    }

    try {
      clearRestartTimer();
      setError(null);
      setTranscript("");
      setInterimTranscript("");
      restartAttemptsRef.current = 0;
      recognition.start();
      console.log("Speech recognition started");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes("already")) {
        isRunningRef.current = true;
        setIsListening(true);
        return;
      }

      shouldListenRef.current = false;
      setIsListening(false);
      setError("Failed to start speech recognition.");
      console.error(err);
    }
  }, [clearRestartTimer]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    clearRestartTimer();

    const recognition = recognitionRef.current;
    if (recognition && (isRunningRef.current || isListening)) {
      try {
        recognition.stop();
      } catch (err) {
        console.warn("Error stopping recognition:", err);
      }
    }

    isRunningRef.current = false;
    setIsListening(false);
    setInterimTranscript("");
    onTranscriptCallback.current = null;
    console.log("Speech recognition stopped");
  }, [clearRestartTimer, isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    transcriptBuffer: interimTranscript || transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
};
