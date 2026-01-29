"use client";

import { SessionDetail } from "../page";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ArrowDown, 
  Lock,
  Target, 
  BrainCircuit, 
  MessageSquare 
} from "lucide-react";

export default function RoundWiseProgress({
  rounds,
}: {
  rounds: SessionDetail["rounds"];
}) {
  const roundTypes = [
    { 
      key: "screening" as const, 
      label: "Screening", 
      icon: <Target size={18} />,
      description: "Initial Fit Assessment"
    },
    { 
      key: "technical" as const, 
      label: "Technical", 
      icon: <BrainCircuit size={18} />,
      description: "Code & System Design"
    },
    { 
      key: "behavioral" as const, 
      label: "Behavioral", 
      icon: <MessageSquare size={18} />,
      description: "Culture & Soft Skills"
    },
  ];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Pass":
        return {
          wrapper: "bg-emerald-500/[0.05] border-emerald-500/20 shadow-[0_0_30px_-15px_rgba(16,185,129,0.3)]",
          iconColor: "text-emerald-400",
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          statusIcon: <CheckCircle2 className="w-4 h-4" />
        };
      case "Weak":
        return {
          wrapper: "bg-amber-500/[0.05] border-amber-500/20 shadow-[0_0_30px_-15px_rgba(245,158,11,0.3)]",
          iconColor: "text-amber-400",
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          statusIcon: <AlertCircle className="w-4 h-4" />
        };
      case "Failed":
        return {
          wrapper: "bg-red-500/[0.05] border-red-500/20 shadow-[0_0_30px_-15px_rgba(239,68,68,0.3)]",
          iconColor: "text-red-400",
          badge: "bg-red-500/10 text-red-400 border-red-500/20",
          statusIcon: <XCircle className="w-4 h-4" />
        };
      default:
        return {
          wrapper: "bg-neutral-900/40 border-white/5",
          iconColor: "text-neutral-500",
          badge: "bg-white/5 text-neutral-400 border-white/10",
          statusIcon: <Lock className="w-3 h-3" />
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-400";
    if (score >= 0.6) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        {roundTypes.map((roundType, index) => {
          const round = rounds[roundType.key];
          const isCompleted = !!round;
          const status = round?.status || "Locked";
          const styles = getStatusStyles(status);

          return (
            <div key={roundType.key} className="relative group">
              {/* Vertical Connector Line */}
              {index < roundTypes.length - 1 && (
                <div className="absolute left-[24px] top-12 bottom-[-16px] w-[2px] bg-white/5 z-0 group-hover:bg-white/10 transition-colors" />
              )}

              <div className={`
                relative z-10 flex items-center justify-between p-4 rounded-xl border backdrop-blur-md transition-all duration-300
                ${styles.wrapper} hover:bg-white/[0.02]
              `}>
                <div className="flex items-center gap-4">
                  {/* Icon Box */}
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center border shrink-0 bg-neutral-950/50
                    ${isCompleted ? styles.iconColor : "text-neutral-600 border-white/5"} 
                    ${isCompleted ? `border-${styles.iconColor.split('-')[1]}-500/30` : ""}
                  `}>
                    {roundType.icon}
                  </div>

                  {/* Text Content */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold ${isCompleted ? "text-neutral-200" : "text-neutral-500"}`}>
                        {roundType.label}
                      </h3>
                      {!isCompleted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/5 bg-white/5 text-neutral-500 font-medium uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">
                      {roundType.description}
                    </p>
                  </div>
                </div>

                {/* Right Side: Score or Status */}
                {isCompleted ? (
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-1">
                       <span className={`text-2xl font-black tracking-tighter ${getScoreColor(round.averageScore)}`}>
                        {(round.averageScore * 100).toFixed(0)}%
                       </span>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles.badge}`}>
                      {styles.statusIcon}
                      {status}
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center opacity-20">
                     <Lock size={16} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="grid grid-cols-3 gap-2 mt-2">
         {roundTypes.map(type => {
            const r = rounds[type.key];
            return (
                <div key={type.key} className="bg-white/[0.02] border border-white/5 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">{type.label.substring(0,3)}</p>
                    <p className={`text-xs font-bold ${r ? 'text-neutral-300' : 'text-neutral-700'}`}>
                        {r ? `${(r.averageScore * 100).toFixed(0)}%` : '--'}
                    </p>
                </div>
            )
         })}
      </div>
    </div>
  );
}