"use client";

import { AlertCircle, CheckCircle2, Lightbulb, MinusCircle } from "lucide-react";
import { DetailedRound } from "../page";

type RoundKey = "screening" | "technical" | "behavioral";

type Props = {
  rounds: Partial<Record<RoundKey, DetailedRound>>;
};

const roundLabels: Record<RoundKey, string> = {
  screening: "Screening",
  technical: "Technical",
  behavioral: "Behavioral",
};

function getStatusStyles(status: DetailedRound["status"]) {
  if (status === "Pass") {
    return {
      icon: <CheckCircle2 className="w-4 h-4" />,
      className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    };
  }

  if (status === "Weak") {
    return {
      icon: <MinusCircle className="w-4 h-4" />,
      className: "text-[#cbe557] bg-[#cbe557]/10 border-[#cbe557]/20",
    };
  }

  return {
    icon: <AlertCircle className="w-4 h-4" />,
    className: "text-red-400 bg-red-400/10 border-red-400/20",
  };
}

export default function RoundWiseAnalysis({ rounds }: Props) {
  const entries = (Object.keys(roundLabels) as RoundKey[])
    .map((key) => [key, rounds[key]] as const)
    .filter((entry): entry is readonly [RoundKey, DetailedRound] => Boolean(entry[1]));

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-neutral-900/30 p-8 text-center">
        <p className="text-sm text-neutral-500">No round-wise analysis available for this session.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {entries.map(([roundName, round]) => {
        const status = getStatusStyles(round.status);
        const scorePercent = Math.round(round.score * 100);

        return (
          <article
            key={roundName}
            className="rounded-xl border border-white/10 bg-neutral-950/40 p-5 space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">{roundLabels[roundName]} Round</h3>
                <p className="mt-1 text-sm text-neutral-400">{round.feedback}</p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-black ${status.className}`}>
                {status.icon}
                {round.status}
              </span>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-neutral-400">
                <span>Score</span>
                <span className="text-white">{scorePercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800">
                <div
                  className="h-2 rounded-full bg-[#cbe557] transition-all"
                  style={{ width: `${Math.max(0, Math.min(scorePercent, 100))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ListBlock title="Strengths" items={round.strengths} tone="emerald" />
              <ListBlock title="Areas to Improve" items={round.weaknesses} tone="red" />
            </div>

            <div className="rounded-lg border border-indigo-400/20 bg-indigo-400/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-300">
                <Lightbulb className="w-4 h-4" />
                Recommendation
              </div>
              <p className="text-sm leading-relaxed text-neutral-300">{round.recommendation}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ListBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "red";
}) {
  const titleClass = tone === "emerald" ? "text-emerald-400" : "text-red-400";

  return (
    <div>
      <p className={`mb-2 text-xs font-black uppercase tracking-wider ${titleClass}`}>{title}</p>
      {items.length > 0 ? (
        <ul className="space-y-2 text-sm text-neutral-300">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-neutral-600">Not available</p>
      )}
    </div>
  );
}
