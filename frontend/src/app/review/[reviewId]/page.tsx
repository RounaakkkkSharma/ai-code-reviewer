"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { reviewApi } from "@/lib/api";
import { ReviewResult } from "@/types";
import SummaryPanel from "@/components/SummaryPanel";
import FindingCard from "@/components/FindingCard";
import {
  CheckCircle,
  Loader2,
  ArrowLeft,
  Bot,
  Sparkles,
  FileCode2,
  AlertCircle,
} from "lucide-react";

export default function ReviewResultsPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.reviewId as string;

  const [result, setResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const data = await reviewApi.getReview(reviewId);
        setResult(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch review results";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (reviewId) fetchReview();
  }, [reviewId]);

  if (loading) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse" />
            <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 p-4 rounded-full">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-700">Loading results…</p>
          <p className="text-sm text-slate-400 mt-1">Fetching your review</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen hero-bg flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-md w-full text-center animate-scale-in">
          <div className="flex justify-center mb-4">
            <div className="bg-red-50 p-4 rounded-full border border-red-100">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Review Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">{error ?? "The review ID was not found. It may have expired."}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const criticalCount = result.findings.filter((f) => f.severity === "critical").length;
  const highCount = result.findings.filter((f) => f.severity === "high").length;

  return (
    <div className="min-h-screen hero-bg">
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Top nav bar ── */}
        <div className="flex items-center justify-between mb-8 animate-slide-down">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 bg-white/80 backdrop-blur-sm text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-slate-200 shadow-sm hover:shadow"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-500" />
                <h1 className="text-xl font-bold text-slate-900">Code Review Report</h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {reviewId.slice(0, 8)}… · {result.language} · {result.review_duration_ms}ms
              </p>
            </div>
          </div>

          {/* Quick severity counters */}
          <div className="hidden sm:flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                {criticalCount} critical
              </span>
            )}
            {highCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold rounded-full">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                {highCount} high
              </span>
            )}
          </div>
        </div>

        {/* ── Summary panel (score ring + category bars) ── */}
        <div className="animate-slide-up mb-6">
          <SummaryPanel
            score={result.overall_score}
            verdict={result.overall_verdict}
            summaries={result.category_summaries}
          />
        </div>

        {/* ── Top recommendations ── */}
        {result.top_recommendations && result.top_recommendations.length > 0 && (
          <div className="animate-slide-up delay-100 mb-6">
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Top Recommendations
              </h3>
              <ol className="space-y-3">
                {result.top_recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-indigo-800 font-medium leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* ── Findings list ── */}
        <div className="animate-slide-up delay-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-slate-500" />
              Findings
              {result.findings.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                  {result.findings.length}
                </span>
              )}
            </h2>
          </div>

          {result.findings && result.findings.length > 0 ? (
            <div className="space-y-3">
              {result.findings.map((finding, idx) => (
                <div
                  key={finding.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <FindingCard finding={finding} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="bg-green-50 p-4 rounded-full border border-green-100">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
              </div>
              <p className="text-lg font-semibold text-slate-700">No issues found!</p>
              <p className="text-slate-400 text-sm mt-1">The code looks clean and well-written.</p>
            </div>
          )}
        </div>

        {/* ── Positive aspects ── */}
        {result.positive_aspects && result.positive_aspects.length > 0 && (
          <div className="animate-slide-up delay-300">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                What you did well
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.positive_aspects.map((aspect, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 bg-white/70 p-3 rounded-xl border border-emerald-100"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-emerald-800 leading-relaxed">{aspect}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
