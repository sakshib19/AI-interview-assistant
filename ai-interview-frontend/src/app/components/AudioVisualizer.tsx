"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isListening: boolean;
}

export const AudioVisualizer = ({ isListening }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
const animationRef = useRef<number | null>(null);  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup function to prevent memory leaks and stop the mic
    const cleanup = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };

    if (!isListening) {
      cleanup();
      return;
    }

    const initAudio = async () => {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Cross-browser AudioContext initialization
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 64; // Limits bar count to 32 bars
        
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

          // Clear previous frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          const barWidth = (canvas.width / bufferLength) * 2; 
          let x = 0;

          // Draw the frequency bars
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            
            // Recreate gradient per frame to maintain vibrant colors based on height
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#6366f1'); // Indigo-500
            gradient.addColorStop(1, '#a855f7'); // Purple-500
            
            ctx.fillStyle = gradient;
            
            ctx.beginPath();
            // Fallback for browsers that don't support roundRect
            if (ctx.roundRect) {
               ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 4);
            } else {
               ctx.rect(x, canvas.height - barHeight, barWidth, barHeight);
            }
            ctx.fill();
            
            x += barWidth + 3; // Add spacing between bars
          }
        };

        draw();

      } catch (err) {
        // Handle case where user denies mic permission
        console.warn("Microphone access denied or audio initialization failed:", err);
      }
    };

    initAudio();

    // Clean up on component unmount or when `isListening` toggles to false
    return cleanup;
  }, [isListening]);

  if (!isListening) return null;

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={30} 
      className="w-32 h-8"
      aria-label="Audio level visualizer"
      role="img"
    />
  );
};