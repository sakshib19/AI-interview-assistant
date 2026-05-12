"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type InterviewDifficulty = "easy" | "medium" | "hard" | "expert";
export type AnswerType =
  | "short"
  | "medium"
  | "code"
  | "architectural"
  | "system_design";

export type InterviewStage = "idle" | "uploading" | "running" | "done";

export type ConversationMessage = {
  role: "assistant" | "user";
  text: string;
};

export type InterviewQuestion = {
  questionId: string;
  questionText: string;
  type?: string;
  target_project?: string;
  technology_focus?: string;
  expectedAnswerType?: AnswerType;
  difficulty?: InterviewDifficulty;
  ideal_outline?: string;
  ideal_answer_outline?: string;
  red_flags?: string[];
  action_type?: string;
  confidence?: number;
  is_probe?: boolean;
  round?: string;
  raw?: any;
  coding_challenge?: any;
  [k: string]: any;
};

export type InterviewAnswerResult = {
  score?: number;
  overall_score?: number;
  rubricScores?: Record<string, number>;
  dimension_scores?: Record<string, number>;
  confidence?: number;
  verdict?: "fail" | "weak" | "acceptable" | "strong" | "exceptional";
  rationale?: string;
  red_flags_detected?: string[];
  missing_elements?: string[];
  improvement?: string;
  follow_up_probe?: string | null;
  nextQuestion?: InterviewQuestion | null;
  ended?: boolean;
  decision?: any | null;
  in_gray_zone?: boolean;
  needs_human_review?: boolean;
  round_info?: {
    current: string;
    progress: Record<string, any>;
    section_counts?: Record<string, number>;
    round_history?: Record<string, any>;
  };
  eliminated?: boolean;
  elimination_reason?: string | null;
  is_probe?: boolean;
  metadata?: any;
  technical_diagnosis?: {
    win?: string;
    gap?: {
      issue?: string;
      observed?: string;
      expected_level?: string;
    };
    fix?: {
      action?: string;
      resource_type?: string;
    };
    sub_topics?: any[];
  };
};

export type PerformanceMetrics = {
  question_count: number;
  average_score: number;
  last_score: number | null;
  consecutive_fails: number;
  consecutive_wins: number;
  trend: string;
  confidence: number;
  score_variance?: number;
};

export type InterviewHistoryItem = {
  q: InterviewQuestion;
  a?: string;
  result?: InterviewAnswerResult;
};

/* -------------------------------------------------------------------------- */
/*                                 CONSTANTS                                  */
/* -------------------------------------------------------------------------- */

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const SESSION_STORAGE_KEY = "active_interview_session";

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const normalizeType = (type?: string | null): string => {
  return type?.trim() || "conceptual";
};

const normalizeQuestion = (questionData: any): InterviewQuestion => {
  const questionId =
    questionData?.qaId ||
    questionData?.questionId ||
    questionData?.id ||
    questionData?._id ||
    crypto.randomUUID();

  return {
    questionId,
    questionText:
      questionData?.question ||
      questionData?.questionText ||
      questionData?.followup_question ||
      questionData?.follow_up_question ||
      "",
    type: normalizeType(questionData?.type),
    target_project: questionData?.target_project,
    technology_focus: questionData?.technology_focus,
    expectedAnswerType:
      questionData?.expected_answer_type ||
      questionData?.expectedAnswerType ||
      "medium",
    difficulty: questionData?.difficulty || "medium",
    ideal_outline:
      questionData?.ideal_answer_outline ||
      questionData?.ideal_outline ||
      "",
    ideal_answer_outline:
      questionData?.ideal_answer_outline ||
      questionData?.ideal_outline ||
      "",
    red_flags: questionData?.red_flags || [],
    confidence: questionData?.confidence,
    is_probe: questionData?.is_probe || false,
    round: questionData?.round || "screening",
    raw: questionData,
    coding_challenge:
      questionData?.coding_challenge ||
      questionData?.challenge ||
      null,
  };
};

const safeJson = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

/* -------------------------------------------------------------------------- */
/*                               CUSTOM HOOK                                  */
/* -------------------------------------------------------------------------- */

