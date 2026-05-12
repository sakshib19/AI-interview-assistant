"use client";

import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

// Detailed type for a single session in the history
export type InterviewSession = {
  sessionId: string;
  date: string;

  // --- NEW FIELDS FROM BACKEND ---
  violationCount?: number;
  events?: any[]; // Contains the raw violation events
  qaIds?: string[];
  status?: string;
  // -------------------------------

  finalVerdict?: "hire" | "reject" | "maybe" | "pending";
  decisionConfidence?: number;

  rounds: {
    screening?: {
      averageScore: number | null;
      feedback: string | null;
    } | null;
    technical?: {
      averageScore: number | null;
      feedback: string | null;
    } | null;
    behavioral?: {
      averageScore: number | null;
      feedback: string | null;
    } | null;
  };
};

export type DashboardData = {
  user: {
    name: string;
    email: string;
    role: string;
  };
  stats: {
    totalInterviews: number;
    averageScore: number | null;
  };
  interviewHistory: InterviewSession[];
};

export function useProfile() {
  const { token } = useAuth();

  const fetchDashboard = useCallback(async (): Promise<DashboardData> => {
    if (!token) {
      throw new Error("Missing auth token");
    }

    try {
      const res = await fetch(`${API}/profile/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `Failed to fetch dashboard: ${res.status} ${res.statusText}`
        );
      }

      return res.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          `Network error: Unable to connect to backend at ${API}. Please ensure the backend server is running.`
        );
      }
      throw error;
    }
  }, [token]);

  return { fetchDashboard };
}