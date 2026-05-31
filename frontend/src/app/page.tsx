"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import InputSelector from "@/components/InputSelector";
import LanguageSelector from "@/components/LanguageSelector";
import CodeEditor from "@/components/CodeEditor";
import PRInput from "@/components/PRInput";
import ReviewProgress from "@/components/ReviewProgress";
import { useReview } from "@/hooks/useReview";
import { SupportedLanguage } from "@/types";
import {
  Bot,
  ArrowRight,
  Bug,
  Shield,
  Zap,
  Paintbrush,
  GitBranch,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  { icon: Bug, label: "Bug Detection", color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
  { icon: Shield, label: "Security Audit", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
  { icon: Zap, label: "Performance", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
  { icon: Paintbrush, label: "Code Style", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
];

export default function Home() {
  const router = useRouter();
  const [inputType, setInputType] = useState<"snippet" | "pr">("snippet");

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("auto");
  const [context, setContext] = useState("");

  const [prUrl, setPrUrl] = useState("");
  const [prValid, setPrValid] = useState(false);
  const [prContext, setPrContext] = useState("");

  const [reviewMode, setReviewMode] = useState<"fast" | "deep">("deep");
  const [categories, setCategories] = useState<string[]>(["bug", "security", "performance", "style"]);

  const { submitSnippet, submitPR, agentStatuses, currentStage, reviewId, isStreaming, error } =
    useReview();

  React.useEffect(() => {
    if (reviewId) router.push(`/review/${reviewId}`);
  }, [reviewId, router]);

  const handleSubmit = async () => {
    if (inputType === "snippet") {
      if (!code.trim()) return;
      await submitSnippet(code, language, context, reviewMode, categories);
    } else {
      if (!prValid) return;
      await submitPR(prUrl, prContext, reviewMode, categories);
    }
  };

  const isSubmitDisabled =
    isStreaming || (inputType === "snippet" ? !code.trim() : !prValid);

  return (
    <main className="min-h-screen hero-bg">
      {/* ── Subtle grid overlay ── */}
      <div className="fixed inset-0 grid-pattern opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* ── Hero header ── */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
              <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 p-4 rounded-2xl shadow-xl shadow-indigo-200">
                <Bot className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-600 tracking-widest uppercase">
              AI Code Review
            </span>
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4">
            <span className="gradient-text">ReviewAI</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-lg mx-auto">
            Your senior engineer, available{" "}
            <span className="text-slate-700 font-semibold">24/7</span>
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {FEATURES.map(({ icon: Icon, label, color, bg, border }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${bg} ${border} ${color}`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Main card ── */}
        {!isStreaming ? (
          <div className="animate-scale-in">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 overflow-hidden">

              {/* Card header */}
              <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-0">
                <InputSelector value={inputType} onChange={setInputType} />
              </div>

              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-6">
                {/* Error banner */}
                {error && (
                  <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm animate-slide-down">
                    <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-red-600 font-bold text-xs">!</span>
                    </div>
                    <div>
                      <strong className="font-semibold">Error: </strong>
                      {error}
                    </div>
                  </div>
                )}

                {inputType === "snippet" ? (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-slate-800">
                        Paste your code snippet
                      </h2>
                      <LanguageSelector value={language} onChange={setLanguage} />
                    </div>

                    <CodeEditor value={code} onChange={setCode} language={language} />

                    <div>
                      <label
                        htmlFor="context"
                        className="block text-sm font-medium text-slate-600 mb-1.5"
                      >
                        Context{" "}
                        <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        id="context"
                        rows={2}
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50 shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-sm p-3 text-slate-700 placeholder-slate-400 transition-all outline-none resize-none"
                        placeholder="What is this code supposed to do? Any specific concerns?"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-1">
                      <GitBranch className="h-4 w-4 text-slate-600" />
                      <h2 className="text-base font-semibold text-slate-800">
                        GitHub Pull Request URL
                      </h2>
                    </div>
                    <PRInput
                      value={prUrl}
                      onChange={setPrUrl}
                      isValid={prValid}
                      setIsValid={setPrValid}
                    />
                    <div>
                      <label
                        htmlFor="prContext"
                        className="block text-sm font-medium text-slate-600 mb-1.5"
                      >
                        Context{" "}
                        <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        id="prContext"
                        rows={2}
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50 shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-sm p-3 text-slate-700 placeholder-slate-400 transition-all outline-none resize-none"
                        placeholder="Any specific focus areas for this PR?"
                        value={prContext}
                        onChange={(e) => setPrContext(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* --- Review Settings Panel --- */}
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Mode selector */}
                    <div>
                      <span className="block text-sm font-semibold text-slate-700 mb-2">Review Speed & Depth</span>
                      <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setReviewMode("fast")}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            reviewMode === "fast"
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Fast Review (Instant)
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewMode("deep")}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            reviewMode === "deep"
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Deep Review (Multi-Agent)
                        </button>
                      </div>
                    </div>

                    {/* Description of current mode */}
                    <div className="flex-1 text-xs text-slate-400 sm:mt-6 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {reviewMode === "fast" ? (
                        <p>⚡ <strong>Fast Mode:</strong> Runs all selected checks in a single LLM call. Takes <strong>~10-15 seconds</strong>. Perfect for quick local runs.</p>
                      ) : (
                        <p>🧠 <strong>Deep Mode:</strong> Runs 4 specialized LLM agents in parallel and merges findings. Takes <strong>~1-2 minutes</strong>. High precision.</p>
                      )}
                    </div>
                  </div>

                  {/* Category toggles */}
                  <div>
                    <span className="block text-sm font-semibold text-slate-700 mb-2.5">Select Analysis Dimensions</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: "bug", label: "Bugs & Logic", color: "border-red-100 hover:border-red-300 text-red-700 bg-red-50/50" },
                        { id: "security", label: "Security Audit", color: "border-orange-100 hover:border-orange-300 text-orange-700 bg-orange-50/50" },
                        { id: "performance", label: "Performance", color: "border-amber-100 hover:border-amber-300 text-amber-700 bg-amber-50/50" },
                        { id: "style", label: "Code Style", color: "border-blue-100 hover:border-blue-300 text-blue-700 bg-blue-50/50" },
                      ].map(({ id, label, color }) => {
                        const isSelected = categories.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setCategories((prev) => {
                                if (isSelected) {
                                  // Keep at least one selected
                                  if (prev.length === 1) return prev;
                                  return prev.filter((c) => c !== id);
                                } else {
                                  return [...prev, id];
                                }
                              });
                            }}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                              isSelected
                                ? `${color} border-current ring-1 ring-current shadow-sm`
                                : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-current" : "bg-slate-300"}`} />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="mt-7 flex justify-center">
                  <button
                    id="submit-review-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitDisabled}
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white rounded-xl overflow-hidden transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%)",
                    }}
                  >
                    <span className="relative z-10">Review My Code</span>
                    <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-slate-400 mt-4">
              Powered by{" "}
              <span className="font-semibold text-slate-500">LangGraph</span>{" "}
              parallel agents · Runs fully local with Ollama
            </p>
          </div>
        ) : (
          <div className="animate-scale-in">
            <ReviewProgress statuses={agentStatuses} stage={currentStage} reviewMode={reviewMode} />
          </div>
        )}
      </div>
    </main>
  );
}
