import React, { useState } from 'react';
import { X, Building2, Terminal, Code2, Briefcase } from 'lucide-react';

interface ConfigProps {
  onStart: (config: { role_title: string; company_style: string }) => void;
  onCancel: () => void;
}

export default function InterviewConfigModal({ onStart, onCancel }: ConfigProps) {
  const [role, setRole] = useState("Backend Engineer");
  const [style, setStyle] = useState("FAANG");

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Briefcase className="text-indigo-600" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Customize Interview</h2>
          <p className="text-slate-500 text-sm">Tell AI who it should be interviewing.</p>
        </div>
        
        {/* Role Selection */}
        <div className="mb-5">
          <label className="text-slate-700 text-sm font-bold mb-2 block">Target Role</label>
          <div className="relative">
            <Code2 className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none font-medium"
            >
              <option>Backend Engineer</option>
              <option>Frontend Engineer</option>
              <option>FullStack Developer</option>
              <option>DevOps Engineer</option>
              <option>Data Scientist</option>
              <option>Machine Learning Engineer</option>
            </select>
          </div>
        </div>

        {/* Style Selection */}
        <div className="mb-8">
          <label className="text-slate-700 text-sm font-bold mb-2 block">Company Style</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setStyle("FAANG")}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                style === "FAANG" 
                  ? "bg-indigo-50 border-indigo-600 text-indigo-700" 
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <Building2 size={24} />
              <div className="text-center">
                <span className="block font-bold text-sm">Big Tech</span>
                <span className="block text-[10px] opacity-75">Algorithms & Scale</span>
              </div>
            </button>

            <button 
              onClick={() => setStyle("STARTUP")}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                style === "STARTUP" 
                  ? "bg-emerald-50 border-emerald-600 text-emerald-700" 
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <Terminal size={24} />
              <div className="text-center">
                <span className="block font-bold text-sm">Startup</span>
                <span className="block text-[10px] opacity-75">Speed & Features</span>
              </div>
            </button>
          </div>
        </div>

        <button 
          onClick={() => onStart({ role_title: role, company_style: style })}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
        >
          Start Interview Session
        </button>
      </div>
    </div>
  );
}