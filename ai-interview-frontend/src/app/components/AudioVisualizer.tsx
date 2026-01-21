// components/AudioVisualizer.tsx
"use client";

import { useEffect, useRef } from "react";

export const AudioVisualizer = ({ isListening }: { isListening: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // 1. Cleanup function to stop everything when component unmounts or listening stops
    const cleanup = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (analyserRef.current) analyserRef.current.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };

    if (!isListening) {
      cleanup();
      return;
    }

    // 2. Initialize Audio Context & Visualizer
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 64; // Controls bar count (32 bars)
        
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        const draw = () => {
          if (!ctx || !canvas || !analyserRef.current) return;
          
          animationRef.current = requestAnimationFrame(draw);
          analyserRef.current.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Style settings
          const barWidth = (canvas.width / bufferLength) * 2; 
          let x = 0;

          // Draw Bars
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            
            // Dynamic Gradient Color
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#6366f1'); // Indigo-500
            gradient.addColorStop(1, '#a855f7'); // Purple-500
            
            ctx.fillStyle = gradient;
            
            // Rounded bar top
            ctx.beginPath();
            ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 4);
            ctx.fill();
            
            x += barWidth + 3; // Spacing
          }
        };
        draw();
      } catch (err) {
        console.error("Audio viz error:", err);
      }
    };

    initAudio();

    return cleanup;
  }, [isListening]);

  if (!isListening) return null;

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={30} 
      className="w-32 h-8" 
    />
  );
};