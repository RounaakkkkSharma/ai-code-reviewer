"use client";

import React, { useEffect, useState } from "react";
import { CategorySummary } from "@/types";
import { Bug, Shield, Zap, Paintbrush } from "lucide-react";

interface SummaryPanelProps {
  score: number;
  verdict: string;
  summaries: CategorySummary[];
}

const CATEGORY_META: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; bar: string }
> = {
  bug:         { icon: Bug,        color: "text-red-600",    bg: "bg-red-50",    bar: "bg-red-500" },
  security:    { icon: Shield,     color: "text-orange-600", bg: "bg-orange-50", bar: "bg-orange-500" },
  performance: { icon: Zap,        color: "text-amber-600",  bg: "bg-amber-50",  bar: "bg-amber-500" },
  style:       { icon: Paintbrush, color: "text-blue-600",   bg: "bg-blue-50",   bar: "bg-blue-500" },
};

function ScoreRing({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  let ringColor = "#22c55e"; // green ≥ 80
  let glowColor = "rgba(34,197,94,0.2)";
  let textColor = "text-green-600";
  if (score < 60) {
    ringColor = "#ef4444";
    glowColor = "rgba(239,68,68,0.2)";
    textColor = "text-red-600";
  } else if (score < 80) {
    ringColor = "#f59e0b";
    glowColor = "rgba(245,158,11,0.2)";
    textColor = "text-amber-600";
  }

  const label = score >= 80 ? "Excellent" : score >= 60 ? "Needs Work" : "Critical Issues";

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative"
        style={{ filter: `drop-shadow(0 0 16px ${glowColor})` }}
      >
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          {/* Track */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="10"
          />
          {/* Progress */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>

        {/* Score text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold ${textColor}`}>{score}</span>
          <span className="text-xs font-medium text-slate-400">/100</span>
        </div>
      </div>

      <span className={`mt-2 text-sm font-semibold ${textColor}`}>{label}</span>
    </div>
  );
}

export default function SummaryPanel({ score, verdict, summaries }: SummaryPanelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">

        {/* ── Score ring ── */}
        <div className="flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-100">
          <ScoreRing score={score} />
          <p className="mt-4 text-center text-sm text-slate-600 font-medium leading-snug max-w-[180px]">
            {verdict}
          </p>
        </div>

        {/* ── Category bars ── */}
        <div className="md:col-span-2 p-6 sm:p-8 flex flex-col justify-center">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
            Category Breakdown
          </h3>

          <div className="space-y-4">
            {summaries.map((summary) => {
              const meta = CATEGORY_META[summary.category] ?? CATEGORY_META.bug;
              const Icon = meta.icon;

              return (
                <div key={summary.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-md ${meta.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 capitalize">
                        {summary.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{summary.score}/100</span>
                      <span>{summary.finding_count} finding{summary.finding_count !== 1 ? "s" : ""}</span>
                      {summary.critical_count > 0 && (
                        <span className="font-bold text-red-600">
                          {summary.critical_count} critical
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${meta.bar} progress-bar-fill`}
                      style={{ width: mounted ? `${summary.score}%` : "0%" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
