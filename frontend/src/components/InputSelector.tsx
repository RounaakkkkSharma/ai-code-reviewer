"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface InputSelectorProps {
  value: 'snippet' | 'pr';
  onChange: (val: 'snippet' | 'pr') => void;
}

export default function InputSelector({ value, onChange }: InputSelectorProps) {
  return (
    <div className="flex bg-slate-100 p-1 rounded-lg w-fit mx-auto mb-6">
      <button
        type="button"
        onClick={() => onChange('snippet')}
        className={cn(
          "px-6 py-2 rounded-md font-medium text-sm transition-all duration-200",
          value === 'snippet' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
        )}
      >
        Paste Code Snippet
      </button>
      <button
        type="button"
        onClick={() => onChange('pr')}
        className={cn(
          "px-6 py-2 rounded-md font-medium text-sm transition-all duration-200",
          value === 'pr' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
        )}
      >
        GitHub PR URL
      </button>
    </div>
  );
}
