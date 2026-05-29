"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reviewApi } from '@/lib/api';
import { ReviewResult } from '@/types';
import SummaryPanel from '@/components/SummaryPanel';
import FindingCard from '@/components/FindingCard';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';

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
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || "Failed to fetch review");
      } finally {
        setLoading(false);
      }
    };
    
    if (reviewId) fetchReview();
  }, [reviewId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <span className="ml-3 text-lg font-medium text-slate-700">Loading results...</span>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full">
          <div className="text-red-500 mb-4 flex justify-center">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Review Not Found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Code Review Results</h1>
        </div>

        <SummaryPanel 
          score={result.overall_score} 
          verdict={result.overall_verdict} 
          summaries={result.category_summaries} 
        />

        {result.top_recommendations && result.top_recommendations.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center">
              <span className="bg-indigo-200 text-indigo-800 w-6 h-6 rounded-full flex justify-center items-center text-sm mr-2 font-bold">!</span>
              Top Recommendations
            </h3>
            <ul className="space-y-2">
              {result.top_recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-indigo-600 font-bold mr-2 mt-0.5">{idx + 1}.</span>
                  <span className="text-indigo-800 font-medium">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Findings</h2>
          {result.findings && result.findings.length > 0 ? (
            <div className="space-y-4">
              {result.findings.map(finding => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">No issues found!</p>
              <p className="text-slate-500 mt-1">The code looks clean and follows best practices.</p>
            </div>
          )}
        </div>

        {result.positive_aspects && result.positive_aspects.length > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              What you did well
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.positive_aspects.map((aspect, idx) => (
                <li key={idx} className="flex items-start bg-white p-3 rounded-lg border border-green-100">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm text-green-800">{aspect}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
