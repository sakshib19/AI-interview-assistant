import { useState, useCallback, useRef, useEffect } from 'react';

export const useWebSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const onTranscriptCallback = useRef<((text: string) => void) | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition with enhanced settings
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    
    // ENHANCED SETTINGS for better accuracy
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3; // Get top 3 alternatives for better accuracy

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        // Use the most confident result
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        // Log confidence for debugging
        if (result.isFinal) {
          console.log(`Speech confidence: ${(confidence * 100).toFixed(1)}%`);
        }

        if (result.isFinal) {
          // Clean up the text
          const cleaned = transcript
            .trim()
            .replace(/\s+/g, ' ') // Remove extra spaces
            .replace(/^\w/, (c: string) => c.toUpperCase()); // Capitalize first letter
          
          finalText += cleaned + ' ';
        } else {
          interimText += transcript;
        }
      }

      if (finalText) {
        setTranscript(prev => {
          const newTranscript = prev + finalText;
          if (onTranscriptCallback.current) {
            onTranscriptCallback.current(finalText.trim());
          }
          return newTranscript;
        });
      }

      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle different error types
      if (event.error === 'no-speech') {
        // Auto-restart if no speech detected
        console.log('No speech detected, continuing...');
        // Don't set error, just continue
      } else if (event.error === 'audio-capture') {
        setError('Microphone not accessible. Please check permissions.');
        setIsListening(false);
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please enable permissions.');
        setIsListening(false);
      } else if (event.error === 'network') {
        setError('Network error. Please check your connection.');
        setIsListening(false);
      } else {
        // For other errors, just log and continue
        console.warn(`Recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (isListening) {
        console.log('Recognition ended, restarting...');
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch (err) {
            console.warn('Failed to restart recognition:', err);
          }
        }, 100);
      } else {
        setIsListening(false);
        setInterimTranscript('');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const startListening = useCallback((callback?: (text: string) => void) => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      onTranscriptCallback.current = callback || null;
      
      recognitionRef.current.start();
      setIsListening(true);
      console.log('✅ Speech recognition started');
    } catch (err: any) {
      if (err.message?.includes('already started')) {
        // Already running, just update callback
        onTranscriptCallback.current = callback || null;
        setIsListening(true);
      } else {
        setError('Failed to start recognition');
        console.error(err);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        setInterimTranscript('');
        onTranscriptCallback.current = null;
        console.log('🛑 Speech recognition stopped');
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
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
    isSupported: !!recognitionRef.current,
  };
};