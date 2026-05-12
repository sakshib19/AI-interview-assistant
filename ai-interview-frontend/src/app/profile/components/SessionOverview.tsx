"use client";

import { SessionDetail } from "../page";
import { CheckCircle2, XCircle, Clock, HelpCircle, AlertTriangle } from "lucide-react";
import { Briefcase } from "lucide-react";

export default function SessionOverview({ session }: { session: SessionDetail }) {
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "Hire":
        return "text-green-400";
      case "Reject":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "Hire":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "Reject":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

  {/* Final Verdict */}
  <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
    <p className="text-sm text-gray-400 mb-1">Final Verdict</p>
    <div className="flex items-center gap-2">
      {getVerdictIcon(session.finalVerdict)}
      <p className={`font-semibold ${getVerdictColor(session.finalVerdict)}`}>
        {session.finalVerdict}
      </p>
    </div>
  </div>

  {/* Confidence */}
  <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
    <p className="text-sm text-gray-400 mb-1">Confidence</p>
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-600 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${session.confidence}%` }}
        />
      </div>
      <span className="text-sm font-semibold">{session.confidence}%</span>
    </div>
  </div>

  {/* Duration */}
  <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
    <p className="text-sm text-gray-400 mb-1">Interview Duration</p>
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-gray-400" />
      <p className="font-semibold">{formatDuration(session.duration)}</p>
    </div>
  </div>

  {/* Total Questions */}
  <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
    <p className="text-sm text-gray-400 mb-1">Total Questions</p>
    <p className="text-2xl font-bold text-blue-400">
      {session.totalQuestions}
    </p>
  </div>

  {/* Violations & Gray Zone */}
  <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
    <p className="text-sm text-gray-400 mb-2">Violations & Gray Zone</p>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className="text-sm font-semibold text-red-400">
          {session.violationCount}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
        <span className="text-sm font-semibold text-yellow-400">
          {session.grayZoneCount}
        </span>
      </div>
    </div>
  </div>

  {/* ✅ Recommended Role (6th box) */}
  <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
    <p className="text-sm text-gray-400 mb-1">Recommended Role</p>
    {session.recommendedRole ? (
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-indigo-400" />
        <p className="font-semibold text-indigo-300">
          {session.recommendedRole}
        </p>
      </div>
    ) : (
      <p className="text-sm text-gray-500 italic">Not available</p>
    )}
  </div>

</div>


      {/* Session Timeline */}
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <p className="text-sm text-gray-400 mb-2">Session Timeline</p>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <p className="text-gray-400">Started</p>
            <p className="text-gray-200">
              {new Date(session.startedAt).toLocaleString()}
            </p>
          </div>
          {session.endedAt && (
            <>
              <div className="text-gray-500">→</div>
              <div>
                <p className="text-gray-400">Ended</p>
                <p className="text-gray-200">
                  {new Date(session.endedAt).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}