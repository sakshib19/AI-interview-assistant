import { DiffEditor } from "@monaco-editor/react";

interface Props {
  userCode: string;
  optimalCode: string;
  language?: string;
}

export const CodeDiffViewer = ({ userCode, optimalCode, language = "python" }: Props) => {
  return (
    <div className="h-[400px] border-2 border-slate-200 rounded-xl overflow-hidden shadow-lg mt-4">
      <div className="bg-slate-100 p-2 flex justify-between text-xs font-bold text-slate-500 border-b border-slate-200">
        <span>Your Solution</span>
        <span>Optimal Solution</span>
      </div>
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
        }}
      />
    </div>
  );
};