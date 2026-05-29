"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import InputSelector from '@/components/InputSelector';
import LanguageSelector from '@/components/LanguageSelector';
import CodeEditor from '@/components/CodeEditor';
import PRInput from '@/components/PRInput';
import ReviewProgress from '@/components/ReviewProgress';
import { useReview } from '@/hooks/useReview';
import { SupportedLanguage } from '@/types';
import { Bot, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [inputType, setInputType] = useState<'snippet' | 'pr'>('snippet');
  
  // Snippet state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('auto');
  const [context, setContext] = useState('');
  
  // PR state
  const [prUrl, setPrUrl] = useState('');
  const [prValid, setPrValid] = useState(false);
  const [prContext, setPrContext] = useState('');
  
  const { submitSnippet, submitPR, agentStatuses, currentStage, reviewId, isStreaming, error } = useReview();

  // Watch for completion
  React.useEffect(() => {
    if (reviewId) {
      router.push(`/review/${reviewId}`);
    }
  }, [reviewId, router]);

  const handleSubmit = async () => {
    if (inputType === 'snippet') {
      if (!code.trim()) return;
      await submitSnippet(code, language, context);
    } else {
      if (!prValid) return;
      await submitPR(prUrl, prContext);
    }
  };

  const isSubmitDisabled = isStreaming || (inputType === 'snippet' ? !code.trim() : !prValid);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
              <Bot className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">ReviewAI</h1>
          <p className="text-lg text-slate-600 font-medium">Your senior engineer, available 24/7.</p>
        </div>

        {!isStreaming ? (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm transition-all">
            <InputSelector value={inputType} onChange={setInputType} />
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {inputType === 'snippet' ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-slate-800">Code Snippet</h2>
                  <LanguageSelector value={language} onChange={setLanguage} />
                </div>
                <CodeEditor value={code} onChange={setCode} language={language} />
                
                <div>
                  <label htmlFor="context" className="block text-sm font-medium text-slate-700 mb-1">Context (Optional)</label>
                  <textarea
                    id="context"
                    rows={3}
                    className="block w-full rounded-md border-slate-300 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
                    placeholder="What is this code supposed to do?"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PRInput value={prUrl} onChange={setPrUrl} isValid={prValid} setIsValid={setPrValid} />
                <div className="max-w-2xl mx-auto">
                  <label htmlFor="prContext" className="block text-sm font-medium text-slate-700 mb-1">Context (Optional)</label>
                  <textarea
                    id="prContext"
                    rows={3}
                    className="block w-full rounded-md border-slate-300 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
                    placeholder="Any specific focus areas for this PR?"
                    value={prContext}
                    onChange={(e) => setPrContext(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="group flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                Review My Code
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in duration-500">
             <ReviewProgress statuses={agentStatuses} stage={currentStage} />
          </div>
        )}
      </div>
    </main>
  );
}
