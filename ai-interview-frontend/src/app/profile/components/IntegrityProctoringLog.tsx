"use client";

import { ViolationData } from "../page";
import { AlertTriangle, Shield, Clock, Eye, UserX, Package } from "lucide-react";

export default function IntegrityProctoringLog({
  violations,
}: {
  violations: ViolationData[];
}) {
  // Map backend violation_type to Icons and Colors
  const getViolationConfig = (type: string) => {
    switch (type) {
      case "face_mismatch":
        return {
          label: "Face Mismatch",
          color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          icon: <UserX className="w-4 h-4" />,
        };
      case "multiple_people":
        return {
          label: "Multiple People",
          color: "bg-red-500/20 text-red-400 border-red-500/30",
          icon: <AlertTriangle className="w-4 h-4" />,
        };
      case "prohibited_object":
        return {
          label: "Prohibited Object",
          color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
          icon: <Package className="w-4 h-4" />,
        };
      case "violation": // Generic system violation (e.g., tab switch)
        return {
          label: "Integrity Violation",
          color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
          icon: <Eye className="w-4 h-4" />,
        };
      default:
        return {
          label: type.replace("_", " "),
          color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
          icon: <Shield className="w-4 h-4" />,
        };
    }
  };

  const getActionStyles = (action?: string) => {
    if (action === "terminate") return "text-red-400 bg-red-400/10 border-red-400/20";
    return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
  };

  // Summary Logic
  const summary = violations.reduce(
    (acc, v) => {
      acc.total++;
      if (v.action === "terminate") acc.terminations++;
      if (v.type === "multiple_people" || v.action === "terminate") acc.critical++;
      return acc;
    },
    { total: 0, terminations: 0, critical: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Incidents</p>
          <p className="text-2xl font-mono font-bold text-white">{summary.total}</p>
        </div>
        <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Critical Flags</p>
          <p className="text-2xl font-mono font-bold text-orange-400">{summary.critical}</p>
        </div>
        <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Auto-Terminations</p>
          <p className="text-2xl font-mono font-bold text-red-500">{summary.terminations}</p>
        </div>
      </div>

      {/* Violation Log Table-style */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300 px-1">Detailed Incident Log</h3>
        {violations.length === 0 ? (
          <div className="bg-gray-800/30 rounded-lg p-10 border border-dashed border-gray-700 text-center">
            <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No integrity incidents flagged for this session.</p>
          </div>
        ) : (
          violations.map((v) => {
            const config = getViolationConfig(v.type);
            return (
              <div
                key={v.id}
                className="group bg-gray-800/40 hover:bg-gray-800/60 transition-colors rounded-lg p-4 border border-gray-700"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${config.color.split(' ')[0]} ${config.color.split(' ')[1]}`}>
                      {config.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${config.color}`}>
                          {config.label}
                        </span>
                        {v.action && (
                          <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded border ${getActionStyles(v.action)}`}>
                            {v.action}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-200 font-medium">{v.reason}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end md:self-center text-xs text-gray-500 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(v.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Warning Footer */}
      {summary.terminations > 0 && (
        <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-400">Automatic Session Termination</p>
            <p className="text-xs text-red-300/70 leading-relaxed mt-1">
              This session was closed by the automated proctoring system due to high-severity violations or repeated warnings. 
              Review the timestamps above for specific evidence.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}