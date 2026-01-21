import { useState, useRef, useCallback } from "react";
import { createClient } from "@deepgram/sdk";

export const useDeepgram = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcriptBuffer, setTranscriptBuffer] = useState("");
  const connectionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startListening = useCallback(async (onFinal: (text: string) => void) => {
    try {
      // 1. Get Secure Temp Key
      const resp = await fetch("http://localhost:5000/api/deepgram-token"); // Ensure port matches your server
      if (!resp.ok) throw new Error("Failed to get Deepgram token");
      const { key } = await resp.json();

      // 2. Connect to Deepgram Nova-2
      const deepgram = createClient(key);
      const connection = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true, // Auto-punctuation
        interim_results: true,
      });

      // 3. Handle Incoming Transcripts
      connection.on("Results", (data: any) => {
        const sentence = data.channel.alternatives[0].transcript;
        if (sentence) {
          if (data.is_final) {
            onFinal(sentence);
            setTranscriptBuffer(""); // Clear buffer on final
          } else {
            setTranscriptBuffer(sentence); // Show interim preview
          }
        }
      });

      connection.on("Close", () => setIsListening(false));

      // 4. Send Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.addEventListener("dataavailable", (e) => {
        if (e.data.size > 0 && connection.getReadyState() === 1) {
          connection.send(e.data);
        }
      });
      recorder.start(200); // Send chunks every 200ms

      connectionRef.current = connection;
      mediaRecorderRef.current = recorder;
      setIsListening(true);

    } catch (err) {
      console.error("Deepgram Error:", err);
      setIsListening(false);
      alert("Could not start audio. Check backend connection.");
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      // Turn off microphone hardware light
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop()); 
    }
    if (connectionRef.current) {
      connectionRef.current.finish();
    }
    setIsListening(false);
    setTranscriptBuffer("");
  }, []);

  return { isListening, startListening, stopListening, transcriptBuffer };
};