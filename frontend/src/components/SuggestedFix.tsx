import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface SuggestedFixProps {
  originalCode: string;
  fixedCode: string;
  explanation: string;
}

export default function SuggestedFix({ originalCode, fixedCode, explanation }: SuggestedFixProps) {
  return (
    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-white border-b border-slate-200">
        <h4 className="text-sm font-semibold text-slate-800 mb-1">Why this fix?</h4>
        <p className="text-sm text-slate-600">{explanation}</p>
      </div>
      
      <div className="p-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <div className="bg-red-50/30 relative">
          <div className="absolute top-0 right-0 bg-red-100 text-red-700 text-xs px-2 py-1 font-mono font-bold rounded-bl-lg">BEFORE</div>
          <SyntaxHighlighter
            language="javascript" // generic highlighting works fine
            style={vs}
            customStyle={{ margin: 0, padding: '2.5rem 1rem 1rem 1rem', background: 'transparent' }}
            wrapLines={true}
            lineProps={{ style: { backgroundColor: 'rgba(239, 68, 68, 0.1)' } }}
          >
            {originalCode}
          </SyntaxHighlighter>
        </div>
        
        <div className="bg-green-50/30 relative">
          <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-xs px-2 py-1 font-mono font-bold rounded-bl-lg">AFTER</div>
          <SyntaxHighlighter
            language="javascript"
            style={vs}
            customStyle={{ margin: 0, padding: '2.5rem 1rem 1rem 1rem', background: 'transparent' }}
            wrapLines={true}
            lineProps={{ style: { backgroundColor: 'rgba(34, 197, 94, 0.1)' } }}
          >
            {fixedCode}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
