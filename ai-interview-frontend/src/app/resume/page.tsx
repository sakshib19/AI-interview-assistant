"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  Upload, FileText, X, CheckCircle, Sparkles, Briefcase, GraduationCap,
  Mail, Phone, Award, Building, Loader2, Zap, Code, ChevronRight
} from "lucide-react";

// --- TYPES ---
type UploadStatus = "idle" | "uploading" | "success" | "error";

export type ParsedResume = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  skills?: string[];
  experience_years?: number | null;
  education?: Array<any>;
  experience?: Array<any>;
  projects?: Array<any>;
  summary?: string | null;
  file_url?: string | null;
  [k: string]: any;
};

type ResumeUploaderProps = {
  onReady?: (parsed: ParsedResume, fileUrl?: string | null) => void;
  onStart?: () => void;
};

export default function ResumeUploader(props: ResumeUploaderProps) {
  const { onReady, onStart } = props;
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "";
  const { token } = useAuth();

  // --- STATE ---
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_BYTES = 10 * 1024 * 1024;
  const ACCEPTED = [".pdf", ".docx", ".txt"];

  // --- HELPERS ---
  function formatFileSize(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  function validateFile(f: File | null) {
    if (!f) return "No file selected";
    const lower = f.name.toLowerCase();
    if (!ACCEPTED.some((ext) => lower.endsWith(ext)))
      return "Only PDF, DOCX or TXT files are allowed";
    if (f.size > MAX_BYTES) return "File exceeds 10 MB limit";
    return null;
  }

  const handleAuthCheck = () => {
    if (!token) {
      router.push("/Auth/login");
      return false;
    }
    return true;
  };

  // --- HANDLERS ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!handleAuthCheck()) return;

    const droppedFile = e.dataTransfer.files?.[0] ?? null;
    const v = validateFile(droppedFile);
    if (v) {
      setErrorMsg(v);
      return;
    }
    setFile(droppedFile);
    setUploadStatus("idle");
    setErrorMsg(null);
  };

  const handleFileSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const selectedFile = e.target.files?.[0] ?? null;
    const v = validateFile(selectedFile);
    if (v) {
      setErrorMsg(v);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(selectedFile);
    setUploadStatus("idle");
    setErrorMsg(null);
  };

  const handleRemove = () => {
    setFile(null);
    setUploadStatus("idle");
    setParsed(null);
    setProgress(0);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function handleUpload() {
    if (!handleAuthCheck()) return;
    if (!file) return;
    const v = validateFile(file);
    if (v) {
      setErrorMsg(v);
      return;
    }

    setUploadStatus("uploading");
    setProgress(0);
    setErrorMsg(null);

    let fakeProgressInterval: NodeJS.Timeout;
    if (file.size < 500000) {
       fakeProgressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
       }, 200);
    }

    try {
      const form = new FormData();
      form.append("file", file, file.name);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const endpoint = (API ? API.replace(/\/$/, "") : "") + "/process-resume";
        xhr.open("POST", endpoint);
        xhr.responseType = "json";

        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setProgress(pct);
          }
        };

        xhr.onload = () => {
          clearInterval(fakeProgressInterval);
          const status = xhr.status;
          let body: any = null;
          try {
            body = xhr.response ?? (xhr.responseText ? JSON.parse(xhr.responseText) : {});
          } catch (e) {
            body = { error: "Invalid JSON response from server" };
          }

          if (status >= 200 && status < 300) {
            setProgress(100);
            const parsedBody: ParsedResume = body.parsed ?? body;
            setTimeout(() => {
              setParsed(parsedBody);
              setUploadStatus("success");
              try {
                const fileUrl = parsedBody.file_url ?? parsedBody.resume_url ?? null;
                onReady?.(parsedBody, fileUrl);
              } catch (cbErr) {
                console.warn("onReady callback threw:", cbErr);
              }
              resolve();
            }, 600);
          } else {
            const msg = body?.error ?? JSON.stringify(body ?? { status: status });
            setErrorMsg(msg);
            setUploadStatus("error");
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => {
          clearInterval(fakeProgressInterval);
          setErrorMsg("Network error during upload");
          setUploadStatus("error");
          reject(new Error("Network error during upload"));
        };

        xhr.send(form);
      });
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
      setUploadStatus("error");
    }
  }

  // --- SAFE RENDER HELPER ---
  function safeRender(value: any): React.ReactNode {
    if (value === null || value === undefined) return null;
    if (React.isValidElement(value)) return value;
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean") return value;
    if (Array.isArray(value)) return value.map((v, i) => <React.Fragment key={i}>{safeRender(v)}</React.Fragment>);
    try {
      if (typeof value === "object") {
        if (value.name && typeof value.name === "string") return value.name;
        if (value.title && typeof value.title === "string") return value.title;
        if (value.company && typeof value.company === "string") return value.company;
        return JSON.stringify(value, Object.keys(value).slice(0, 3));
      }
    } catch (e) {
      return String(value);
    }
    return String(value);
  }

  // --- RENDER SECTIONS ---
  function renderEducation(edu?: Array<any>) {
    if (!edu || !Array.isArray(edu) || edu.length === 0) return null;
    return (
      <div className="space-y-3">
        {edu.map((e, idx) => {
          if (typeof e === "object" && e !== null) {
            const institution = typeof e.institution === "string" ? e.institution : (e.school || "Unknown");
            const degree = typeof e.degree === "string" ? e.degree : (e.program || "");
            const start = typeof e.start_date === "string" ? e.start_date : (e.start || "");
            const end = typeof e.end_date === "string" ? e.end_date : (e.end || "");

            return (
              <div key={idx} className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#cbe557]/50 hover:bg-white/[0.05] transition-all duration-300">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-[#cbe557] transition-colors">{safeRender(institution)}</div>
                    <div className="text-sm text-neutral-400 mt-1">{safeRender(degree)}</div>
                  </div>
                  {(start || end) && (
                    <span className="text-[10px] text-neutral-500 bg-black/40 px-2 py-1 rounded border border-white/5 whitespace-nowrap font-mono">
                      {safeRender(start)} {start && end ? "-" : ""} {safeRender(end)}
                    </span>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  function renderExperience(exp?: Array<any>) {
    if (!exp || !Array.isArray(exp) || exp.length === 0) return null;
    return (
      <div className="space-y-3">
        {exp.map((job, idx) => {
          if (typeof job !== "object" || job === null) return null;

          const company = typeof job.company === "string" ? job.company : (job.company?.name ?? "Company");
          const position = typeof job.position === "string" ? job.position : (job.title ?? "Role");
          const duration = typeof job.duration === "string" ? job.duration : (job.date_range ?? "");

          let achievements: string[] = [];
          if (Array.isArray(job.achievements)) {
            achievements = job.achievements.map((a: any) => {
              if (typeof a === "string") return String(a);
              if (a && typeof a === "object") {
                if (typeof a.text === "string") return a.text;
                return JSON.stringify(a).slice(0, 50);
              }
              return String(a);
            });
          } else if (typeof job.achievements === "string") {
            achievements = [job.achievements];
          }

          return (
            <div key={idx} className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#cbe557]/50 hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex justify-between items-start gap-3 mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-white text-base">{safeRender(company)}</div>
                  <div className="text-xs text-[#cbe557] font-medium tracking-wide uppercase mt-0.5">{safeRender(position)}</div>
                </div>
                {duration && (
                  <span className="text-[10px] text-neutral-500 bg-black/40 px-2 py-1 rounded border border-white/5 whitespace-nowrap font-mono">
                    {safeRender(duration)}
                  </span>
                )}
              </div>
              {achievements.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {achievements.map((ach, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-neutral-400">
                      <span className="text-[#cbe557] mt-1.5 w-1 h-1 rounded-full bg-[#cbe557]" />
                      <span className="leading-relaxed">{safeRender(ach)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    // FIX: Changed bg-neutral-950 to bg-black and added w-full.
    <div className="w-full bg-black text-neutral-200 font-sans selection:bg-[#cbe557] selection:text-black">
      
      {/* --- Ambient Glow Effects (Dimmed for better contrast) --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#cbe557]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(203,229,87,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(203,229,87,0.3)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* FIX: Reduced max-w from 7xl to 6xl for tighter feel */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Header */}
        <header className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {/* FIX: Smaller Icon Container */}
              <div className="w-12 h-12 rounded-xl bg-[#cbe557] flex items-center justify-center shadow-[0_0_15px_rgba(203,229,87,0.3)]">
                <Sparkles className="text-black" size={22} strokeWidth={2.5} />
              </div>
              <div>
                {/* FIX: Reduced Font Size */}
                <h1 className="text-2xl font-bold text-white tracking-tight">Resume Parser</h1>
                <p className="text-xs text-neutral-400 font-medium">AI-Powered Extraction Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(file || parsed) && (
                <button
                  type="button"
                  onClick={() => {
                    setParsed(null); setFile(null); setUploadStatus("idle"); setProgress(0); setErrorMsg(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-neutral-500 hover:text-white transition-colors"
                >
                  Start Over
                </button>
              )}

              <button
                type="button"
                onClick={() => { if (handleAuthCheck()) fileInputRef.current?.click(); }}
                disabled={!token}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs transition-all shadow-lg ${
                  token 
                    ? "bg-[#cbe557] text-neutral-900 hover:bg-[#dfff6b] hover:scale-105" 
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                }`}
              >
                <Upload size={16} /> {token ? "Upload Resume" : "Login Required"}
              </button>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-12 gap-6 min-h-[500px]">
          
          {/* LEFT: Upload Zone */}
          {/* FIX: Changed max-w-2xl to max-w-xl for initial state */}
          <div className={`flex flex-col transition-all duration-500 ${parsed ? 'lg:col-span-4' : 'lg:col-span-12 max-w-xl mx-auto w-full'}`}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => { if (handleAuthCheck()) fileInputRef.current?.click(); }}
              className={`
                relative flex-1 rounded-2xl border border-dashed transition-all duration-300 cursor-pointer overflow-hidden group
                ${isDragging 
                  ? "border-[#cbe557] bg-[#cbe557]/5 scale-[1.01] shadow-[0_0_20px_rgba(203,229,87,0.1)]" 
                  : "border-white/10 bg-white/[0.02] hover:border-[#cbe557]/30 hover:bg-white/[0.04]"
                }
              `}
            >
              <div className="absolute inset-0 backdrop-blur-sm -z-10" />

              {!file ? (
                // FIX: Reduced padding and min-height
                <div className="h-full flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
                  {/* FIX: Smaller Icon Circle */}
                  <div className="w-16 h-16 rounded-full bg-neutral-900/50 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 group-hover:border-[#cbe557]/50">
                    <Upload className="text-neutral-500 group-hover:text-[#cbe557] transition-colors" size={24} />
                  </div>
                  {/* FIX: Smaller Text */}
                  <h3 className="text-lg font-bold text-white mb-1.5">Drop your resume</h3>
                  <p className="text-neutral-500 text-xs mb-6">PDF, DOCX, or TXT (Max 10MB)</p>
                  <span className="px-4 py-2 rounded-full bg-neutral-800 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 group-hover:bg-[#cbe557] group-hover:text-black transition-all">
                    Browse Files
                  </span>
                </div>
              ) : (
                <div className="h-full p-6 flex flex-col">
                  {/* File Info Card */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
                    <div className="p-2.5 rounded-lg bg-[#cbe557]/10 text-[#cbe557]">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{safeRender(file.name)}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{formatFileSize(file.size)}</div>
                    </div>
                    <button 
                      onClick={(e) => {e.stopPropagation(); handleRemove();}}
                      className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col justify-center mt-4">
                    {uploadStatus === "uploading" ? (
                      <div className="space-y-3">
                         <div className="flex justify-between text-[10px] font-bold tracking-widest text-[#cbe557] uppercase">
                           <span>Processing</span>
                           <span>{progress}%</span>
                         </div>
                         <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                           <div 
                             style={{ width: `${progress}%` }} 
                             className="h-full bg-[#cbe557] shadow-[0_0_10px_#cbe557] transition-all duration-300"
                           />
                         </div>
                         <p className="text-center text-[10px] text-neutral-500">AI is reading document structure...</p>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                        className="w-full py-3 bg-[#cbe557] text-black rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(203,229,87,0.2)] hover:shadow-[0_0_25px_rgba(203,229,87,0.4)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                      >
                        <Zap size={16} fill="black" /> Parse Now
                      </button>
                    )}
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFileSelect} className="hidden" />
              
              {errorMsg && (
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center justify-center gap-2 backdrop-blur-md">
                  <X size={14} /> {safeRender(errorMsg)}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Results Zone */}
          {(parsed || uploadStatus === "uploading") && (
            <div className="lg:col-span-8 animate-in slide-in-from-right-8 duration-700 fade-in h-full">
              <div className="h-full rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md p-1 overflow-hidden relative min-h-[500px]">
                
                {/* Scanning Animation */}
                {uploadStatus === "uploading" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
                    {/* ... (Animation Styles kept same, just slightly smaller logic if needed) ... */}
                    <div className="relative z-10 bg-neutral-900 p-4 rounded-2xl border border-[#cbe557]/20 shadow-[0_0_30px_rgba(203,229,87,0.1)]">
                      <Loader2 className="w-8 h-8 text-[#cbe557] animate-spin" />
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-bold text-white">Analyzing Data</h3>
                      <p className="text-neutral-500 text-xs mt-1">Extracting skills & history...</p>
                    </div>
                  </div>
                )}

                {/* Parsed Content */}
                {parsed && (
                  <div className="h-full overflow-y-auto custom-scrollbar p-6">
                    <div className="space-y-5">
                      
                      {/* Name Card */}
                      <div className="p-6 rounded-xl bg-neutral-900/50 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Sparkles size={80} className="text-white" />
                        </div>
                        <div className="relative z-10">
                          <h2 className="text-2xl font-bold text-white mb-2">{safeRender(parsed.name) || "Candidate Name"}</h2>
                          <div className="flex flex-wrap gap-4 text-xs text-neutral-400">
                            {parsed.email && <div className="flex items-center gap-1.5"><Mail size={12} className="text-[#cbe557]"/> {safeRender(parsed.email)}</div>}
                            {parsed.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-[#cbe557]"/> {safeRender(parsed.phone)}</div>}
                          </div>
                          {parsed.experience_years !== null && parsed.experience_years !== undefined && (
                            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#cbe557]/10 text-[#cbe557] border border-[#cbe557]/20 rounded-md text-xs font-bold">
                              <Briefcase size={14} /> {safeRender(parsed.experience_years)} Years Experience
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      {parsed.summary && (
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2 mb-2 text-[#cbe557] font-bold text-[10px] uppercase tracking-widest">
                            <Award size={12} /> Professional Summary
                          </div>
                          <p className="text-sm text-neutral-300 leading-6">{safeRender(parsed.summary)}</p>
                        </div>
                      )}

                      {/* Skills */}
                      {parsed.skills && parsed.skills.length > 0 && (
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2 mb-3 text-[#cbe557] font-bold text-[10px] uppercase tracking-widest">
                            <Code size={12}/> Technical Skills
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {parsed.skills.map((s, i) => (
                              <span key={i} className="px-2.5 py-1 bg-[#cbe557]/5 text-[#cbe557] border border-[#cbe557]/10 rounded-md text-[10px] font-medium hover:bg-[#cbe557]/10 transition-colors cursor-default">
                                {safeRender(s)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience & Education sections (Reuse render helpers) */}
                      {parsed.experience && parsed.experience.length > 0 && (
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2 mb-3 text-[#cbe557] font-bold text-[10px] uppercase tracking-widest">
                            <Building size={12} /> Work Experience
                          </div>
                          {renderExperience(parsed.experience)}
                        </div>
                      )}

                      {parsed.education && parsed.education.length > 0 && (
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2 mb-3 text-[#cbe557] font-bold text-[10px] uppercase tracking-widest">
                            <GraduationCap size={12} /> Education
                          </div>
                          {renderEducation(parsed.education)}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            if (handleAuthCheck()) {
                              if (onStart) onStart();
                              if (parsed) onReady?.(parsed, parsed.file_url ?? null);
                            }
                          }}
                          className="w-full group py-3 bg-white text-black hover:bg-[#cbe557] rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} className="text-black"/> 
                          Confirm & Start Interview
                          <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform"/>
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}