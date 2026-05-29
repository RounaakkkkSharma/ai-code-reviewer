import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@uiw/codemirror-extensions-langs';
import { python } from '@uiw/codemirror-extensions-langs';
import { java } from '@uiw/codemirror-extensions-langs';
import { cpp } from '@uiw/codemirror-extensions-langs';
import { rust } from '@uiw/codemirror-extensions-langs';
import { go } from '@uiw/codemirror-extensions-langs';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: string;
}

export default function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const getExtensions = () => {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return [javascript({ typescript: language === 'typescript' })];
      case 'python':
        return [python()];
      case 'java':
        return [java()];
      case 'cpp':
        return [cpp()];
      case 'rust':
        return [rust()];
      case 'go':
        return [go()];
      default:
        return [];
    }
  };

  return (
    <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
      <CodeMirror
        value={value}
        minHeight="300px"
        maxHeight="500px"
        extensions={getExtensions()}
        onChange={onChange}
        theme="light"
        className="text-sm"
      />
    </div>
  );
}
