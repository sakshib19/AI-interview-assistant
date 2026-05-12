"use client";

import { DiffEditor } from "@monaco-editor/react";

interface CodeDiffViewerProps {
  userCode: string;
  optimalCode: string;
  language?: string;
  className?: string; // Added to allow external layout control
}

export const CodeDiffViewer = ({ 
  userCode, 
  optimalCode, 
  language = "python",
  className = ""
}: CodeDiffViewerProps) => {
  return (
    <div className={`flex flex-col h-[400px] border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm mt-4 bg-white ${className}`}>
      {/* Header Bar */}
      <div className="bg-slate-50 px-4 py-2 flex justify-between items-center text-xs font-semibold text-slate-600 border-b border-slate-200 select-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" aria-hidden="true" />
          <span>Your Solution</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Optimal Solution</span>
          <div className="w-2 h-2 rounded-full bg-[#28c840]" aria-hidden="true" />
        </div>
      </div>
      
      {/* Diff Editor Container */}
      <div className="flex-1 relative">
        <DiffEditor
          height="100%"
          language={language}
          original={userCode}
          modified={optimalCode}
          theme="light"
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            fontFamily: "var(--font-mono, monospace)", // Hook into your project's mono font
            padding: { top: 16, bottom: 16 },
            originalEditable: false,
            // Removes the clutter of inline suggestions in a diff view
            suggest: { showWords: false }, 
          }}
          loading={
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
};