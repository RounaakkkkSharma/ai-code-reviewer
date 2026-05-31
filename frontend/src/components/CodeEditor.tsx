"use client";

import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { Extension } from "@codemirror/state";

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: string;
}

const baseTheme = EditorView.theme({
  "&": { fontSize: "13px" },
  ".cm-scroller": {
    fontFamily:
      "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  },
});

/** Returns the correct CodeMirror language extension for a given language string. */
function getExtensions(language: string): Extension[] {
  switch (language) {
    case "javascript":
      return [javascript({ typescript: false })];
    case "typescript":
      return [javascript({ typescript: true })];
    case "python":
      return [python()];
    case "java":
      return [java()];
    case "cpp":
    case "c":
      return [cpp()];
    default:
      // rust, go, and "auto" fall back gracefully with no syntax highlighting
      return [];
  }
}

export default function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
      <CodeMirror
        value={value}
        minHeight="300px"
        maxHeight="480px"
        extensions={[...getExtensions(language), baseTheme]}
        onChange={onChange}
        theme="light"
        placeholder={`// Paste your ${language === "auto" ? "code" : language} here…`}
      />
    </div>
  );
}
