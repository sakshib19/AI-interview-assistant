"use client";

import { SessionDetail } from "../page";
import { Download, FileText, Share2, Calendar } from "lucide-react";

export default function ExportReports({ session }: { session: SessionDetail }) {
  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation using jspdf
    alert("PDF download functionality will be implemented");
  };

  const handleGenerateRoadmap = () => {
    // TODO: Implement 4-week learning roadmap generation
    alert("Learning roadmap generation will be implemented");
  };

  const handleShareSummary = () => {
    // TODO: Implement shareable session summary
    alert("Shareable summary generation will be implemented");
  };

  return (
    <div className="space-y-6">
      {/* PDF Performance Report */}
      <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600 hover:border-blue-500/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
              <FileText className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Downloadable PDF Performance Report</h3>
              <p className="text-sm text-gray-400 mb-4">
                Generate a comprehensive PDF report containing all session analytics, performance
                metrics, and AI insights.
              </p>
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Week Learning Roadmap */}
      <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600 hover:border-purple-500/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">4-Week Personalized Learning Roadmap</h3>
              <p className="text-sm text-gray-400 mb-4">
                Get a customized 4-week learning plan based on your performance insights and weak
                areas identified during the interview.
              </p>
              <button
                onClick={handleGenerateRoadmap}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Generate Roadmap
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shareable Session Summary */}
      <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600 hover:border-green-500/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30">
              <Share2 className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Shareable Session Summary (Read-Only)</h3>
              <p className="text-sm text-gray-400 mb-4">
                Create a read-only shareable link to your session summary that can be shared with
                mentors, recruiters, or for portfolio purposes.
              </p>
              <button
                onClick={handleShareSummary}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Generate Shareable Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

