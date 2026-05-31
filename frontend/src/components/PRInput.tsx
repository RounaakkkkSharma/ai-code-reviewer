"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PRInputProps {
  value: string;
  onChange: (val: string) => void;
  isValid: boolean;
  setIsValid: (valid: boolean) => void;
}

export default function PRInput({ value, onChange, isValid, setIsValid }: PRInputProps) {
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const pattern = /^https:\/\/github\.com\/[\w\-]+\/[\w\-]+\/pull\/\d+$/;
    setIsValid(pattern.test(value));
  }, [value, setIsValid]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2">
      <label htmlFor="pr-url" className="block text-sm font-medium text-slate-700">
        GitHub Pull Request URL
      </label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <input
          type="text"
          id="pr-url"
          className="block w-full rounded-md border-slate-300 py-3 pl-4 pr-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border"
          placeholder="https://github.com/owner/repo/pull/42"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {value.length > 0 && isValid && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {value.length > 0 && !isValid && touched && <XCircle className="h-5 w-5 text-red-500" />}
        </div>
      </div>
      {!isValid && touched && value.length > 0 && (
        <p className="text-sm text-red-600">Must be a valid GitHub PR URL.</p>
      )}
    </div>
  );
}
