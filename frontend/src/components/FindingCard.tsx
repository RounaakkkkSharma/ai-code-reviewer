"use client";

import React, { useState } from "react";
import { Finding } from "@/types";
import { ChevronDown, ChevronUp, Bug, Shield, Zap, Paintbrush } from "lucide-react";
import SuggestedFix from "./SuggestedFix";

interface FindingCardProps {
  finding: Finding;
}

const SEVERITY_STYLES: Record<string, { badge: string; border: string; dot: string }> = {
  critical: {
    badge: "bg-red-100 text-red-700 border-red-200",
    border: "border-severity-critical",
    dot:   "bg-red-500",
  },
  high: {
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    border: "border-severity-high",
    dot:   "bg-orange-500",
  },
  medium: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    border: "border-severity-medium",
    dot:   "bg-amber-500",
  },
  low: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    border: "border-severity-low",
    dot:   "bg-blue-500",
  },
  info: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    border: "border-severity-info",
    dot:   "bg-slate-400",
  },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  bug:         Bug,
  security:    Shield,
  performance: Zap,
  style:       Paintbrush,
};

const CATEGORY_COLORS: Record<string, string> = {
  bug:         "text-red-500 bg-red-50",
  security:    "text-orange-500 bg-orange-50",
  performance: "text-amber-500 bg-amber-50",
  style:       "text-blue-500 bg-blue-50",
};

export default function FindingCard({ finding }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);

  const sev = SEVERITY_STYLES[finding.severity] ?? SEVERITY_STYLES.info;
  const CategoryIcon = CATEGORY_ICONS[finding.category] ?? Bug;
  const catColor = CATEGORY_COLORS[finding.category] ?? "text-slate-500 bg-slate-50";

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden card-hover ${sev.border}`}
    >
      <div className="p-5">
        {/* ── Header row ── */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Severity badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${sev.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
            {finding.severity}
          </span>

          {/* Category badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${catColor}`}
          >
            <CategoryIcon className="h-3 w-3" />
            {finding.category}
          </span>

          {/* ID badge */}
          <span className="ml-auto text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            {finding.id}
          </span>
        </div>

        {/* ── Title + line ref ── */}
        <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-1.5">
          {finding.title}
          <span className="ml-2 text-xs font-normal text-slate-400 font-mono">
            {finding.line_reference}
          </span>
        </h3>

        {/* ── Description ── */}
        <p className="text-sm text-slate-600 leading-relaxed">{finding.description}</p>

        {/* Confidence bar */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-slate-400">Confidence</span>
          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full"
              style={{ width: `${finding.confidence}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-500">{finding.confidence}%</span>
        </div>

        {/* ── Suggested fix accordion ── */}
        {finding.suggested_fix && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              aria-expanded={expanded}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {expanded ? "Hide suggested fix" : "View suggested fix"}
            </button>

            {expanded && (
              <div className="mt-3 animate-slide-down">
                <SuggestedFix
                  originalCode={finding.suggested_fix.original_code}
                  fixedCode={finding.suggested_fix.fixed_code}
                  explanation={finding.suggested_fix.explanation}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
