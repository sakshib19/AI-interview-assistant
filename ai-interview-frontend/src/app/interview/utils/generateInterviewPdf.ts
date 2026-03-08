import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type GenerateInterviewPdfParams = {
  finalDecision: any;
  finalReport: any;
  performanceMetrics: any;
  history: any[];
  roadmap: any;
  roadmapTitle: string;
};

export const generateInterviewPdf = ({
  finalDecision,
  finalReport,
  performanceMetrics,
  history,
  roadmap,
  roadmapTitle,
}: GenerateInterviewPdfParams) => {
  if (!finalDecision && !finalReport) return;

  const reportData = finalReport || {};
  const decisionData = finalDecision || {};
  const metricsData = performanceMetrics || {};

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentPage = 1;

  const COLORS = {
    primary: [79, 70, 229] as [number, number, number],
    primaryLight: [99, 102, 241] as [number, number, number],
    secondary: [241, 245, 249] as [number, number, number],
    textMain: [30, 41, 59] as [number, number, number],
    textLight: [100, 116, 139] as [number, number, number],
    success: [16, 185, 129] as [number, number, number],
    warning: [245, 158, 11] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
  };

  const drawHeader = (pageNum: number) => {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setFillColor(...COLORS.primaryLight);
    doc.rect(0, 0, pageWidth, 38, "F");

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Technical Interview Report", 14, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(226, 232, 240);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      14,
      28
    );

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${pageNum}`, pageWidth - 14, pageHeight - 10, { align: "right" });
  };

  const drawVerdictBadge = (verdict: string) => {
    const v = (verdict || "pending").toLowerCase();
    let bg = COLORS.secondary;
    let textCol = COLORS.textMain;
    let label = "PENDING";

    if (v.includes("strong") || v.includes("hire")) {
      bg = COLORS.success;
      textCol = [255, 255, 255] as [number, number, number];
      label = "STRONG HIRE";
    } else if (v.includes("acceptable")) {
      bg = [59, 130, 246] as [number, number, number];
      textCol = [255, 255, 255] as [number, number, number];
      label = "ACCEPTABLE";
    } else if (v.includes("weak") || v.includes("reject")) {
      bg = COLORS.danger;
      textCol = [255, 255, 255] as [number, number, number];
      label = "NOT RECOMMENDED";
    }

    const badgeWidth = 50;
    const xPos = pageWidth - badgeWidth - 14;

    doc.setFillColor(...bg);
    doc.roundedRect(xPos, 10, badgeWidth, 10, 2, 2, "F");

    doc.setTextColor(...textCol);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label, xPos + badgeWidth / 2, 16.5, { align: "center" });
  };

  drawHeader(currentPage);
  drawVerdictBadge(reportData.overall?.verdict || decisionData.verdict);

  let y = 55;
  const score = Math.round((reportData.overall?.score || metricsData.average_score || 0) * 100);
  const duration = reportData.meta?.duration_minutes || "N/A";
  const qCount = history.length;

  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(14, y, pageWidth - 28, 30, 3, 3, "FD");

  const drawMetric = (label: string, value: string, x: number) => {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(value, x, y + 12, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textLight);
    doc.text(label, x, y + 22, { align: "center" });
  };

  const sectionW = (pageWidth - 28) / 3;
  drawMetric("Overall Score", `${score}%`, 14 + sectionW / 2);
  drawMetric("Questions Answered", `${qCount}`, 14 + sectionW + sectionW / 2);
  drawMetric("Duration (mins)", `${duration}`, 14 + sectionW * 2 + sectionW / 2);

  y += 45;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textMain);
  doc.text("Executive Summary", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const summaryText =
    reportData.overall?.feedback_summary ||
    decisionData.feedback_summary ||
    decisionData.reason ||
    "No summary available.";
  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 28);
  doc.text(splitSummary, 14, y);
  y += splitSummary.length * 5 + 15;

  const colWidth = (pageWidth - 34) / 2;
  const startY = y;

  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14, y, colWidth, 8, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70);
  doc.text("Key Strengths", 18, y + 5.5);

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const strengths = reportData.details?.key_strengths || decisionData.key_strengths || [];
  strengths.slice(0, 5).forEach((s: string) => {
    const lines = doc.splitTextToSize(`• ${s}`, colWidth - 8);
    doc.text(lines, 18, y);
    y += lines.length * 5;
  });

  let rightY = startY;
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14 + colWidth + 6, rightY, colWidth, 8, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(153, 27, 27);
  doc.text("Areas for Improvement", 18 + colWidth + 6, rightY + 5.5);

  rightY += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const weaks = reportData.details?.areas_for_improvement || decisionData.critical_weaknesses || [];
  weaks.slice(0, 5).forEach((w: string) => {
    const lines = doc.splitTextToSize(`• ${w}`, colWidth - 8);
    doc.text(lines, 18 + colWidth + 6, rightY);
    rightY += lines.length * 5;
  });

  y = Math.max(y, rightY) + 20;

  if (roadmap && roadmap.weekly_plan) {
    doc.addPage();
    currentPage++;
    drawHeader(currentPage);

    let rY = 55;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.textMain);
    doc.text(`Recommended Learning Path: ${roadmapTitle || "Personalized Plan"}`, 14, rY);
    rY += 15;

    const schedule = roadmap.weekly_plan || [];
    schedule.forEach((week: any) => {
      if (rY > pageHeight - 40) {
        doc.addPage();
        currentPage++;
        drawHeader(currentPage);
        rY = 55;
      }

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, rY, pageWidth - 28, 12, 2, 2, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.primary);
      doc.text(`Week ${week.week}: ${week.theme}`, 18, rY + 8);
      rY += 20;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.textMain);
      doc.text("Primary Goals:", 18, rY);
      rY += 6;

      doc.setFont("helvetica", "normal");
      (week.goals || []).forEach((goal: string) => {
        doc.text(`• ${goal}`, 22, rY);
        rY += 5;
      });
      rY += 5;
    });
  }

  doc.addPage();
  currentPage++;
  drawHeader(currentPage);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textMain);
  doc.text("Detailed Question Analysis", 14, 55);

  const tableRows = history.map((h, i) => {
    const qText = h.q?.questionText || "Question text missing";
    const scoreVal = Math.round((h.result?.overall_score || 0) * 100);
    let feedbackStr = h.result?.improvement || h.result?.rationale || "";
    const resultAny = h.result as any;

    const diag = resultAny?.technical_diagnosis;
    if (diag) {
      if (diag.gap?.issue) feedbackStr += `\n\nGAP: ${diag.gap.issue}`;
      if (diag.fix?.action) feedbackStr += `\nFIX: ${diag.fix.action}`;
    }

    const comp = resultAny?.complexity_analysis;
    let complexityStr = "";
    if (comp) {
      complexityStr = `Time: ${comp.actual_time || "N/A"}\nSpace: ${comp.actual_space || "N/A"}`;
    }

    return [`Q${i + 1}`, qText, complexityStr, `${scoreVal}%`, feedbackStr];
  });

  autoTable(doc, {
    startY: 65,
    head: [["#", "Question", "Complexity", "Score", "Analysis & Feedback"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 10, fontStyle: "bold" },
      1: { cellWidth: 55 },
      2: { cellWidth: 25, fontSize: 8 },
      3: { cellWidth: 15, halign: "center", fontStyle: "bold" },
      4: { cellWidth: "auto" },
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: "linebreak",
      lineColor: [226, 232, 240],
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const val = parseInt(data.cell.raw as string);
        if (val >= 70) data.cell.styles.textColor = COLORS.success;
        else if (val >= 40) data.cell.styles.textColor = COLORS.warning;
        else data.cell.styles.textColor = COLORS.danger;
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > currentPage) {
        currentPage = data.pageNumber;
        drawHeader(currentPage);
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  if (finalY < pageHeight - 20) {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont("helvetica", "italic");
    doc.text("Confidential Assessment - Powered by AI Interviewer", 14, finalY);
  }

  doc.save(`Interview_Report_${new Date().toISOString().split("T")[0]}.pdf`);
};

