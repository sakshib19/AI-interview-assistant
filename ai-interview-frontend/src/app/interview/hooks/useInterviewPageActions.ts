"use client";

import React, { useCallback, useEffect } from "react";

type UseInterviewPageActionsParams = {
  API: string;
  token?: string | null;
  sessionId?: string | null;
  stage: string;
  currentQuestion: any;
  finalReport: any;
  loadingFinalReport: boolean;
  setFinalReport: React.Dispatch<React.SetStateAction<any>>;
  setLoadingFinalReport: React.Dispatch<React.SetStateAction<boolean>>;

  answer: string;
  setAnswer: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;

  timeComplexity: string;
  setTimeComplexity: React.Dispatch<React.SetStateAction<string>>;
  spaceComplexity: string;
  setSpaceComplexity: React.Dispatch<React.SetStateAction<string>>;

  executionResult: any;
  setExecutionResult: React.Dispatch<React.SetStateAction<any>>;
  setCodeOutput: React.Dispatch<React.SetStateAction<string | null>>;
  setCodeStatus: React.Dispatch<React.SetStateAction<"idle" | "running" | "success" | "error">>;

  roadmap: any;
  loadingRoadmap: boolean;
  setRoadmap: React.Dispatch<React.SetStateAction<any>>;
  setRoadmapTitle: React.Dispatch<React.SetStateAction<string>>;
  setLoadingRoadmap: React.Dispatch<React.SetStateAction<boolean>>;

  setRoundSummary: React.Dispatch<React.SetStateAction<any>>;
  setLoadingRoundFeedback: React.Dispatch<React.SetStateAction<boolean>>;

  currentRound: string;
  setCurrentRound: React.Dispatch<React.SetStateAction<string>>;
  setRoundProgress: React.Dispatch<React.SetStateAction<any>>;
  setIsProbeQuestion: React.Dispatch<React.SetStateAction<boolean>>;
  setShowRoundModal: React.Dispatch<React.SetStateAction<boolean>>;
  setNextRoundName: React.Dispatch<React.SetStateAction<string>>;
  setLastDiagnosis: React.Dispatch<React.SetStateAction<any>>;

  submitAnswer: (payload: any, questionId: string | number) => Promise<any>;
  startInterview?: (
    jobTitle: string,
    difficulty: string,
    techStack: string,
    serverSessionId: string,
    firstQuestion?: any
  ) => Promise<any> | void;
  endInterview?: (reason: string, isViolation?: boolean) => Promise<any> | void;
  fetchHint: (questionText: string, questionType: string, answer: string) => Promise<string>;

  resumeParsed: any;
  captureReferenceImage: () => Promise<string>;
  referenceImage: string | null;
  imageStatus: "pending" | "capturing" | "captured" | "error";
  needsFullscreen: boolean;
  isFullscreen: () => boolean;
  setFullscreenPromptVisible: React.Dispatch<React.SetStateAction<boolean>>;
  pendingArgsRef: React.MutableRefObject<any>;
  startAttemptRef: React.MutableRefObject<boolean>;
  setCameraError: React.Dispatch<React.SetStateAction<string | null>>;
  setImageStatus: React.Dispatch<React.SetStateAction<"pending" | "capturing" | "captured" | "error">>;
  stopCamera: () => void;
  proctorVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
  setCameraActive: React.Dispatch<React.SetStateAction<boolean>>;

  whiteboardElementsRef: React.MutableRefObject<readonly unknown[]>;
  excalidrawAPI: any;
  setWhiteboardElements: React.Dispatch<React.SetStateAction<any[]>>;

  playbackHistory: React.MutableRefObject<any[]>;
  captureSnapshot: (trigger: "auto" | "run" | "paste" | "initial") => void;

  hint: string | null;
  setHint: React.Dispatch<React.SetStateAction<string | null>>;
  setLoadingHint: React.Dispatch<React.SetStateAction<boolean>>;
};

