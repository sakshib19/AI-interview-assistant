"use client";

import { PerformanceData } from "../page";
import { TrendingUp, TrendingDown, Target, Lightbulb } from "lucide-react";

export default function PerformanceInsights({
  insights,
}: {
  insights?: PerformanceData;
}) {
  if (!insights) {
    return (
      <div className="bg-gray-700/50 rounded-lg p-8 border border-gray-600 text-center text-gray-400">
        No performance insights available
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "text-red-400 bg-red-400/10 border-red-400/30";
      case "Medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      case "Low":
        return "text-green-400 bg-green-400/10 border-green-400/30";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Strong Areas */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Strong Areas
        </h3>
        <div className="flex flex-wrap gap-2">
          {insights.strongAreas.length > 0 ? (
            insights.strongAreas.map((area, idx) => (
              <div
                key={idx}
                className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-sm font-medium"
              >
                {area}
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400">No strong areas identified</div>
          )}
        </div>
      </div>

      {/* Weak Areas */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-400" />
          Weak Areas (Mapped to Skills)
        </h3>
        <div className="space-y-2">
          {insights.weakAreas.length > 0 ? (
            insights.weakAreas.map((area, idx) => (
              <div
                key={idx}
                className={`bg-gray-700/50 rounded-lg p-3 border ${getSeverityColor(
                  area.severity
                )}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">{area.skill}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(
                      area.severity
                    )}`}
                  >
                    {area.severity} Priority
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400">No weak areas identified</div>
          )}
        </div>
      </div>

      {/* Consistency vs Variance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-gray-400">Consistency</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${insights.consistency * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold text-blue-400">
              {(insights.consistency * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Performance consistency across rounds
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-orange-400" />
            <p className="text-sm text-gray-400">Variance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${insights.variance * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold text-orange-400">
              {(insights.variance * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Performance variance across rounds
          </p>
        </div>
      </div>

      {/* Improvement Recommendations */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Improvement Recommendations
        </h3>
        <div className="space-y-2">
          {insights.recommendations.length > 0 ? (
            insights.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-gray-700/50 rounded-lg p-3 border border-gray-600 flex items-start gap-3"
              >
                <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">{rec}</p>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400">No recommendations available</div>
          )}
        </div>
      </div>
    </div>
  );
}