export function useInterview() {
  const { token } = useAuth();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState<InterviewStage>("idle");
  const [currentQuestion, setCurrentQuestion] =
    useState<InterviewQuestion | null>(null);

  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resumeParsed, setResumeParsed] = useState<any | null>(null);
  const [resumeFileUrl, setResumeFileUrl] = useState<string | null>(null);

  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);

  const [finalDecision, setFinalDecision] = useState<any | null>(null);

  /* ------------------------------------------------------------------------ */
  /*                               AUTH HEADERS                               */
  /* ------------------------------------------------------------------------ */

  const authHeaders = useMemo(() => {
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  /* ------------------------------------------------------------------------ */
  /*                             HISTORY BUILDERS                             */
  /* ------------------------------------------------------------------------ */

  const buildConversation = useCallback((): ConversationMessage[] => {
    return history.flatMap((item) => {
      const messages: ConversationMessage[] = [];

      if (item.q?.questionText) {
        messages.push({
          role: "assistant",
          text: item.q.questionText,
        });
      }

      if (item.a) {
        messages.push({
          role: "user",
          text: String(item.a),
        });
      }

      return messages;
    });
  }, [history]);

  const buildQuestionHistory = useCallback(() => {
    return history.map((item) => ({
      question: item.q.questionText,
      type: normalizeType(item.q.type),
      target_project: item.q.target_project || "general",
      score:
        item.result?.overall_score ??
        item.result?.score ??
        null,
    }));
  }, [history]);

  /* ------------------------------------------------------------------------ */
  /*                              API REQUESTER                               */
  /* ------------------------------------------------------------------------ */

  const apiRequest = useCallback(
    async <T = any>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> => {
      const response = await fetch(`${API}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
          ...(options.headers || {}),
        },
      });

      const body = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          body?.message ||
            body?.error ||
            "Something went wrong"
        );
      }

      return body;
    },
    [authHeaders]
  );

  /* ------------------------------------------------------------------------ */
  /*                             RESUME HANDLING                              */
  /* ------------------------------------------------------------------------ */

  const onResumeReady = useCallback(
    (parsed: any, fileUrl?: string | null) => {
      if (parsed?.full_context_for_prompt) {
        parsed.summary = parsed.full_context_for_prompt;
      }

      setResumeParsed(parsed);

      if (fileUrl) {
        setResumeFileUrl(fileUrl);
      }

      setStage("idle");
    },
    []
  );

  /* ------------------------------------------------------------------------ */
  /*                              REPORT VIOLATION                            */
  /* ------------------------------------------------------------------------ */

  const reportViolation = useCallback(
    async (reason: string) => {
      if (!sessionId) {
        return {
          ok: false,
          error: "NO_SESSION",
        };
      }

      return apiRequest("/interview/violation", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          reason,
        }),
      });
    },
    [apiRequest, sessionId]
  );

  /* ------------------------------------------------------------------------ */
  /*                              START INTERVIEW                             */
  /* ------------------------------------------------------------------------ */

  const startInterview = useCallback(
    async (
      jobTitle?: string,
      difficulty?: string,
      techStack?: string,
      existingSessionId?: string,
      existingQuestionData?: any,
      config?: {
        role_title?: string;
        company_style?: string;
      }
    ) => {
      try {
        setLoading(true);
        setError(null);
        setFinalDecision(null);
        setLastFeedback(null);
        setPerformanceMetrics(null);

        if (!token) {
          throw new Error("Please login first.");
        }

        /* -------------------------- HYDRATION MODE ------------------------- */

        if (existingSessionId && existingQuestionData) {
          setSessionId(existingSessionId);
          setCurrentQuestion(normalizeQuestion(existingQuestionData));
          setStage("running");
          return;
        }

        if (!resumeParsed && !resumeFileUrl) {
          throw new Error("Please upload your resume first.");
        }

        const payload = {
          resume_summary: resumeParsed?.summary || "",
          parsed_resume: resumeParsed || {},
          retrieved_chunks: [],
          allow_pii: false,
          role_title:
            config?.role_title ||
            jobTitle ||
            "Software Engineer",
          company_style:
            config?.company_style || "FAANG",
          difficulty,
          techStack,
          ...(resumeFileUrl && {
            resume_url: resumeFileUrl,
          }),
        };

        const body = await apiRequest<any>("/interview/start", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const newSessionId =
          body?.sessionId || body?.session_id;

        if (newSessionId) {
          setSessionId(newSessionId);
          localStorage.setItem(
            SESSION_STORAGE_KEY,
            newSessionId
          );
        }

        const questionData =
          body?.firstQuestion ||
          body?.question ||
          body?.data?.question ||
          body?.parsed;

        if (questionData) {
          setCurrentQuestion(normalizeQuestion(questionData));
          setStage("running");
        }

        setHistory([]);
      } catch (err: any) {
        setError(err.message || "Failed to start interview");
      } finally {
        setLoading(false);
      }
    },
    [
      token,
      resumeParsed,
      resumeFileUrl,
      apiRequest,
    ]
  );

  /* ------------------------------------------------------------------------ */
  /*                                FETCH HINT                                */
  /* ------------------------------------------------------------------------ */

  const fetchHint = useCallback(
    async (
      questionText: string,
      type: string,
      currentAnswer = ""
    ) => {
      if (!sessionId || !currentQuestion?.questionId) {
        return null;
      }

      try {
        const data = await apiRequest<any>(
          "/interview/hint",
          {
            method: "POST",
            body: JSON.stringify({
              sessionId,
              questionId: currentQuestion.questionId,
              questionText,
              type,
              currentAnswer,
            }),
          }
        );

        return data?.hint || null;
      } catch (err) {
        console.error("Hint fetch error:", err);
        return null;
      }
    },
    [apiRequest, currentQuestion, sessionId]
  );

  /* ------------------------------------------------------------------------ */
  /*                               SUBMIT ANSWER                              */
  /* ------------------------------------------------------------------------ */

  const submitAnswer = useCallback(
    async (candidateAnswerOrPayload: any) => {
      if (!token) {
        setError("Please login first.");
        return null;
      }

      if (!sessionId || !currentQuestion) {
        setError("Interview session missing.");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const payloadData =
          typeof candidateAnswerOrPayload === "string"
            ? {
                answer: candidateAnswerOrPayload,
              }
            : candidateAnswerOrPayload;

        const candidateAnswer =
          payloadData?.answer ||
          payloadData?.candidateAnswer ||
          "";

        const conversation = buildConversation();

        conversation.push({
          role: "assistant",
          text: currentQuestion.questionText,
        });

        conversation.push({
          role: "user",
          text: candidateAnswer,
        });

        const payload = {
          sessionId,
          qaId: currentQuestion.questionId,
          questionId: currentQuestion.questionId,
          questionText: currentQuestion.questionText,
          ideal_outline:
            currentQuestion.ideal_outline ||
            currentQuestion.ideal_answer_outline ||
            "",

          candidateAnswer,
          candidate_answer: candidateAnswer,

          resume_summary: resumeParsed?.summary || "",
          retrieved_chunks: [],

          conversation,
          question_history: buildQuestionHistory(),

          allow_pii: false,

          question_type:
            payloadData?.question_type || "text",

          code_execution_result:
            payloadData?.code_execution_result || null,

          whiteboard_elements:
            payloadData?.whiteboard_elements || null,

          whiteboard_snapshot:
            payloadData?.whiteboard_snapshot || null,

          user_time_complexity:
            payloadData?.user_time_complexity || null,

          user_space_complexity:
            payloadData?.user_space_complexity || null,

          playback_history:
            payloadData?.playback_history || null,
        };

        const body = await apiRequest<any>(
          "/interview/answer",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        const rawResult =
          body?.result ||
          body?.validated ||
          body;

        const result: InterviewAnswerResult = {
          score:
            rawResult?.overall_score ||
            rawResult?.score,

          overall_score:
            rawResult?.overall_score ||
            rawResult?.score,

          rubricScores:
            rawResult?.rubric_scores ||
            rawResult?.rubricScores,

          dimension_scores:
            rawResult?.dimension_scores,

          confidence: rawResult?.confidence,
          verdict: rawResult?.verdict,
          rationale: rawResult?.rationale,

          red_flags_detected:
            rawResult?.red_flags_detected || [],

          missing_elements:
            rawResult?.missing_elements || [],

          improvement:
            rawResult?.improvement ||
            rawResult?.follow_up_probe,

          follow_up_probe:
            rawResult?.follow_up_probe,

          ended:
            body?.ended ||
            rawResult?.ended ||
            false,

          decision:
            body?.final_decision ||
            body?.decision ||
            rawResult?.decision,

          in_gray_zone:
            body?.in_gray_zone ||
            rawResult?.in_gray_zone ||
            false,

          needs_human_review:
            body?.needs_human_review ||
            rawResult?.needs_human_review ||
            false,

          round_info: body?.round_info,
          metadata: body?.metadata,

          eliminated:
            body?.eliminated || false,

          elimination_reason:
            body?.elimination_reason || null,

          is_probe:
            body?.nextQuestion?.is_probe || false,

          technical_diagnosis:
            rawResult?.technical_diagnosis ||
            rawResult?.diagnosis ||
            {},
        };

        setHistory((prev) => [
          ...prev,
          {
            q: currentQuestion,
            a: candidateAnswer,
            result,
          },
        ]);

        if (result?.improvement) {
          setLastFeedback(result.improvement);
        }

        if (body?.performance_metrics) {
          setPerformanceMetrics(body.performance_metrics);
        }

        /* ----------------------------- ELIMINATION ---------------------------- */

        if (result?.eliminated) {
          setFinalDecision({
            verdict: "reject",
            eliminated: true,
            reason:
              result.elimination_reason ||
              "Performance threshold not met",
          });

          setCurrentQuestion(null);
          setStage("done");

          localStorage.removeItem(
            SESSION_STORAGE_KEY
          );

          return result;
        }

        /* ------------------------------ COMPLETED ----------------------------- */

        if (result?.ended || body?.is_final) {
          setFinalDecision(
            result?.decision ||
              body?.final_decision ||
              body?.decision ||
              null
          );

          setCurrentQuestion(null);
          setStage("done");

          localStorage.removeItem(
            SESSION_STORAGE_KEY
          );

          return result;
        }

        /* --------------------------- NEXT QUESTION --------------------------- */

        const nextQuestionData =
          body?.nextQuestion ||
          body?.next_question ||
          body?.parsed;

        if (nextQuestionData) {
          setCurrentQuestion(
            normalizeQuestion(nextQuestionData)
          );

          setStage("running");
        }

        return result;
      } catch (err: any) {
        setError(err.message || "Answer submit failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      token,
      sessionId,
      currentQuestion,
      resumeParsed,
      buildConversation,
      buildQuestionHistory,
      apiRequest,
    ]
  );

  /* ------------------------------------------------------------------------ */
  /*                              RESUME SESSION                              */
  /* ------------------------------------------------------------------------ */

  const resumeSession = useCallback(
    async (storedSessionId: string) => {
      if (!token) return;

      try {
        setLoading(true);

        const data = await apiRequest<any>(
          `/interview/session/${storedSessionId}`,
          {
            method: "GET",
          }
        );

        setSessionId(data?.sessionId);
        setStage(data?.stage || "running");

        if (data?.history) {
          setHistory(
            data.history.map((item: any) => ({
              q: normalizeQuestion(item),
              a: item?.answer,
              result: item?.result,
            }))
          );
        }

        if (data?.currentQuestion) {
          setCurrentQuestion(
            normalizeQuestion(data.currentQuestion)
          );
        }
      } catch (err) {
        console.error("Session restore failed", err);

        localStorage.removeItem(
          SESSION_STORAGE_KEY
        );

        setError("Could not restore session.");
      } finally {
        setLoading(false);
      }
    },
    [token, apiRequest]
  );

  /* ------------------------------------------------------------------------ */
  /*                               END INTERVIEW                              */
  /* ------------------------------------------------------------------------ */

  const endInterview = useCallback(
    async (
      reason?: string,
      markRejected = false
    ) => {
      try {
        setError(null);

        if (reason) {
          await reportViolation(reason).catch(() => null);
        }

        if (!sessionId) {
          setStage("done");
          setCurrentQuestion(null);
          return;
        }

        const body = await apiRequest<any>(
          "/interview/end",
          {
            method: "POST",
            body: JSON.stringify({
              sessionId,
              reason: reason || null,
              terminated_by_violation: markRejected,
            }),
          }
        );

        if (body?.finalDecisionRef) {
          setFinalDecision({
            ref: body.finalDecisionRef,
            reason,
          });
        }
      } catch (err) {
        console.error("End interview failed", err);
      } finally {
        setStage("done");
        setCurrentQuestion(null);

        localStorage.removeItem(
          SESSION_STORAGE_KEY
        );
      }
    },
    [apiRequest, reportViolation, sessionId]
  );

  /* ------------------------------------------------------------------------ */
  /*                                  EXPORTS                                 */
  /* ------------------------------------------------------------------------ */

  return {
    sessionId,
    stage,
    currentQuestion,
    history,
    loading,
    error,

    resumeParsed,
    resumeFileUrl,

    lastFeedback,
    performanceMetrics,
    finalDecision,

    onResumeReady,
    startInterview,
    submitAnswer,
    endInterview,
    reportViolation,
    fetchHint,
    resumeSession,

    setResumeParsed,
    setError,
  };
}