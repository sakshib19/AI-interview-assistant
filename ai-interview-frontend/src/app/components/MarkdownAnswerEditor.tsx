"use client";
import React, { useState } from 'react';
import { Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
    value: string;
    onChange: (val: string) => void;
}

export const MarkdownAnswerEditor = ({ value, onChange }: Props) => {
    const [preview, setPreview] = useState(false);

    return (
        <div className="relative group">
            <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Edit3 size={14} /> Your Answer
                </label>
                <button 
                    type="button"
                    onClick={() => setPreview(!preview)} 
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                >
                    {preview ? <><Edit3 size={12}/> Edit</> : <><Eye size={12}/> Preview</>}
                </button>
            </div>

            <div className="relative rounded-xl border-2 border-slate-300 bg-white overflow-hidden min-h-[300px]">
                {preview ? (
                    <div className="w-full p-5 prose prose-sm max-w-none h-[300px] overflow-y-auto bg-slate-50">
                        {value.trim() ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
                        ) : (
                            <span className="text-slate-400 italic">Nothing to preview yet...</span>
                        )}
                    </div>
                ) : (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Type your answer here (Markdown supported)..."
                        rows={12}
                        className="w-full p-5 text-base text-slate-800 outline-none resize-none bg-transparent h-[300px]"
                    />
                )}
            </div>
        </div>
    );
};