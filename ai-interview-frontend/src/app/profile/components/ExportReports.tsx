"use client";

import React, { useState } from "react";
import { SessionDetail } from "../page";
import { useAuth } from "../../context/AuthContext";
import { 
  Download, 
  FileText, 
  Map, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Target,
  BookOpen,
  Video,
  Printer,
  ChevronRight,
  Calendar
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ExportReports({ session }: { session: SessionDetail }) {
  const { token } = useAuth();
  
  // --- States ---
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8000";

  // --- Quick Print Logic ---
  const handlePrint = () => {
    window.print();
  };

  // --- PDF Export Logic ---
  const handleDownloadPDF = async () => {
    const target = document.getElementById("session-summary") || document.body;

    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: "#050505", 
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Candidate_Report_${session.sessionId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // --- AI Roadmap Fetch Logic (FIXED API ROUTE) ---
  const handleGenerateRoadmap = async () => {
    if (!token) {
      setRoadmapError("Authentication token missing.");
      return;
    }

    setIsGeneratingRoadmap(true);
    setRoadmapError(null);

    try {
      // ✅ FIXED: Matches your FastAPI backend route
      const res = await fetch(`${API_URL}/interview/roadmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // ✅ FIXED: Matches the exact payload structure your backend expects
        body: JSON.stringify({ 
          sessionId: session.sessionId 
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.roadmap) {
        setRoadmapData(data);
      } else {
        throw new Error(data.error || "Failed to generate roadmap.");
      }
    } catch (err: any) {
      console.error("Roadmap error:", err);
      setRoadmapError(err.message || "Network error. Make sure backend is running.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ================= PDF EXPORT CARD ================= */}
        <div className="relative group bg-neutral-900/40 rounded-3xl p-6 md:p-8 border border-white/5 hover:border-blue-500/30 transition-all duration-500 overflow-hidden shadow-lg hover:shadow-blue-500/10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start gap-5 mb-6">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 shrink-0">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xl mb-1">Executive Report</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Export a comprehensive snapshot of this interview, including scores, integrity logs, and analysis.
                </p>
              </div>
            </div>

            <div className="mt-auto flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn shadow-lg shadow-blue-900/20"
              >
                {isGeneratingPDF ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Rendering...</>
                ) : (
                  <><Download className="w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" /> Save PDF</>
                )}
              </button>
              
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/10 hover:border-white/20"
                title="Quick Print"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= ROADMAP CARD ================= */}
        <div className="relative group bg-neutral-900/40 rounded-3xl p-6 md:p-8 border border-white/5 hover:border-[#cbe557]/30 transition-all duration-500 overflow-hidden shadow-lg hover:shadow-[#cbe557]/10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#cbe557]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-[#cbe557]/20 transition-colors duration-700"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start gap-5 mb-6">
              <div className="p-4 rounded-2xl bg-[#cbe557]/10 border border-[#cbe557]/20 shrink-0">
                <Map className="w-8 h-8 text-[#cbe557]" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xl mb-1">AI Learning Roadmap</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Generate a personalized 4-week study plan targeting exact weaknesses and critical gaps.
                </p>
              </div>
            </div>

            <div className="mt-auto">
              <button
                onClick={handleGenerateRoadmap}
                disabled={isGeneratingRoadmap || !!roadmapData}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                  roadmapData 
                    ? "bg-[#cbe557]/10 text-[#cbe557] border border-[#cbe557]/30 cursor-default" 
                    : "bg-[#cbe557] text-neutral-950 hover:bg-[#b5cc4e] hover:scale-[1.02] active:scale-95 border border-transparent shadow-[#cbe557]/20"
                } disabled:opacity-50 disabled:hover:scale-100`}
              >
                {isGeneratingRoadmap ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Gaps & Building Plan...</>
                ) : roadmapData ? (
                  <><CheckCircle2 className="w-5 h-5" /> Roadmap Generated</>
                ) : (
                  <><Target className="w-5 h-5" /> Generate Action Plan</>
                )}
              </button>

              {roadmapError && (
                <p className="mt-3 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertTriangle size={14} className="shrink-0" /> {roadmapError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= ROADMAP DISPLAY UI (TIMELINE) ================= */}
      {roadmapData && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8">
          <div className="bg-neutral-900/60 border border-[#cbe557]/30 rounded-3xl p-6 md:p-10 relative overflow-hidden backdrop-blur-xl shadow-[0_0_50px_rgba(203,229,87,0.05)]">
            
            {/* Header */}
            <div className="border-b border-white/10 pb-8 mb-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                  <span className="px-3 py-1 bg-[#cbe557]/20 text-[#cbe557] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#cbe557]/30 shadow-inner">
                    {roadmapData.plan_type || "Personalized Plan"}
                  </span>
                  <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider bg-white/5 px-3 py-1 rounded-lg">
                    Global Avg: {((roadmapData.metrics?.global_avg || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">4-Week Action Plan</h2>
                <p className="text-neutral-400 mt-2 max-w-2xl text-sm leading-relaxed">{roadmapData.roadmap.overall_assessment}</p>
              </div>
              
              <div className="w-16 h-16 bg-[#cbe557]/10 rounded-full flex items-center justify-center border border-[#cbe557]/30 shadow-[0_0_20px_rgba(203,229,87,0.2)] shrink-0">
                <Map className="w-8 h-8 text-[#cbe557]" />
              </div>
            </div>

            {/* Critical Gaps Tag List */}
            {roadmapData.metrics?.critical_gaps?.length > 0 && (
              <div className="mb-10 bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 md:p-6 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Target size={14} /> Critical Focus Areas to Resolve
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {roadmapData.metrics.critical_gaps.map((gap: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-xl shadow-sm">
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Breakdown - Vertical Timeline */}
            <div className="relative border-l-2 border-[#cbe557]/20 ml-4 md:ml-6 space-y-12 pb-4">
              {roadmapData.roadmap.weekly_plan?.map((week: any, wIdx: number) => (
                <div key={wIdx} className="relative pl-8 md:pl-12 group">
                  
                  {/* Timeline Node */}
                  <div className="absolute -left-[17px] top-0 w-8 h-8 bg-[#050505] border-2 border-[#cbe557] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(203,229,87,0.4)] group-hover:scale-110 transition-transform">
                    <span className="text-[10px] font-black text-[#cbe557]">{week.week}</span>
                  </div>

                  {/* Week Content */}
                  <div className="bg-black/40 border border-white/5 rounded-3xl p-6 md:p-8 hover:border-white/10 hover:bg-neutral-900/50 transition-colors shadow-xl">
                    <div className="mb-6">
                      <h4 className="text-2xl font-bold text-white mb-2 tracking-tight">Week {week.week}: {week.theme}</h4>
                      <p className="text-sm text-neutral-400 font-medium">🎯 Goals: {week.goals?.join(" • ")}</p>
                    </div>

                    {/* Daily Tasks */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {week.daily_tasks?.map((task: any, tIdx: number) => (
                        <div key={tIdx} className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors flex flex-col h-full">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#cbe557] uppercase tracking-widest mb-3 bg-[#cbe557]/10 px-2.5 py-1 rounded-md w-fit">
                            <Calendar size={10} /> {task.day}
                          </span>
                          <p className="text-sm text-neutral-200 font-medium mb-5 leading-relaxed flex-1">
                            {task.activity}
                          </p>

                          {/* Resources List */}
                          {task.resources?.length > 0 && (
                            <div className="flex flex-col gap-2 mt-auto border-t border-white/5 pt-4">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Recommended Material</span>
                              {task.resources.map((res: any, rIdx: number) => (
                                <a 
                                  key={rIdx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-xl bg-black/60 hover:bg-[#cbe557]/10 border border-white/5 hover:border-[#cbe557]/30 transition-all group/link shadow-sm"
                                >
                                  {res.type === "video" ? (
                                    <Video size={16} className="text-red-400 shrink-0 group-hover/link:text-[#cbe557]" />
                                  ) : (
                                    <BookOpen size={16} className="text-blue-400 shrink-0 group-hover/link:text-[#cbe557]" />
                                  )}
                                  <span className="text-xs text-neutral-300 group-hover/link:text-white font-bold flex-1 truncate transition-colors">
                                    {res.title}
                                  </span>
                                  <ChevronRight size={14} className="text-neutral-600 group-hover/link:text-[#cbe557] group-hover/link:translate-x-1 transition-all shrink-0" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}