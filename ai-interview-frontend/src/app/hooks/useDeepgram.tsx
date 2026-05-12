"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { createClient } from "@deepgram/sdk"
import { useToast } from "./use-toast" // Ensure this path matches your project structure

interface DeepgramHookParams {
  tokenEndpoint?: string;
}

export const useDeepgram = ({ tokenEndpoint = "/api/deepgram-token" }: DeepgramHookParams = {}) => {
  const [isListening, setIsListening] = useState(false)
  const [transcriptBuffer, setTranscriptBuffer] = useState("")
  const connectionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const { toast } = useToast()

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      // Immediately turn off microphone hardware light
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      mediaRecorderRef.current = null
    }
    
    if (connectionRef.current) {
      connectionRef.current.finish()
      connectionRef.current = null
    }
    
    setIsListening(false)
    setTranscriptBuffer("")
  }, [])

  const startListening = useCallback(async (onFinal: (text: string) => void) => {
    try {
      // 1. Get Secure Temp Key (Using relative path for Production)
      const resp = await fetch(tokenEndpoint)
      if (!resp.ok) throw new Error("Failed to authenticate with transcription service.")
      const { key } = await resp.json()

      // 2. Connect to Deepgram Nova-2
      const deepgram = createClient(key)
      const connection = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true, 
        interim_results: true,
      })

      // 3. Handle Incoming Transcripts
      connection.on("Results", (data: any) => {
        const sentence = data.channel.alternatives[0].transcript
        if (sentence) {
          if (data.is_final) {
            onFinal(sentence)
            setTranscriptBuffer("") // Clear buffer on final
          } else {
            setTranscriptBuffer(sentence) // Show interim preview
          }
        }
      })

      connection.on("Close", () => {
        setIsListening(false)
      })

      connection.on("Error", (err: any) => {
        console.error("Deepgram Connection Error:", err)
        stopListening()
      })

      // 4. Request Mic Permissions and Send Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      recorder.addEventListener("dataavailable", (e) => {
        if (e.data.size > 0 && connection.getReadyState() === 1) {
          connection.send(e.data)
        }
      })
      
      recorder.start(250) // Send chunks every 250ms for optimal streaming

      connectionRef.current = connection
      mediaRecorderRef.current = recorder
      setIsListening(true)

    } catch (err: any) {
      console.error("Microphone/Deepgram Error:", err)
      setIsListening(false)
      toast({
        title: "Microphone Error",
        description: err.message || "Could not start audio. Please check your permissions.",
        variant: "destructive"
      })
    }
  }, [tokenEndpoint, stopListening, toast])

  // Safety cleanup: Turn off microphone if the component unmounts unexpectedly
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  return { isListening, startListening, stopListening, transcriptBuffer }
}