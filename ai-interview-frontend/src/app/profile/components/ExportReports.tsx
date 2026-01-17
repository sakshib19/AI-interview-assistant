"use client";

import { SessionDetail } from "../page";
import { Download, FileText, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ExportReports({ session }: { session: SessionDetail }) {
  const handleDownloadPDF = async () => {
    const target = document.getElementById("session-summary");

    if (!target) {
      alert("Session summary not found");
      return;
    }

    try {
      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: "#111827", // gray-900
        useCORS: true,
        logging: false,
        foreignObjectRendering: false,
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
      pdf.save(`session-${session.sessionId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleGenerateRoadmap = () => {
    alert("Roadmap generation will be implemented next");
  };

  return (
    <div className="space-y-6">

      {/* ================= PDF EXPORT ================= */}
      <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600 hover:border-blue-500/50 transition-colors">
        <div className="flex gap-4">
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
            <FileText className="w-6 h-6 text-red-400" />
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Downloadable PDF Performance Report
            </h3>

            <p className="text-sm text-gray-400 mb-4">
              Full session analytics, round-wise scores, and AI skill insights.
            </p>

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* ================= ROADMAP ================= */}
      <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600 hover:border-purple-500/50 transition-colors">
        <div className="flex gap-4">
          <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <Calendar className="w-6 h-6 text-purple-400" />
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              4-Week Personalized Learning Roadmap
            </h3>

            <p className="text-sm text-gray-400 mb-4">
              AI-generated roadmap based on weak skills and gaps.
            </p>

            <button
              onClick={handleGenerateRoadmap}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition"
            >
              Generate Roadmap
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
