"use client";

import React from "react";
import { AgentStatus } from "@/hooks/useReview";
import {
  Bug, ShieldAlert, Zap, Paintbrush,
  CheckCircle2, Loader2, Clock, Bot,
} from "lucide-react";

const AGENT_META: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}> = {
  bug_detector:         { label: "Bug Detector",        icon: Bug,        color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100" },
  security_analyzer:    { label: "Security Analyzer",   icon: ShieldAlert, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
  performance_analyzer: { label: "Performance",         icon: Zap,        color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100" },
  style_checker:        { label: "Style Checker",       icon: Paintbrush, color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100" },
};

interface ReviewProgressProps {
  statuses: AgentStatus[];
  stage: string;
  reviewMode?: "fast" | "deep";
}

export default function ReviewProgress({ statuses, stage, reviewMode = "deep" }: ReviewProgressProps) {
  const isFast = reviewMode === "fast";
  const completedCount = statuses.filter((a) => a.status === "complete").length;
  const progressPct = Math.round((completedCount / statuses.length) * 100);

  return (
    <div className="max-w-2xl mx-auto animate-scale-in">
      {/* ── Glass card ── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-30 animate-pulse" />
              <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl">
                <Bot className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isFast ? "Fast Review in Progress" : "Deep Review in Progress"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {stage || (isFast ? "Invoking unified review model..." : "Initializing parallel agents...")}
              </p>
            </div>
          </div>

          {/* Overall progress bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>
                {isFast
                  ? `${completedCount} of ${statuses.length} dimensions complete`
                  : `${completedCount} of ${statuses.length} agents complete`}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full progress-bar-fill"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Agent grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {statuses.map((agent, idx) => {
            const meta = AGENT_META[agent.name] ?? AGENT_META.bug_detector;
            const Icon = meta.icon;

            const isQueued   = agent.status === "queued";
            const isAnalyzing = agent.status === "analyzing";
            const isComplete  = agent.status === "complete";

            return (
              <div
                key={agent.name}
                className={`
                  flex items-center justify-between p-4 rounded-xl border transition-all duration-300
                  ${isComplete  ? "agent-complete bg-green-50/50"   : ""}
                  ${isAnalyzing ? "agent-analyzing bg-indigo-50/50" : ""}
                  ${isQueued    ? "bg-slate-50 border-slate-100"    : ""}
                `}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${meta.bg}`}>
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{meta.label}</p>
                    <p className="text-xs text-slate-400">
                      {isQueued    && "Waiting…"}
                      {isAnalyzing && "Analysing…"}
                      {isComplete  && `${agent.findingCount ?? 0} issue${agent.findingCount !== 1 ? "s" : ""} found`}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isQueued    && <Clock    className="h-4 w-4 text-slate-300" />}
                  {isAnalyzing && <Loader2  className="h-5 w-5 text-indigo-500 animate-spin" />}
                  {isComplete  && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-slate-400">
            {isFast ? (
              <>
                Unified reviewer runs in a{" "}
                <span className="font-semibold text-slate-500 font-mono">single-pass call</span>{" "}
                · Super-fast local evaluation
              </>
            ) : (
              <>
                All agents run{" "}
                <span className="font-semibold text-slate-500">in parallel</span>{" "}
                via LangGraph · Deep multi-perspective review
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
