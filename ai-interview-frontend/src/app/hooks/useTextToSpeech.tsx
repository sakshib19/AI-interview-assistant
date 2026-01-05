import { useState, useEffect, useCallback, useRef } from "react";
export const useTextToSpeech = ()=>{
    const [isSpeaking,setIsSpeaking] = useState(false);
    const synth = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    useEffect(()=>{
        if (typeof window !== "undefined") {
            synth.current = window.speechSynthesis;
        }
        return () =>{
            if (synth.current) synth.current.cancel();
        }
    },[]);
    const speak = useCallback((text: string)=>{
        if (!synth.current) return;
        synth.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current=utterance;
        const voices = synth.current.getVoices();
        const preferredVoice = voices.find(
      (v) =>
        (v.name.includes("Google") && v.lang.includes("en-US")) ||
        (v.name.includes("Samantha") && v.lang.includes("en-US")) ||
        v.lang === "en-US"
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.05; // Slightly faster for conversational feel
    utterance.pitch = 1.0;
 utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.current.speak(utterance);
  }, []);

const stop = useCallback(() => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking };
}
// you don't need to manage audio blobs or buffers. It just
// works with one line of code: window.speechSynthesic