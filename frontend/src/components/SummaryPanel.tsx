import React from 'react';
import { CategorySummary } from '@/types';

interface SummaryPanelProps {
  score: number;
  verdict: string;
  summaries: CategorySummary[];
}

export default function SummaryPanel({ score, verdict, summaries }: SummaryPanelProps) {
  let scoreColor = 'text-green-500 border-green-500';
  let scoreBg = 'bg-green-50';
  if (score < 60) {
    scoreColor = 'text-red-500 border-red-500';
    scoreBg = 'bg-red-50';
  } else if (score < 80) {
    scoreColor = 'text-amber-500 border-amber-500';
    scoreBg = 'bg-amber-50';
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'bug': return 'bg-red-500';
      case 'security': return 'bg-orange-500';
      case 'performance': return 'bg-amber-500';
      case 'style': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
      <div className="col-span-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0">
        <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center ${scoreColor} ${scoreBg}`}>
          <span className="text-4xl font-bold">{score}</span>
        </div>
        <p className="mt-4 text-center text-sm font-medium text-slate-700 px-4">{verdict}</p>
      </div>
      
      <div className="col-span-1 md:col-span-2 flex flex-col justify-center space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Category Breakdown</h3>
        {summaries.map((summary) => (
          <div key={summary.category} className="flex flex-col space-y-1">
            <div className="flex justify-between text-sm font-medium text-slate-700">
              <span className="capitalize">{summary.category}</span>
              <div className="flex space-x-3 text-slate-500">
                <span>{summary.finding_count} findings</span>
                {summary.critical_count > 0 && <span className="text-red-600 font-bold">{summary.critical_count} critical</span>}
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full ${getCategoryColor(summary.category)}`}
                style={{ width: `${summary.score}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
