import React from 'react';
import { SupportedLanguage } from '@/types';

interface LanguageSelectorProps {
  value: SupportedLanguage;
  onChange: (val: SupportedLanguage) => void;
}

const LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
];

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="language-select" className="text-sm font-medium text-slate-700">Language:</label>
      <select
        id="language-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SupportedLanguage)}
        className="block w-40 rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 bg-white border shadow-sm"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
