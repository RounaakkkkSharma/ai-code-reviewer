import React, { useState } from 'react';
import { Finding } from '@/types';
import { getSeverityColor } from '@/lib/utils';
import SuggestedFix from './SuggestedFix';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
}

export default function FindingCard({ finding }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-4 transition-shadow hover:shadow-md">
      <div className="p-5 flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-none">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${getSeverityColor(finding.severity)}`}>
            {finding.severity}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-700 ml-2 border border-slate-200">
            {finding.category}
          </span>
        </div>
        
        <div className="flex-grow">
          <h3 className="text-base font-semibold text-slate-900 leading-snug">
            {finding.title}
            <span className="ml-2 text-sm font-normal text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
              {finding.line_reference}
            </span>
          </h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {finding.description}
          </p>
          
          {finding.suggested_fix && (
            <div className="mt-4">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                {expanded ? "Hide suggested fix" : "View suggested fix"}
              </button>
              
              {expanded && (
                <SuggestedFix
                  originalCode={finding.suggested_fix.original_code}
                  fixedCode={finding.suggested_fix.fixed_code}
                  explanation={finding.suggested_fix.explanation}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
