"use client";

import { SessionDetail } from "../page";
import { CheckCircle2, AlertCircle, XCircle, ArrowRight } from "lucide-react";

export default function RoundWiseProgress({
  rounds,
}: {
  rounds: SessionDetail["rounds"];
}) {
  const roundTypes = [
    { key: "screening" as const, label: "Screening", color: "blue" },
    { key: "technical" as const, label: "Technical", color: "purple" },
    { key: "behavioral" as const, label: "Behavioral", color: "green" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pass":
        return "text-green-400 bg-green-400/10 border-green-400/30";
      case "Weak":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      case "Failed":
        return "text-red-400 bg-red-400/10 border-red-400/30";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pass":
        return <CheckCircle2 className="w-5 h-5" />;
      case "Weak":
        return <AlertCircle className="w-5 h-5" />;
      case "Failed":
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roundTypes.map((roundType, index) => {
          const round = rounds[roundType.key];
          if (!round) return null;

          return (
            <div key={roundType.key} className="relative">
              <div
                className={`bg-gray-700/50 rounded-lg p-5 border-2 ${
                  round.status === "Pass"
                    ? "border-green-500/30"
                    : round.status === "Weak"
                    ? "border-yellow-500/30"
                    : "border-red-500/30"
                }`}
              >
                {/* Round Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold capitalize">{roundType.label}</h3>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-md border ${getStatusColor(
                      round.status
                    )}`}
                  >
                    {getStatusIcon(round.status)}
                    <span className="text-sm font-medium">{round.status}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Questions</span>
                    <span className="font-semibold">{round.questionCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Average Score</span>
                    <span className={`text-xl font-bold ${getScoreColor(round.averageScore)}`}>
                      {(round.averageScore * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Transition Reason */}
                {round.transitionReason && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <p className="text-xs text-gray-400 mb-1">Transition Reason</p>
                    <p className="text-sm text-gray-300">{round.transitionReason}</p>
                  </div>
                )}
              </div>

              {/* Arrow between rounds */}
              {index < roundTypes.length - 1 && rounds[roundTypes[index + 1]?.key] && (
                <div className="hidden md:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Round Summary */}
      <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
        <p className="text-sm text-gray-400 mb-2">Round Summary</p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {roundTypes.map((roundType) => {
            const round = rounds[roundType.key];
            return (
              <div key={roundType.key}>
                <p className="text-gray-400 capitalize">{roundType.label}</p>
                <p className="text-gray-200 font-semibold">
                  {round
                    ? `${round.questionCount} questions, ${(round.averageScore * 100).toFixed(1)}% avg`
                    : "Not completed"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

