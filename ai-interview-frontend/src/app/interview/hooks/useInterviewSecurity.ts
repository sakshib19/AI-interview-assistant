"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseInterviewSecurityParams = {
  stage: string;
  token?: string | null;
  sessionId?: string | null;
  apiBase: string;
  resumeParsed: unknown;
  reportViolation: (
    reason: string,
    action: "warning" | "terminate",
    sessionId?: string | null
  ) => Promise<any>;
  endInterview?: (reason: string, isViolation?: boolean) => Promise<any> | void;
};

const VIOLATION_THRESHOLD = 1000;

export const useInterviewSecurity = ({
  stage,
  token,
  sessionId,
  apiBase,
  resumeParsed,
  reportViolation,
  endInterview,
}: UseInterviewSecurityParams) => {
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const proctorVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inFlightRef = useRef(false);
  const startAttemptRef = useRef(false);
  const pendingArgsRef = useRef<any>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const violationRef = useRef(0);
  const endingRef = useRef(false);
  const autoCaptureDoneRef = useRef(false);
  const cameraInitAttempted = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<"pending" | "capturing" | "captured" | "error">(
    "pending"
  );
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [violationCount, setViolationCount] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [terminatedByViolation, setTerminatedByViolation] = useState(false);
  const [violationReason, setViolationReason] = useState<string | null>(null);

  const [fullscreenPromptVisible, setFullscreenPromptVisible] = useState(false);
  const [reenterPromptVisible, setReenterPromptVisible] = useState(false);
  const [needsFullscreen, setNeedsFullscreen] = useState(true);
  const [countdown, setCountdown] = useState<number>(30);

  const stopCamera = useCallback(() => {
    try {
      [previewVideoRef.current, proctorVideoRef.current].forEach((videoEl) => {
        if (videoEl && videoEl.srcObject) {
          const stream = videoEl.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          videoEl.srcObject = null;
        }
      });
      setCameraActive(false);
      console.log("Camera streams stopped.");
    } catch (e) {
      console.warn("stopCamera error:", e);
    }
  }, []);

  const isFullscreen = useCallback((): boolean => {
    return (
      !!document.fullscreenElement ||
      !!(document as any).webkitFullscreenElement ||
      !!(document as any).mozFullScreenElement ||
      !!(document as any).msFullscreenElement
    );
  }, []);

  const tryRequestFullscreen = useCallback(async (): Promise<boolean> => {
    const element = document.documentElement;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      return isFullscreen();
    } catch (e) {
      console.error("Fullscreen request failed:", e);
      return false;
    }
  }, [isFullscreen]);

  const reportViolationWrapper = useCallback(
    async (reason: string, isTerminal = false) => {
      if (endingRef.current) return;

      violationRef.current += 1;
      setViolationCount(violationRef.current);
      setViolationReason(reason);

      const intendedAction: "warning" | "terminate" =
        isTerminal || violationRef.current >= VIOLATION_THRESHOLD ? "terminate" : "warning";

      let serverResp: any = null;
      try {
        serverResp = await reportViolation(reason, intendedAction, sessionId);
      } catch (err) {
        console.error("Error reporting violation to server:", err);
      }

      const serverCount =
        serverResp && typeof serverResp.violationCount === "number" ? serverResp.violationCount : null;

      if (serverCount !== null) {
        violationRef.current = serverCount;
        setViolationCount(serverCount);
      }

      const serverTerminated = !!(serverResp && serverResp.terminated);
      const shouldTerminateLocally =
        serverTerminated ||
        (serverCount !== null ? serverCount >= VIOLATION_THRESHOLD : intendedAction === "terminate");

      if (shouldTerminateLocally) {
        if (endingRef.current) return;
        endingRef.current = true;

        if (countdownTimerRef.current) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }

        setTerminatedByViolation(true);
        setReenterPromptVisible(false);
        stopCamera();

        try {
          const endReason =
            serverResp?.message ||
            serverResp?.endedReason ||
            `Interview terminated due to multiple integrity violations: ${reason}`;
          await endInterview?.(endReason, true);
        } catch (e) {
          console.error("Error ending interview after termination:", e);
        }
        return;
      }

      setShowViolationWarning(true);
      setReenterPromptVisible(true);
      setCountdown(30);

      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      const localCountSnapshot = violationRef.current;
      countdownTimerRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) {
              window.clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            void reportViolationWrapper(
              `Fullscreen not re-entered within 30 seconds (Violation Count: ${localCountSnapshot + 1})`,
              true
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [endInterview, reportViolation, sessionId, stopCamera]
  );

  const captureReferenceImage = useCallback(async () => {
    setImageStatus("capturing");
    setCameraError(null);

    const MAX_RETRIES = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const videoEl = previewVideoRef.current;
        const canvas = previewCanvasRef.current;

        if (!videoEl || !canvas) {
          throw new Error("Video/canvas not available");
        }

        if (!videoEl.srcObject || attempt > 1) {
          const existingStream = videoEl.srcObject as MediaStream;
          if (existingStream) {
            existingStream.getTracks().forEach((t) => t.stop());
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: false,
          });

          videoEl.srcObject = stream;
          videoEl.muted = true;
          videoEl.playsInline = true;
        }

        const maxWaitMs = 5000;
        const pollInterval = 100;
        let waited = 0;
        while ((videoEl.readyState || 0) < 2 && waited < maxWaitMs) {
          await new Promise((r) => setTimeout(r, pollInterval));
          waited += pollInterval;
        }

        try {
          await videoEl.play();
        } catch (playErr) {
          console.warn("Autoplay blocked:", playErr);
        }

        await new Promise((r) => setTimeout(r, 1200));

        if (!videoEl.videoWidth || !videoEl.videoHeight) {
          throw new Error(`No video frames (attempt ${attempt}/${MAX_RETRIES})`);
        }

        const ctx = canvas.getContext("2d");
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        if (!ctx) throw new Error("Canvas context unavailable");
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);
        if (!imageDataUrl || imageDataUrl.length < 10000) {
          throw new Error(`Image too small: ${imageDataUrl?.length} bytes`);
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let sum = 0;
        const sampleLimit = Math.min(data.length, 50000);
        for (let i = 0; i < sampleLimit; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          sum += 0.299 * r + 0.587 * g + 0.114 * b;
        }
        const averageBrightness = sum / (sampleLimit / 4);
        if (averageBrightness < 40) {
          throw new Error(
            `Environment too dark (${averageBrightness.toFixed(0)}/255). Please face a light source.`
          );
        }
        if (averageBrightness > 230) {
          throw new Error(
            `Environment too bright (${averageBrightness.toFixed(0)}/255). Avoid strong backlighting.`
          );
        }

        let mean = 0;
        const luminances: number[] = [];
        for (let i = 0; i < sampleLimit; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          luminances.push(lum);
          mean += lum;
        }
        mean = mean / luminances.length;
        let variance = 0;
        for (const lum of luminances) variance += (lum - mean) ** 2;
        variance = variance / luminances.length;
        if (variance < 200) {
          throw new Error("Image too blurry or low contrast. Please clean camera lens or improve lighting.");
        }

        try {
          const FaceDetector = (window as any).FaceDetector;
          if (typeof FaceDetector === "function") {
            const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
            const faces = await detector.detect(canvas as any);
            if (!faces || faces.length === 0) {
              throw new Error("No face detected. Please center your face in the frame.");
            }
            if (faces.length > 1) {
              throw new Error(`Multiple faces detected (${faces.length}). Only the candidate must be visible.`);
            }
            const face = faces[0];
            const faceWidth = face.boundingBox.width;
            const minWidth = canvas.width * 0.15;
            if (faceWidth < minWidth) {
              throw new Error("You are too far away. Please move closer to the camera.");
            }
          } else {
            const cx = Math.floor(canvas.width / 2);
            const cy = Math.floor(canvas.height / 2);
            const boxW = Math.floor(canvas.width * 0.3);
            const boxH = Math.floor(canvas.height * 0.4);

            let skinLike = 0;
            let samples = 0;
            const sx = Math.max(0, cx - Math.floor(boxW / 2));
            const sy = Math.max(0, cy - Math.floor(boxH / 2));

            for (let y = sy; y < sy + boxH; y += 8) {
              for (let x = sx; x < sx + boxW; x += 8) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                if (r > 95 && g > 40 && b > 20 && r > g && r > b) {
                  skinLike++;
                }
                samples++;
              }
            }

            const faceDetected = samples > 0 && skinLike / samples > 0.15;
            if (!faceDetected) {
              throw new Error("Face unclear. Please center yourself and look at the camera.");
            }
          }
        } catch (detErr: any) {
          console.warn("Face detection check failed:", detErr.message);
          if (
            detErr.message.includes("Multiple") ||
            detErr.message.includes("No face") ||
            detErr.message.includes("far away")
          ) {
            throw detErr;
          }
        }

        setCameraActive(true);
        setReferenceImage(imageDataUrl);
        setImageStatus("captured");
        return imageDataUrl;
      } catch (err: any) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 700));
        }
      }
    }

    setCameraActive(false);
    setReferenceImage(null);
    const errorMessage = lastError?.message || "Camera capture failed. Check lighting and permissions.";
    setCameraError(errorMessage);
    setImageStatus("error");
    throw lastError;
  }, []);

  const captureFrameToDataUrl = useCallback(async (): Promise<string | null> => {
    const video = proctorVideoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    const maxWait = 1500;
    const step = 100;
    let waited = 0;
    while ((video.readyState || 0) < 2 && waited < maxWait) {
      await new Promise((r) => setTimeout(r, step));
      waited += step;
    }

    if (!video.videoWidth || !video.videoHeight) return null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    try {
      ctx.save();
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      if (!dataUrl || typeof dataUrl !== "string") return null;
      return dataUrl;
    } catch (err) {
      console.warn("captureFrameToDataUrl error:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let proctorInterval: number | null = null;

    if (stage !== "running" || !cameraActive || !token) {
      return () => {
        if (proctorInterval) {
          window.clearInterval(proctorInterval);
          proctorInterval = null;
        }
      };
    }

    const isValidFrame = (dataUrl: string | null): boolean => {
      if (!dataUrl || typeof dataUrl !== "string") return false;
      if (dataUrl.length < 500) return false;
      if (!dataUrl.startsWith("data:image/")) return false;
      const re = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/]+=*$/i;
      return re.test(dataUrl);
    };

    const sendProctorPayload = async (payload: { sessionId: string; image: string | null }) => {
      try {
        if (!payload.image || !isValidFrame(payload.image)) {
          return { ok: false, skipReason: "invalid_frame" };
        }

        const res = await fetch(`${apiBase || ""}/interview/proctor`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: payload.sessionId,
            image: payload.image,
          }),
        });

        if (res.status >= 500) {
          return { ok: false, skipReason: "server_down" };
        }

        const j = await res.json().catch(() => null);
        const isViolation = res.ok && (j?.verified === false || j?.status === "failed");

        if (isViolation) {
          const violationReason = j?.error || j?.reason || j?.detail || "Face verification failed";
          void reportViolationWrapper(violationReason, false);
        } else if (res.ok && (j?.status === "success" || j?.verified === true)) {
          if (showViolationWarning) setShowViolationWarning(false);
        }

        return { ok: res.ok, statusCode: res.status, body: j };
      } catch (err) {
        return { ok: false, error: err };
      }
    };

    const warmupAndStart = async () => {
      if (!sessionId) return;
      if (stage !== "running") return;

      try {
        if (proctorVideoRef.current && !proctorVideoRef.current.srcObject) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { width: 1280, height: 720, facingMode: "user" },
              audio: false,
            });
            proctorVideoRef.current.srcObject = stream;
            proctorVideoRef.current.muted = true;
            proctorVideoRef.current.playsInline = true;

            await new Promise<void>((resolve) => {
              const checkReady = () => {
                if (proctorVideoRef.current && proctorVideoRef.current.readyState >= 2) {
                  resolve();
                } else {
                  setTimeout(checkReady, 100);
                }
              };
              checkReady();
            });
            await proctorVideoRef.current.play().catch(() => {});
          } catch (gErr) {
            console.error("Failed to initialize proctor video:", gErr);
            return;
          }
        }

        const video = proctorVideoRef.current;
        if (!video || video.readyState < 2 || !video.videoWidth) return;

        const firstFrame = await captureFrameToDataUrl();
        if (firstFrame && isValidFrame(firstFrame)) {
          inFlightRef.current = true;
          try {
            await sendProctorPayload({ sessionId, image: firstFrame });
          } finally {
            inFlightRef.current = false;
          }
        }
      } catch (e) {
        console.warn("proctor warmup error:", e);
      }

      proctorInterval = window.setInterval(async () => {
        if (stage !== "running") {
          if (proctorInterval) {
            window.clearInterval(proctorInterval);
            proctorInterval = null;
          }
          return;
        }

        if (!sessionId) return;
        if (inFlightRef.current) return;

        inFlightRef.current = true;
        try {
          const frame = await captureFrameToDataUrl();
          if (frame && isValidFrame(frame)) {
            await sendProctorPayload({ sessionId, image: frame });
          }
        } catch (err) {
          console.warn("proctor interval error:", err);
        } finally {
          inFlightRef.current = false;
        }
      }, 6000);
    };

    void warmupAndStart();

    return () => {
      if (proctorInterval) {
        window.clearInterval(proctorInterval);
        proctorInterval = null;
      }
    };
  }, [stage, cameraActive, sessionId, token, apiBase, captureFrameToDataUrl, reportViolationWrapper, showViolationWarning]);

  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (stage === "running" && !endingRef.current) {
        event.preventDefault();
        event.returnValue = "";
        void reportViolationWrapper("Attempted page refresh or closing tab.", true);
      }
    },
    [reportViolationWrapper, stage]
  );

  const handleVisibilityChange = useCallback(() => {
    if (stage === "running" && document.visibilityState === "hidden") {
      void reportViolationWrapper("Switched to another tab or minimized window.");
    }
    if (
      stage === "running" &&
      document.visibilityState === "visible" &&
      reenterPromptVisible &&
      needsFullscreen &&
      !isFullscreen()
    ) {
      void tryRequestFullscreen();
    }
  }, [stage, reportViolationWrapper, reenterPromptVisible, needsFullscreen, isFullscreen, tryRequestFullscreen]);

  const handleFullscreenChange = useCallback(() => {
    if (stage !== "running" || !needsFullscreen) return;

    if (!isFullscreen() && !reenterPromptVisible && !endingRef.current) {
      void reportViolationWrapper("Exited fullscreen mode.");
    } else if (isFullscreen() && reenterPromptVisible) {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setReenterPromptVisible(false);
      setShowViolationWarning(false);
      setCountdown(30);
    }
  }, [stage, needsFullscreen, isFullscreen, reenterPromptVisible, reportViolationWrapper]);

  useEffect(() => {
    if (stage === "running" && needsFullscreen) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("msfullscreenchange", handleFullscreenChange);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, [stage, needsFullscreen, handleBeforeUnload, handleVisibilityChange, handleFullscreenChange]);

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;

    const tryInitCamera = async () => {
      if (stage !== "running" || cameraActive) return;
      if (!proctorVideoRef.current) {
        retryTimeout = setTimeout(tryInitCamera, 500);
        return;
      }
      if (cameraInitAttempted.current) return;
      cameraInitAttempted.current = true;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: false,
        });

        if (proctorVideoRef.current) {
          proctorVideoRef.current.srcObject = stream;
          proctorVideoRef.current.muted = true;
          proctorVideoRef.current.playsInline = true;

          let waited = 0;
          while (proctorVideoRef.current.readyState < 2 && waited < 5000) {
            await new Promise((r) => setTimeout(r, 100));
            waited += 100;
          }

          await proctorVideoRef.current.play().catch(() => {});
          setCameraActive(true);
          setImageStatus("captured");
        }
      } catch (err: any) {
        setCameraError("Camera restart failed. Please refresh the page.");
        setImageStatus("error");
        cameraInitAttempted.current = false;
      }
    };

    if (stage === "running") {
      void tryInitCamera();
    }

    return () => clearTimeout(retryTimeout);
  }, [stage, cameraActive]);

  useEffect(() => {
    if (autoCaptureDoneRef.current) return;
    if (
      stage === "idle" &&
      resumeParsed &&
      token &&
      imageStatus === "pending" &&
      previewVideoRef.current &&
      previewCanvasRef.current
    ) {
      const timer = setTimeout(() => {
        autoCaptureDoneRef.current = true;
        captureReferenceImage().catch(() => {
          autoCaptureDoneRef.current = false;
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [stage, resumeParsed, token, imageStatus, captureReferenceImage]);

  useEffect(() => {
    return () => {
      cameraInitAttempted.current = false;
      stopCamera();
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [stopCamera]);

  return {
    previewVideoRef,
    proctorVideoRef,
    previewCanvasRef,
    captureCanvasRef,
    startAttemptRef,
    pendingArgsRef,
    countdownTimerRef,
    endingRef,

    cameraActive,
    setCameraActive,
    referenceImage,
    imageStatus,
    setImageStatus,
    cameraError,
    setCameraError,

    violationCount,
    showViolationWarning,
    setShowViolationWarning,
    terminatedByViolation,
    setTerminatedByViolation,
    violationReason,
    setViolationReason,

    fullscreenPromptVisible,
    setFullscreenPromptVisible,
    reenterPromptVisible,
    setReenterPromptVisible,
    needsFullscreen,
    setNeedsFullscreen,
    countdown,
    setCountdown,

    stopCamera,
    captureReferenceImage,
    isFullscreen,
    tryRequestFullscreen,
  };
};