export const useInterviewPageActions = ({
  API,
  token,
  sessionId,
  stage,
  currentQuestion,
  finalReport,
  loadingFinalReport,
  setFinalReport,
  setLoadingFinalReport,
  answer,
  setAnswer,
  loading,
  timeComplexity,
  setTimeComplexity,
  spaceComplexity,
  setSpaceComplexity,
  executionResult,
  setExecutionResult,
  setCodeOutput,
  setCodeStatus,
  roadmap,
  loadingRoadmap,
  setRoadmap,
  setRoadmapTitle,
  setLoadingRoadmap,
  setRoundSummary,
  setLoadingRoundFeedback,
  currentRound,
  setCurrentRound,
  setRoundProgress,
  setIsProbeQuestion,
  setShowRoundModal,
  setNextRoundName,
  setLastDiagnosis,
  submitAnswer,
  startInterview,
  endInterview,
  fetchHint,
  resumeParsed,
  captureReferenceImage,
  referenceImage,
  imageStatus,
  needsFullscreen,
  isFullscreen,
  setFullscreenPromptVisible,
  pendingArgsRef,
  startAttemptRef,
  setCameraError,
  setImageStatus,
  stopCamera,
  proctorVideoRef,
  setCameraActive,
  whiteboardElementsRef,
  excalidrawAPI,
  setWhiteboardElements,
  playbackHistory,
  captureSnapshot,
  hint,
  setHint,
  setLoadingHint,
}: UseInterviewPageActionsParams) => {
  const fetchRoadmap = useCallback(async () => {
    if (!sessionId || !token || roadmap || loadingRoadmap) return;

    setLoadingRoadmap(true);
    try {
      const res = await fetch(`${API}/interview/roadmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
        setRoadmapTitle(data.plan_type || "Personalized Roadmap");
      }
    } catch (err) {
      console.error("Failed to fetch roadmap:", err);
    } finally {
      setLoadingRoadmap(false);
    }
  }, [sessionId, token, roadmap, loadingRoadmap, setLoadingRoadmap, API, setRoadmap, setRoadmapTitle]);

  const buildTestCasesFromChallenge = (challenge: any) => {
    const candidateLists = [
      challenge?.test_cases,
      challenge?.tests,
      challenge?.cases,
      (challenge?.examples || []).map((ex: any) => ({
        input: ex.input,
        expected: ex.output,
      })),
    ].filter(Boolean);

    let rawCases: any[] = [];
    for (const c of candidateLists) {
      if (Array.isArray(c) && c.length > 0) {
        rawCases = c;
        break;
      }
    }

    if (rawCases.length === 0 && (challenge?.test_case_input || challenge?.test_case)) {
      rawCases.push({
        input: challenge?.test_case_input ?? challenge?.test_case,
        expected: challenge?.expected_output ?? challenge?.expected ?? "",
      });
    }

    if (rawCases.length === 0) {
      rawCases.push({ input: "[]", expected: "" });
    }

    return rawCases.map((tc: any) => {
      const inVal = tc.input ?? tc.stdin ?? "";
      const expVal = tc.expected ?? tc.expected_output ?? tc.output ?? "";

      const input = typeof inVal === "object" ? JSON.stringify(inVal) : String(inVal);
      const expected = typeof expVal === "object" ? JSON.stringify(expVal) : String(expVal);

      return { input, expected };
    });
  };

  const fetchRoundFeedback = useCallback(
    async (finishedRound: string) => {
      if (!sessionId || !token) return;
      setLoadingRoundFeedback(true);
      try {
        const res = await fetch(`${API}/interview/feedback/round`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId, round: finishedRound }),
        });
        const data = await res.json();
        if (data.summary) {
          setRoundSummary(data.summary);
        }
      } catch (err) {
        console.error("Failed to fetch round feedback", err);
      } finally {
        setLoadingRoundFeedback(false);
      }
    },
    [sessionId, token, API, setLoadingRoundFeedback, setRoundSummary]
  );

  const fetchFinalReport = useCallback(async () => {
    if (!sessionId || !token) return;

    setLoadingFinalReport(true);

    const fetchWithRetry = async (retries = 3, delay = 1000): Promise<void> => {
      try {
        const res = await fetch(`${API}/interview/feedback/final/${sessionId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Report not ready");
        const data = await res.json();

        if (!data.overall?.verdict && retries > 0) {
          throw new Error("Incomplete data");
        }

        setFinalReport(data);
        setLoadingFinalReport(false);
      } catch (err) {
        if (retries > 0) {
          setTimeout(() => {
            void fetchWithRetry(retries - 1, delay);
          }, delay);
        } else {
          setLoadingFinalReport(false);
        }
      }
    };

    await fetchWithRetry();
  }, [sessionId, token, API, setFinalReport, setLoadingFinalReport]);

  useEffect(() => {
    if (stage === "done" && !finalReport && !loadingFinalReport) {
      const timer = setTimeout(() => {
        void fetchFinalReport();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [stage, finalReport, loadingFinalReport, fetchFinalReport]);

  const handleRunCode = useCallback(async () => {
    captureSnapshot("run");

    const codeToRun = answer.trim();
    if (!codeToRun) return;

    const challenge = currentQuestion?.coding_challenge || currentQuestion?.raw?.coding_challenge || {};
    const testsToRun = buildTestCasesFromChallenge(challenge);

    setCodeStatus("running");
    setCodeOutput(null);
    setExecutionResult(null);

    try {
      const payload = {
        language: (challenge.language || "python").toLowerCase(),
        code: codeToRun,
        test_cases: testsToRun,
      };

      const res = await fetch(`${API}/run-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const raw = data?.results?.[0]?.raw;
      const rawResults = Array.isArray(raw?.results) ? raw.results : [];

      const normalizedCases = rawResults.map((r: any, i: number) => ({
        index: i,
        input: r.input ?? "",
        expected: r.expected ?? "",
        output: r.stdout ?? "(no output)",
        success: r.passed === true,
      }));

      const allPassed = raw?.all_passed === true;

      setExecutionResult({
        cases: normalizedCases,
        summary: {
          total: normalizedCases.length,
          passed: normalizedCases.filter((c: any) => c.success).length,
        },
      });

      setCodeStatus(allPassed ? "success" : "error");
      setCodeOutput(
        normalizedCases
          .map(
            (c: any) =>
              `Test ${c.index + 1}: ${c.success ? "âœ… PASSED" : "âŒ FAILED"}\n` +
              `Input: ${c.input}\nExpected: ${c.expected}\nGot: ${c.output}`
          )
          .join("\n\n")
      );
    } catch (err: any) {
      setCodeStatus("error");
      setCodeOutput(`Network error: ${err.message}`);
      setExecutionResult(null);
    }
  }, [
    answer,
    currentQuestion,
    setCodeStatus,
    setCodeOutput,
    setExecutionResult,
    API,
    token,
    captureSnapshot,
  ]);

  const handleStart = useCallback(
    async (
      arg1: string | { role_title: string; company_style: string } = "Technical Interview",
      difficulty = "medium",
      techStack = ""
    ) => {
      let jobTitle = "Technical Interview";
      let roleTitle = "Backend Engineer";
      let companyStyle = "FAANG";

      if (typeof arg1 === "object" && arg1 !== null && "role_title" in arg1) {
        roleTitle = arg1.role_title;
        companyStyle = arg1.company_style;
        jobTitle = roleTitle;
      } else if (typeof arg1 === "string") {
        jobTitle = arg1;
      }

      if (!token) return;
      if (startAttemptRef.current) return;
      startAttemptRef.current = true;
      setCameraError(null);

      let capturedImage: string | null = referenceImage;
      let serverSessionId: string | null = null;

      try {
        if (!capturedImage || imageStatus !== "captured") {
          capturedImage = await captureReferenceImage();
        }
        if (!capturedImage) throw new Error("Reference image capture failed unexpectedly");

        if (needsFullscreen && !isFullscreen()) {
          pendingArgsRef.current = { arg1, difficulty, techStack };
          setFullscreenPromptVisible(true);
          startAttemptRef.current = false;
          return;
        }
        setFullscreenPromptVisible(false);

        const richContext = (resumeParsed as any)?.full_context_for_prompt || resumeParsed?.summary || "";
        const startPayload: any = {
          jobTitle,
          difficulty,
          techStack,
          resume_summary: richContext,
          allow_pii: false,
          referenceImage: capturedImage,
          role_title: roleTitle,
          company_style: companyStyle,
          options: {
            role_title: roleTitle,
            company_style: companyStyle,
          },
        };

        const resp = await fetch(`${API || ""}/interview/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(startPayload),
        });

        if (resp.status !== 200) {
          let body: any;
          try {
            body = await resp.json();
          } catch {
            body = { message: `Server error ${resp.status}` };
          }
          throw new Error(body.message || body.error || `Failed to start (status ${resp.status})`);
        }

        const data = await resp.json().catch(() => null);
        serverSessionId = data?.sessionId || data?.session_id || null;
        if (!serverSessionId) throw new Error("No session ID returned");

        localStorage.setItem("active_interview_session", serverSessionId);

        if (data?.round_info) {
          setCurrentRound(data.round_info.current || "screening");
          setRoundProgress(data.round_info.progress || null);
        }
        setIsProbeQuestion(!!data?.firstQuestion?.is_probe);
        setLastDiagnosis(null);

        await startInterview?.(jobTitle, difficulty, techStack, serverSessionId, data?.firstQuestion);
        setCameraError(null);

        try {
          if (proctorVideoRef.current && !proctorVideoRef.current.srcObject) {
            const pStream = await navigator.mediaDevices.getUserMedia({
              video: { width: 640, height: 360, facingMode: "user" },
              audio: false,
            });
            proctorVideoRef.current.srcObject = pStream;
            proctorVideoRef.current.muted = true;
            proctorVideoRef.current.playsInline = true;
            await proctorVideoRef.current.play().catch(() => {});
          }
        } catch (e) {
          console.warn("Proctor video start failed:", e);
        }

        setCameraActive(true);
      } catch (e: any) {
        const displayError = e.message || String(e);
        let suggestion = "";
        if (displayError.includes("dark")) suggestion = " Try turning on more lights.";
        else if (displayError.includes("bright")) suggestion = " Try reducing backlight.";
        else if (displayError.includes("face")) suggestion = " Ensure your face is visible.";
        setCameraError(displayError + suggestion);
        setImageStatus("error");
        stopCamera();
      } finally {
        startAttemptRef.current = false;
      }
    },
    [
      token,
      startAttemptRef,
      setCameraError,
      referenceImage,
      imageStatus,
      captureReferenceImage,
      needsFullscreen,
      isFullscreen,
      pendingArgsRef,
      setFullscreenPromptVisible,
      resumeParsed,
      API,
      setCurrentRound,
      setRoundProgress,
      setIsProbeQuestion,
      setLastDiagnosis,
      startInterview,
      proctorVideoRef,
      setCameraActive,
      setImageStatus,
      stopCamera,
    ]
  );

  const handleSubmitAnswer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const isWhiteboard = currentQuestion?.expectedAnswerType === "system_design";
      if ((!answer.trim() && !isWhiteboard) || loading || !currentQuestion) return;

      let finalWhiteboardData: any[] = [];
      let whiteboardImageBase64: string | null = null;

      if (isWhiteboard) {
        if (excalidrawAPI && typeof excalidrawAPI.getSceneElements === "function") {
          const allElements = excalidrawAPI.getSceneElements();
          finalWhiteboardData = allElements.filter((el: any) => !el.isDeleted);

          if (finalWhiteboardData.length > 0) {
            try {
              const { exportToBlob } = await import("@excalidraw/excalidraw");
              const blob = await exportToBlob({
                elements: finalWhiteboardData,
                mimeType: "image/jpeg",
                appState: {
                  ...excalidrawAPI.getAppState(),
                  exportWithDarkMode: false,
                },
                files: excalidrawAPI.getFiles(),
              });

              whiteboardImageBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            } catch (err) {
              console.error("Failed to generate whiteboard image:", err);
            }
          }
        } else if (whiteboardElementsRef.current && whiteboardElementsRef.current.length > 0) {
          finalWhiteboardData = [...whiteboardElementsRef.current];
        }
      }

      if (currentQuestion?.expectedAnswerType === "code") {
        captureSnapshot("auto");
      }

      const payload: any = {
        answer,
        question_type: "text",
        code_execution_result: executionResult,
        whiteboard_elements: finalWhiteboardData,
        whiteboard_snapshot: whiteboardImageBase64,
        user_time_complexity: timeComplexity,
        user_space_complexity: spaceComplexity,
        playback_history: playbackHistory.current,
      };

      if (currentQuestion.expectedAnswerType === "code") {
        payload.question_type = "code";
      } else if (isWhiteboard) {
        payload.question_type = "system_design";
      }

      try {
        const result = await submitAnswer(payload, currentQuestion.questionId);

        setAnswer("");
        setCodeOutput(null);
        setExecutionResult(null);
        setTimeComplexity("");
        setSpaceComplexity("");
        setWhiteboardElements([]);
        if (excalidrawAPI) {
          excalidrawAPI.resetScene();
        }

        if (result?.technical_diagnosis) setLastDiagnosis(result.technical_diagnosis);
        else setLastDiagnosis(null);

        if (result?.eliminated || result?.ended) {
          if (endInterview) {
            await endInterview(result?.elimination_reason || "Interview Completed Successfully", false);
          }
          setTimeout(() => {
            void fetchFinalReport();
          }, 2000);
          return;
        }

        const newRoundData = result?.round_info || result?.metadata;
        const prevRound = (currentRound || "").toLowerCase().trim();
        const nextRoundRaw = (newRoundData?.current || newRoundData?.current_round || "").trim();
        const nextRound = nextRoundRaw.toLowerCase();

        const isRoundChange =
          nextRound &&
          nextRound !== prevRound &&
          nextRound !== "complete" &&
          nextRound !== "completed";

        if (isRoundChange) {
          setNextRoundName(nextRoundRaw);
          setRoundSummary(null);
          setShowRoundModal(true);
          void fetchRoundFeedback(currentRound);
          if (newRoundData.progress) setRoundProgress(newRoundData.progress);
          return;
        }

        if (newRoundData) {
          setCurrentRound(nextRoundRaw || currentRound);
          if (newRoundData.progress) setRoundProgress(newRoundData.progress);
        }
      } catch (err) {
        console.error("Submit error:", err);
      }
    },
    [
      currentQuestion,
      answer,
      loading,
      excalidrawAPI,
      whiteboardElementsRef,
      captureSnapshot,
      executionResult,
      timeComplexity,
      spaceComplexity,
      playbackHistory,
      submitAnswer,
      setAnswer,
      setCodeOutput,
      setExecutionResult,
      setTimeComplexity,
      setSpaceComplexity,
      setWhiteboardElements,
      setLastDiagnosis,
      endInterview,
      fetchFinalReport,
      currentRound,
      setNextRoundName,
      setRoundSummary,
      setShowRoundModal,
      fetchRoundFeedback,
      setRoundProgress,
      setCurrentRound,
    ]
  );

  const handleGetHint = useCallback(async () => {
    if (hint) return;
    if (!confirm("Taking a hint will reduce your maximum score for this question by 15%. Continue?")) return;

    setLoadingHint(true);
    const h = await fetchHint(
      currentQuestion?.questionText || "",
      currentQuestion?.type || "conceptual",
      answer
    );
    setHint(h);
    setLoadingHint(false);
  }, [hint, setLoadingHint, fetchHint, currentQuestion, answer, setHint]);

  useEffect(() => {
    setHint(null);
  }, [currentQuestion?.questionId, setHint]);

  useEffect(() => {
    if (currentQuestion) {
      setIsProbeQuestion(!!currentQuestion.is_probe);
    }
  }, [currentQuestion, setIsProbeQuestion]);

  return {
    fetchRoadmap,
    fetchFinalReport,
    handleRunCode,
    handleStart,
    handleSubmitAnswer,
    handleGetHint,
    handleEditorDidMount: (editor: any) => {
      editor.onDidPaste(() => {
        captureSnapshot("paste");
      });
    },
  };
};

