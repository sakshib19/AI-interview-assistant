"use client";

import React, { useState } from "react";
import { ViolationData } from "../page";
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  Eye, 
  UserX, 
  Package,
  ShieldAlert,
  ShieldCheck,
  Filter,
  TerminalSquare
} from "lucide-react";

export default function IntegrityProctoringLog({
  violations = [],
}: {
  violations: ViolationData[];
}) {
  const [filter, setFilter] = useState<"all" | "critical" | "warning">("all");

  // Map backend violation_type to modern Icons and Colors
  const getViolationConfig = (type: string, action?: string) => {
    const isCritical = action === "terminate" || type === "multiple_people" || type === "face_mismatch";
    
    if (isCritical) {
      return {
        label: type.replace("_", " "),
        color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        nodeColor: "bg-rose-500",
        icon: <UserX size={16} />,
        severity: "critical"
      };
    }

    switch (type) {
      case "prohibited_object":
        return {
          label: "Prohibited Object",
          color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
          nodeColor: "bg-amber-500",
          icon: <Package size={16} />,
          severity: "warning"
        };
      case "violation": // Generic system violation (e.g., tab switch)
      case "tab_switch":
        return {
          label: "Tab/Focus Switch",
          color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
          nodeColor: "bg-indigo-500",
          icon: <Eye size={16} />,
          severity: "warning"
        };
      default:
        return {
          label: type.replace("_", " "),
          color: "text-neutral-400 bg-neutral-500/10 border-neutral-500/30",
          nodeColor: "bg-neutral-500",
          icon: <AlertTriangle size={16} />,
          severity: "warning"
        };
    }
  };

  // Calculate Metrics & Trust Score
  const summary = violations.reduce(
    (acc, v) => {
      acc.total++;
      if (v.action === "terminate") acc.terminations++;
      
      const config = getViolationConfig(v.type, v.action);
      if (config.severity === "critical") acc.critical++;
      else acc.warnings++;
      
      return acc;
    },
    { total: 0, terminations: 0, critical: 0, warnings: 0 }
  );

  // Trust Score Algorithm (Starts at 100, -25 per critical, -10 per warning)
  const trustScore = Math.max(0, 100 - (summary.critical * 25) - (summary.warnings * 10));

  // Sort violations chronologically
  const sortedViolations = [...violations].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  // Apply Filter
  const filteredViolations = sortedViolations.filter((v) => {
    if (filter === "all") return true;
    const config = getViolationConfig(v.type, v.action);
    return config.severity === filter;
  });

  return (
    <div className="space-y-8">
      
      {/* --- HERO: TRUST SCORE & METRICS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Trust Score Gauge */}
        <div className="lg:col-span-2 bg-neutral-900/50 rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex justify-between items-end mb-4 relative z-10">
            <div>
              <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Shield size={14} className={trustScore > 70 ? "text-[#cbe557]" : trustScore > 40 ? "text-amber-400" : "text-rose-400"} /> 
                Session Trust Score
              </p>
              <h2 className="text-4xl font-black text-white tracking-tighter">
                {trustScore}<span className="text-2xl text-neutral-500">%</span>
              </h2>
            </div>
            <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border backdrop-blur-sm ${
              trustScore === 100 ? "bg-[#cbe557]/10 text-[#cbe557] border-[#cbe557]/30" :
              trustScore > 70 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
              trustScore > 40 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
              "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse"
            }`}>
              {trustScore === 100 ? "Verified" : trustScore > 70 ? "High Trust" : trustScore > 40 ? "Questionable" : "Compromised"}
            </div>
          </div>
          
          <div className="w-full bg-black/40 rounded-full h-3 border border-white/5 relative z-10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                trustScore > 70 ? "bg-gradient-to-r from-emerald-600 to-[#cbe557]" :
                trustScore > 40 ? "bg-gradient-to-r from-orange-600 to-amber-400" :
                "bg-gradient-to-r from-red-600 to-rose-400"
              }`}
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>

        {/* Mini Stats */}
        <div className="bg-neutral-900/50 rounded-2xl p-5 border border-white/5 flex flex-col justify-center">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-amber-400" /> Warnings
          </p>
          <p className="text-3xl font-black text-neutral-200">{summary.warnings}</p>
        </div>
        
        <div className="bg-neutral-900/50 rounded-2xl p-5 border border-white/5 flex flex-col justify-center">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <ShieldAlert size={12} className="text-rose-400" /> Critical Flags
          </p>
          <p className="text-3xl font-black text-rose-400">{summary.critical}</p>
        </div>
      </div>

      {/* --- FORENSIC TIMELINE SECTION --- */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TerminalSquare size={18} className="text-[#cbe557]" /> Detailed Incident Log
          </h3>
          
          {/* Filters */}
          {violations.length > 0 && (
            <div className="flex items-center gap-2 bg-neutral-900/50 p-1.5 rounded-xl border border-white/5">
              <Filter size={14} className="text-neutral-500 ml-2" />
              {(["all", "critical", "warning"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    filter === f 
                      ? "bg-white/10 text-white shadow-sm" 
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timeline Rendering */}
        {violations.length === 0 ? (
          <div className="bg-gradient-to-b from-[#cbe557]/5 to-transparent rounded-3xl p-12 border border-[#cbe557]/20 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#cbe557]/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#cbe557]/30 shadow-[0_0_30px_rgba(203,229,87,0.2)] relative z-10">
              <ShieldCheck size={40} className="text-[#cbe557]" />
            </div>
            <h4 className="text-2xl font-black text-white tracking-tight mb-2 relative z-10">Perfect Integrity</h4>
            <p className="text-neutral-400 max-w-md mx-auto relative z-10">
              No suspicious behavior, multiple faces, or unauthorized tools were detected during this entire session.
            </p>
          </div>
        ) : filteredViolations.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-neutral-500">
            No {filter} incidents found.
          </div>
        ) : (
          <div className="relative pl-4 sm:pl-0">
            {/* The Vertical Line */}
            <div className="absolute left-[27px] sm:left-32 top-4 bottom-4 w-0.5 bg-gradient-to-b from-white/20 via-white/10 to-transparent z-0"></div>

            <div className="space-y-6">
              {filteredViolations.map((v, idx) => {
                const config = getViolationConfig(v.type, v.action);
                const timeStr = new Date(v.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                return (
                  <div key={v.id || idx} className="relative z-10 flex flex-col sm:flex-row items-start gap-6 group">
                    
                    {/* Timestamp (Desktop left side, Mobile top) */}
                    <div className="hidden sm:block w-24 text-right shrink-0 pt-3">
                      <span className="text-xs font-mono font-bold text-neutral-500">{timeStr}</span>
                    </div>

                    {/* Timeline Node */}
                    <div className="absolute -left-2 top-3 sm:static sm:top-auto flex flex-col items-center shrink-0">
                      <div className={`w-8 h-8 rounded-full border-4 border-[#050505] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${config.nodeColor}`}>
                        <div className="text-black scale-75">{config.icon}</div>
                      </div>
                    </div>

                    {/* Violation Card */}
                    <div className={`flex-1 w-full bg-neutral-900/60 backdrop-blur-sm hover:bg-neutral-800/80 transition-colors rounded-2xl p-5 border border-white/5 hover:border-white/10 ml-8 sm:ml-0`}>
                      
                      {/* Mobile Timestamp */}
                      <div className="sm:hidden mb-2">
                        <span className="text-xs font-mono font-bold text-neutral-500 flex items-center gap-1.5">
                          <Clock size={12} /> {timeStr}
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${config.color}`}>
                            {config.label}
                          </span>
                          {v.action === "terminate" && (
                            <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-md border text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse">
                              Auto-Terminated
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-neutral-300 leading-relaxed">
                        {v.reason || "System flagged anomalous behavior during the session."}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* --- WARNING FOOTER --- */}
      {summary.terminations > 0 && (
        <div className="flex items-start gap-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <div className="p-2 bg-rose-500/10 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h4 className="text-base font-bold text-rose-400 mb-1">Session Auto-Terminated</h4>
            <p className="text-sm text-rose-300/70 leading-relaxed max-w-3xl">
              This interview was forcibly closed by the automated proctoring system due to high-severity integrity violations. 
              Review the forensic timeline above for specific timestamped evidence.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}