"use client";

type RoundData = {
  score?: number;
  feedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendation?: string;
};

export default function RoundSummaryPanel({ roundSummaries }: { roundSummaries: Record<string, RoundData> }) {
  if (!roundSummaries) {
    return (
      <p className="text-gray-500 text-sm italic">No round analysis available.</p>
    );
  }

  const rounds = Object.entries(roundSummaries);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {rounds.map(([roundName, data]) => (
        <div
          key={roundName}
          className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 space-y-4"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold capitalize text-white">
              {roundName} Round
            </h3>
            {typeof data.score === "number" && (
              <span className="text-sm font-semibold text-blue-400">
                {(data.score * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {/* Score Bar */}
          {typeof data.score === "number" && (
            <div className="w-full bg-gray-600 h-2 rounded-full">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${data.score * 100}%` }}
              />
            </div>
          )}

          {/* Feedback */}
          {data.feedback && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Feedback</p>
              <p className="text-gray-200 text-sm leading-relaxed">
                {data.feedback}
              </p>
            </div>
          )}

          {/* Strengths */}
          {data.strengths?.length ? (
            <div>
              <p className="text-sm text-green-400 mb-1 font-medium">Strengths</p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Weaknesses */}
          {data.weaknesses?.length ? (
            <div>
              <p className="text-sm text-red-400 mb-1 font-medium">Areas to Improve</p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                {data.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Recommendation */}
          {data.recommendation && (
            <div>
              <p className="text-sm text-indigo-400 mb-1 font-medium">AI Recommendation</p>
              <p className="text-gray-300 text-sm">{data.recommendation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
