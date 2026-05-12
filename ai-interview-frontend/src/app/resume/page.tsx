"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  Upload, FileText, X, CheckCircle, Briefcase, GraduationCap,
  Mail, Phone, Award, Building, Zap, Code, ChevronRight, Check, FileSearch, Cpu, LineChart,
  ShieldCheck, User, FolderGit2, AlertCircle, RefreshCw, ClipboardCheck, Layers, LogOut
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
  const { token, logout } = useAuth();

  // --- STATE ---
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<"overview" | "experience" | "projects">("overview");
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

  // Calculate Data Quality Score
  const getExtractionScore = (data: ParsedResume) => {
    let score = 0;
    if (data.name) score += 15;
    if (data.email) score += 10;
    if (data.phone) score += 10;
    if (data.skills && data.skills.length > 0) score += 25;
    if (data.experience && data.experience.length > 0) score += 25;
    if (data.education && data.education.length > 0) score += 15;
    return score;
  };

  const getExtractionInsights = (data: ParsedResume) => {
    const fields = [
      { key: "name", label: "Candidate name", ready: Boolean(data.name), icon: User },
      { key: "email", label: "Email", ready: Boolean(data.email), icon: Mail },
      { key: "phone", label: "Phone", ready: Boolean(data.phone), icon: Phone },
      { key: "skills", label: "Skills", ready: Boolean(data.skills?.length), icon: Code },
      { key: "experience", label: "Experience", ready: Boolean(data.experience?.length), icon: Briefcase },
      { key: "education", label: "Education", ready: Boolean(data.education?.length), icon: GraduationCap },
      { key: "projects", label: "Projects", ready: Boolean(data.projects?.length), icon: FolderGit2 },
    ];

    return {
      fields,
      complete: fields.filter((field) => field.ready).length,
      missing: fields.filter((field) => !field.ready),
    };
  };

  const getPrimaryRole = (data: ParsedResume) => {
    const firstExperience = data.experience?.[0];
    if (firstExperience && typeof firstExperience === "object") {
      return firstExperience.position || firstExperience.title || firstExperience.role || "Interview Candidate";
    }
    return data.skills?.slice(0, 2).join(" / ") || "Interview Candidate";
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
    setActiveResultTab("overview");
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
          setProgress(prev => Math.min(prev + 8, 92)); // Stay at 92 until real completion
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
          } catch {
            body = { error: "Invalid JSON response from server" };
          }

          if (status >= 200 && status < 300) {
            setProgress(100);
            const parsedBody: ParsedResume = body.parsed ?? body;
            
            // Artificial delay to let the user see the 100% state
            setTimeout(() => {
              setParsed(parsedBody);
              setActiveResultTab("overview");
              setUploadStatus("success");
              try {
                const fileUrl = parsedBody.file_url ?? parsedBody.resume_url ?? null;
                onReady?.(parsedBody, fileUrl);
              } catch (cbErr) {
                console.warn("onReady callback threw:", cbErr);
              }
              resolve();
            }, 800);
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
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
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
    } catch {
      return String(value);
    }
    return String(value);
  }

  // --- RENDER SECTIONS ---
  function renderEducation(edu?: Array<any>) {
    if (!edu || !Array.isArray(edu) || edu.length === 0) return null;
    return (
      <div className="grid grid-cols-1 gap-4">
        {edu.map((e, idx) => {
          if (typeof e === "object" && e !== null) {
            const institution = typeof e.institution === "string" ? e.institution : (e.school || "Unknown");
            const degree = typeof e.degree === "string" ? e.degree : (e.program || "");
            const start = typeof e.start_date === "string" ? e.start_date : (e.start || "");
            const end = typeof e.end_date === "string" ? e.end_date : (e.end || "");

            return (
              <div key={idx} className="group p-5 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-[#cbe557]/40 hover:bg-neutral-800/80 transition-all duration-300">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="font-bold text-white group-hover:text-[#cbe557] transition-colors text-base">{safeRender(institution)}</div>
                    <div className="text-sm text-neutral-400 mt-1">{safeRender(degree)}</div>
                  </div>
                  {(start || end) && (
                    <span className="text-[10px] text-neutral-400 bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 whitespace-nowrap font-mono font-bold tracking-widest uppercase">
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
      <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#cbe557]/50 before:via-white/10 before:to-transparent">
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
            <div key={idx} className="relative group">
              <div className="absolute -left-6 w-3 h-3 bg-black border-2 border-[#cbe557] rounded-full mt-1.5 group-hover:bg-[#cbe557] group-hover:shadow-[0_0_10px_#cbe557] transition-all" />
              <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5 group-hover:border-[#cbe557]/30 hover:bg-neutral-800/80 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg">{safeRender(position)}</div>
                    <div className="text-sm text-[#cbe557] font-bold tracking-wide mt-1 flex items-center gap-2">
                      <Building size={14} /> {safeRender(company)}
                    </div>
                  </div>
                  {duration && (
                    <span className="text-[10px] text-neutral-400 bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 whitespace-nowrap font-mono font-bold tracking-widest uppercase self-start">
                      {safeRender(duration)}
                    </span>
                  )}
                </div>
                {achievements.length > 0 && (
                  <ul className="space-y-2 mt-4 pt-4 border-t border-white/5">
                    {achievements.map((ach, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-neutral-300 leading-relaxed">
                        <ChevronRight size={14} className="text-[#cbe557] mt-1 shrink-0" />
                        <span>{safeRender(ach)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderProjects(projects?: Array<any>) {
    if (!projects || !Array.isArray(projects) || projects.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project, idx) => {
          if (typeof project !== "object" || project === null) return null;

          const title = project.title || project.name || `Project ${idx + 1}`;
          const description = project.description || project.summary || "";
          const technologies = Array.isArray(project.technologies)
            ? project.technologies
            : Array.isArray(project.tech_stack)
              ? project.tech_stack
              : [];

          return (
            <div key={idx} className="group rounded-2xl border border-white/10 bg-neutral-950/50 p-5 hover:border-[#cbe557]/35 hover:bg-neutral-900/80 transition-all">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#cbe557]/10 border border-[#cbe557]/20 p-2.5 text-[#cbe557]">
                  <FolderGit2 size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-white group-hover:text-[#cbe557] transition-colors">
                    {safeRender(title)}
                  </h4>
                  {description && (
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400 line-clamp-4">
                      {safeRender(description)}
                    </p>
                  )}
                </div>
              </div>

              {technologies.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                  {technologies.slice(0, 8).map((tech: unknown, i: number) => (
                    <span key={i} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-neutral-300">
                      {safeRender(tech)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="w-full bg-[#050505] text-neutral-200 font-sans selection:bg-[#cbe557] selection:text-black">
      
      {/* --- Ambient Glow Effects --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#cbe557]/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(203,229,87,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(203,229,87,0.3)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Header */}
        <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-neutral-900/40 border border-white/5 p-4 md:p-6 rounded-3xl backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#cbe557] to-emerald-600 flex items-center justify-center shadow-[0_0_20px_rgba(203,229,87,0.2)]">
                <Cpu className="text-black" size={28} strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">AI Context Engine</h1>
                <p className="text-xs md:text-sm text-neutral-400 font-medium mt-1">Upload your profile to initialize the interview.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              
              {/* Logout Button */}
              {token && (
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center justify-center gap-2 p-3 sm:px-4 sm:py-3 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 transition-colors border border-rose-500/20"
                  title="Log out"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}

              {/* Clear Data Button */}
              {(file || parsed) && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-bold text-neutral-400 bg-white/5 hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                >
                  Clear Data
                </button>
              )}

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => { if (handleAuthCheck()) fileInputRef.current?.click(); }}
                disabled={!token || !!parsed}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                  !token 
                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                    : parsed
                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed hidden sm:flex"
                    : "bg-[#cbe557] text-black hover:bg-[#dfff6b] hover:scale-105 shadow-[#cbe557]/20"
                }`}
              >
                <Upload size={18} /> {token ? "Upload Resume" : "Login Required"}
              </button>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-12 gap-8 min-h-[600px]">
          
          {/* LEFT: Upload Zone */}
          <div className={`flex flex-col transition-all duration-700 ease-in-out ${parsed ? 'lg:col-span-4' : 'lg:col-span-12 max-w-2xl mx-auto w-full'}`}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => { if (handleAuthCheck() && !parsed && uploadStatus !== "uploading") fileInputRef.current?.click(); }}
              className={`
                relative flex-1 rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden group flex flex-col justify-center
                ${isDragging 
                  ? "border-[#cbe557] bg-[#cbe557]/10 scale-[1.02] shadow-[0_0_30px_rgba(203,229,87,0.15)]" 
                  : parsed || uploadStatus === "uploading" 
                  ? "border-white/5 bg-neutral-900/30 cursor-default" 
                  : "border-white/10 bg-neutral-900/40 hover:border-[#cbe557]/40 hover:bg-neutral-900/60 cursor-pointer"
                }
              `}
            >
              <div className="absolute inset-0 backdrop-blur-xl -z-10" />

              {!file ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 min-h-[400px]">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-[#cbe557]/20 rounded-full blur-xl group-hover:bg-[#cbe557]/40 transition-colors duration-500"></div>
                    <div className="w-24 h-24 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500 group-hover:border-[#cbe557]/50 shadow-2xl">
                      <FileSearch className="text-neutral-400 group-hover:text-[#cbe557] transition-colors" size={40} strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Drag & Drop Resume</h3>
                  <p className="text-neutral-500 text-sm mb-8 max-w-xs leading-relaxed">
                    Upload your PDF, DOCX, or TXT file. Our AI will automatically extract your skills and experience.
                  </p>
                  <span className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-neutral-300 group-hover:bg-[#cbe557] group-hover:text-black group-hover:border-[#cbe557] transition-all">
                    Browse Files
                  </span>

                  <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
                    {[
                      { icon: ShieldCheck, label: "Private parsing", text: "Used only for interview context" },
                      { icon: Cpu, label: "AI extraction", text: "Skills, projects, roles" },
                      { icon: ClipboardCheck, label: "Ready check", text: "Shows missing fields" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left">
                          <Icon size={18} className="text-[#cbe557] mb-3" />
                          <div className="text-xs font-black text-white">{item.label}</div>
                          <div className="mt-1 text-[11px] leading-relaxed text-neutral-500">{item.text}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full p-8 flex flex-col justify-center min-h-[400px]">
                  
                  {/* File Info Card */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/60 border border-white/10 shadow-inner mb-8">
                    <div className="p-3 rounded-xl bg-[#cbe557]/10 text-[#cbe557]">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate">{safeRender(file.name)}</div>
                      <div className="text-xs text-neutral-500 font-mono mt-1">{formatFileSize(file.size)}</div>
                    </div>
                    {uploadStatus !== "uploading" && !parsed && (
                      <button 
                        onClick={(e) => {e.stopPropagation(); handleRemove();}}
                        className="p-2 text-neutral-500 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    {uploadStatus === "uploading" ? (
                      <div className="space-y-5 animate-in fade-in">
                         <div className="flex items-center justify-center mb-6 relative">
                            <div className="w-16 h-16 rounded-full border-4 border-neutral-800 border-t-[#cbe557] animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#cbe557]">{progress}%</div>
                         </div>
                         
                         <div className="space-y-2">
                           <div className="flex justify-between text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                             <span>AI Engine Scanning</span>
                             <span>{progress === 100 ? "Complete" : "Extracting..."}</span>
                           </div>
                           <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                             <div 
                               style={{ width: `${progress}%` }} 
                               className="h-full bg-gradient-to-r from-emerald-500 to-[#cbe557] shadow-[0_0_15px_#cbe557] transition-all duration-300 relative"
                             >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                             </div>
                           </div>
                         </div>

                         <div className="grid grid-cols-3 gap-2 pt-2">
                           {[
                             { label: "Read", active: progress > 15 },
                             { label: "Extract", active: progress > 45 },
                             { label: "Map", active: progress > 75 },
                           ].map((step) => (
                             <div
                               key={step.label}
                               className={`rounded-xl border px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest ${
                                 step.active
                                   ? "border-[#cbe557]/30 bg-[#cbe557]/10 text-[#cbe557]"
                                   : "border-white/10 bg-white/5 text-neutral-600"
                               }`}
                             >
                               {step.label}
                             </div>
                           ))}
                         </div>
                      </div>
                    ) : parsed ? (
                      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-[#cbe557]/10 rounded-full flex items-center justify-center mx-auto border border-[#cbe557]/30 shadow-[0_0_30px_rgba(203,229,87,0.2)]">
                          <CheckCircle size={40} className="text-[#cbe557]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white">Extraction Complete</h3>
                          <p className="text-sm text-neutral-400 mt-2">Data successfully mapped to context engine.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                          className="w-full py-4 bg-gradient-to-r from-[#cbe557] to-emerald-400 text-black rounded-xl font-black text-base shadow-[0_0_20px_rgba(203,229,87,0.2)] hover:shadow-[0_0_30px_rgba(203,229,87,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Zap size={18} fill="black" /> Initialize Parsing
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={16} /> Replace File
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFileSelect} className="hidden" />
            </div>

            {errorMsg && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-bottom-2">
                <X size={18} className="shrink-0 mt-0.5" /> 
                <span className="leading-relaxed font-medium">{safeRender(errorMsg)}</span>
              </div>
            )}
          </div>

          {/* RIGHT: Results Zone */}
          {parsed && (
            <div className="lg:col-span-8 animate-in slide-in-from-right-8 duration-700 fade-in h-full flex flex-col">
              <div className="flex-1 rounded-3xl bg-neutral-900/40 border border-white/5 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl relative">
                
                {/* Extraction Score Header */}
                <div className="bg-black/40 border-b border-white/5 p-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                      <LineChart size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Data Quality Match</h3>
                      <p className="text-xs text-neutral-500">
                        {getExtractionInsights(parsed).complete} of {getExtractionInsights(parsed).fields.length} context signals found
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl border border-[#cbe557]/30 bg-[#cbe557]/10 flex items-center justify-center">
                      <span className="text-xl font-black text-[#cbe557]">{getExtractionScore(parsed)}%</span>
                    </div>
                  </div>
                </div>

                {/* Parsed Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                  
                  {/* Profile Header */}
                  <div className="relative rounded-3xl border border-white/10 bg-black/30 p-6 overflow-hidden">
                    <div className="absolute right-0 top-0 h-40 w-40 bg-[#cbe557]/5 blur-3xl" />
                    <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#cbe557]/20 bg-[#cbe557]/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#cbe557]">
                          <ShieldCheck size={14} />
                          Parsed Profile
                        </div>
                        <h2 className="text-3xl font-black text-white">{safeRender(parsed.name) || "Candidate Profile"}</h2>
                        <p className="mt-2 text-sm font-medium text-neutral-400">{safeRender(getPrimaryRole(parsed))}</p>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium text-neutral-300">
                          {parsed.email && <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><Mail size={14} className="text-[#cbe557]"/> {safeRender(parsed.email)}</span>}
                          {parsed.phone && <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><Phone size={14} className="text-[#cbe557]"/> {safeRender(parsed.phone)}</span>}
                          {parsed.experience_years !== null && parsed.experience_years !== undefined && (
                            <span className="flex items-center gap-2 bg-[#cbe557]/10 text-[#cbe557] px-3 py-1.5 rounded-lg border border-[#cbe557]/20 font-bold">
                              <Briefcase size={14} /> {safeRender(parsed.experience_years)} Years Exp
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 md:min-w-[300px]">
                        {[
                          { label: "Skills", value: parsed.skills?.length || 0, icon: Code },
                          { label: "Roles", value: parsed.experience?.length || 0, icon: Briefcase },
                          { label: "Projects", value: parsed.projects?.length || 0, icon: FolderGit2 },
                        ].map((stat) => {
                          const Icon = stat.icon;
                          return (
                            <div key={stat.label} className="rounded-2xl border border-white/10 bg-neutral-950/60 p-3 text-center">
                              <Icon size={16} className="mx-auto text-[#cbe557]" />
                              <div className="mt-2 text-2xl font-black text-white">{stat.value}</div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{stat.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 flex gap-2 overflow-x-auto">
                      {[
                        { id: "overview", label: "Overview", icon: User },
                        { id: "experience", label: "Experience", icon: Building },
                        { id: "projects", label: "Projects", icon: FolderGit2 },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const active = activeResultTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveResultTab(tab.id as "overview" | "experience" | "projects")}
                            className={`flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all ${
                              active
                                ? "bg-[#cbe557] text-black"
                                : "text-neutral-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <Icon size={16} />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <h3 className="flex items-center gap-2 text-xs font-black text-neutral-500 uppercase tracking-widest mb-4">
                        <ClipboardCheck size={14} className="text-[#cbe557]" /> Context Checklist
                      </h3>
                      <div className="space-y-2">
                        {getExtractionInsights(parsed).fields.map((field) => {
                          const Icon = field.icon;
                          return (
                            <div key={field.key} className="flex items-center justify-between gap-3 text-sm">
                              <span className="flex items-center gap-2 text-neutral-300">
                                <Icon size={14} className={field.ready ? "text-[#cbe557]" : "text-neutral-600"} />
                                {field.label}
                              </span>
                              {field.ready ? (
                                <Check size={15} className="text-[#cbe557]" />
                              ) : (
                                <AlertCircle size={15} className="text-amber-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {activeResultTab === "overview" && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      {parsed.summary && (
                        <div>
                          <h3 className="flex items-center gap-2 text-xs font-black text-neutral-500 uppercase tracking-widest mb-4">
                            <Award size={14} className="text-purple-400" /> Summary
                          </h3>
                          <p className="text-neutral-300 text-sm leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5">
                            {safeRender(parsed.summary)}
                          </p>
                        </div>
                      )}

                      {parsed.skills && parsed.skills.length > 0 && (
                        <div>
                          <h3 className="flex items-center gap-2 text-xs font-black text-neutral-500 uppercase tracking-widest mb-4">
                            <Code size={14} className="text-blue-400" /> Technical Arsenal
                            <span className="ml-2 px-2 py-0.5 bg-white/10 text-white rounded-md text-[10px]">{parsed.skills.length}</span>
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {parsed.skills.map((s, i) => (
                              <span key={i} className="px-3 py-1.5 bg-neutral-900 border border-white/10 text-neutral-200 rounded-lg text-xs font-bold hover:border-[#cbe557] hover:text-[#cbe557] transition-colors cursor-default shadow-sm">
                                {safeRender(s)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsed.education && parsed.education.length > 0 && (
                        <div>
                          <h3 className="flex items-center gap-2 text-xs font-black text-neutral-500 uppercase tracking-widest mb-6">
                            <GraduationCap size={14} className="text-amber-400" /> Education
                          </h3>
                          {renderEducation(parsed.education)}
                        </div>
                      )}
                    </div>
                  )}

                  {activeResultTab === "experience" && (
                    <div className="animate-in fade-in duration-300">
                      {parsed.experience && parsed.experience.length > 0 ? (
                        <div>
                          <h3 className="flex items-center gap-2 text-xs font-black text-neutral-500 uppercase tracking-widest mb-6">
                            <Building size={14} className="text-emerald-400" /> Work History
                          </h3>
                          {renderExperience(parsed.experience)}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
                          <Layers size={34} className="mx-auto text-neutral-600 mb-3" />
                          <p className="text-sm font-bold text-neutral-400">No work history was extracted.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeResultTab === "projects" && (
                    <div className="animate-in fade-in duration-300">
                      {parsed.projects && parsed.projects.length > 0 ? (
                        <div>
                          <h3 className="flex items-center gap-2 text-xs font-black text-neutral-500 uppercase tracking-widest mb-6">
                            <FolderGit2 size={14} className="text-[#cbe557]" /> Project Evidence
                          </h3>
                          {renderProjects(parsed.projects)}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
                          <FolderGit2 size={34} className="mx-auto text-neutral-600 mb-3" />
                          <p className="text-sm font-bold text-neutral-400">No projects were extracted.</p>
                          <p className="mt-1 text-xs text-neutral-600">You can continue, but project-specific questions may be less personalized.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="bg-black/40 border-t border-white/5 p-6 shrink-0 relative z-20">
                  <button
                    onClick={() => {
                      if (handleAuthCheck()) {
                        if (onStart) onStart();
                        if (parsed) onReady?.(parsed, parsed.file_url ?? null);
                      }
                    }}
                    className="w-full group py-4 bg-[#cbe557] text-black hover:bg-[#dfff6b] rounded-2xl font-black text-base md:text-lg shadow-[0_0_20px_rgba(203,229,87,0.2)] hover:shadow-[0_0_30px_rgba(203,229,87,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                  >
                    <span>Confirm Profile & Initialize</span>
                    <ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform"/>
                  </button>
                  <p className="text-center text-xs text-neutral-500 mt-4">By continuing, you agree to the automated proctoring terms.</p>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}