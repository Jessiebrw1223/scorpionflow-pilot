import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportPayload, ReportRow, ReportRisk } from "./excel-report";

const ORANGE: [number, number, number] = [234, 88, 12];
const DARK: [number, number, number] = [31, 41, 55];
const GREEN: [number, number, number] = [22, 163, 74];
const RED: [number, number, number] = [220, 38, 38];
const AMBER: [number, number, number] = [217, 119, 6];
const TEXT: [number, number, number] = [55, 65, 81];
const MUTED: [number, number, number] = [107, 114, 128];

const PEN = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 }).format(n || 0);

export async function generatePdfReport(p: ReportPayload) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 40;

  // ============ PORTADA ============
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, pageH, "F");

  // Decorative gradient top bar
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW, 6, "F");

  // Logo area (text mark)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...ORANGE);
  doc.text("ScorpionFlow", M, 90);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text("Plataforma de gestión empresarial", M, 108);

  // Title centered
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.setTextColor(255, 255, 255);
  doc.text("Informe Ejecutivo", M, pageH / 2 - 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(220, 220, 220);
  doc.text(p.companyName, M, pageH / 2 + 10);

  // Stat strip
  const stripY = pageH / 2 + 60;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(1);
  doc.line(M, stripY, pageW - M, stripY);

  const stats = [
    { label: "Facturado", value: PEN(p.totals.billed) },
    { label: "Ganancia", value: PEN(p.totals.profit) },
    { label: "Margen", value: `${p.totals.margin.toFixed(1)}%` },
    { label: "Riesgos", value: String(p.risks.length) },
  ];
  const colW = (pageW - M * 2) / stats.length;
  stats.forEach((s, i) => {
    const x = M + colW * i;
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text(s.label.toUpperCase(), x, stripY + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text(s.value, x, stripY + 42);
    doc.setFont("helvetica", "normal");
  });

  // Footer portada
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Generado el ${p.generatedAt.toLocaleDateString("es-PE")} a las ${p.generatedAt.toLocaleTimeString("es-PE")}`,
    M,
    pageH - 50,
  );
  doc.text("Confidencial · Uso interno", pageW - M, pageH - 50, { align: "right" });

  // ============ PÁGINA 2: RESUMEN EJECUTIVO ============
  doc.addPage();
  drawHeader(doc, p, "Resumen Ejecutivo");

  let y = 110;
  // KPI cards (2x3 grid)
  const cards = [
    { label: "Facturado total", value: PEN(p.totals.billed), color: TEXT as [number, number, number] },
    { label: "Costo total", value: PEN(p.totals.cost), color: TEXT as [number, number, number] },
    { label: "Ganancia neta", value: PEN(p.totals.profit), color: (p.totals.profit >= 0 ? GREEN : RED) as [number, number, number] },
    { label: "Margen consolidado", value: `${p.totals.margin.toFixed(1)}%`, color: (p.totals.margin >= 20 ? GREEN : p.totals.margin >= 0 ? AMBER : RED) as [number, number, number] },
    { label: "Riesgos críticos", value: String(p.risks.filter((r) => r.level === "Crítico").length), color: RED },
    { label: "Estado financiero", value: p.totals.profit >= 0 && p.totals.margin >= 15 ? "Saludable" : p.totals.profit >= 0 ? "Atención" : "Crítico", color: (p.totals.profit >= 0 && p.totals.margin >= 15 ? GREEN : p.totals.profit >= 0 ? AMBER : RED) as [number, number, number] },
  ];
  const cardW = (pageW - M * 2 - 20) / 3;
  const cardH = 70;
  cards.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = M + col * (cardW + 10);
    const cy = y + row * (cardH + 10);
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(x, cy, cardW, cardH, 4, 4, "FD");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(c.label.toUpperCase(), x + 12, cy + 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...c.color);
    doc.text(c.value, x + 12, cy + 45);
    doc.setFont("helvetica", "normal");
  });

  y += cardH * 2 + 30;

  // Conclusión preview
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Lectura rápida", M, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  const lines = doc.splitTextToSize(p.conclusion, pageW - M * 2);
  doc.text(lines, M, y);

  drawFooter(doc);

  // ============ PÁGINA 3: PROYECTOS ============
  doc.addPage();
  drawHeader(doc, p, "Detalle de Proyectos");

  autoTable(doc, {
    startY: 110,
    head: [["Proyecto", "Cliente", "Avance", "Facturado", "Costo", "Ganancia", "Margen", "Estado"]],
    body: p.rows.map((r) => [
      r.name,
      r.client,
      `${r.progress}%`,
      PEN(r.billed),
      PEN(r.cost),
      PEN(r.profit),
      `${r.margin.toFixed(1)}%`,
      r.health,
    ]),
    foot: [["TOTALES", "", "", PEN(p.totals.billed), PEN(p.totals.cost), PEN(p.totals.profit), `${p.totals.margin.toFixed(1)}%`, ""]],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 5, textColor: TEXT, lineColor: [229, 231, 235] },
    headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    footStyles: { fillColor: [243, 244, 246], textColor: DARK, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const row = p.rows[data.row.index];
        if (!row) return;
        if (data.column.index === 5) {
          data.cell.styles.textColor = row.profit >= 0 ? GREEN : RED;
          data.cell.styles.fontStyle = "bold";
        }
        if (data.column.index === 6) {
          data.cell.styles.textColor = row.margin >= 20 ? GREEN : row.margin >= 0 ? AMBER : RED;
        }
      }
    },
    didDrawPage: () => drawFooter(doc),
    margin: { left: M, right: M, bottom: 50 },
  });

  // ============ PÁGINA RIESGOS ============
  doc.addPage();
  drawHeader(doc, p, "Riesgos Identificados");

  if (p.risks.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text("No se han identificado riesgos relevantes en este período.", M, 130);
  } else {
    autoTable(doc, {
      startY: 110,
      head: [["Código", "Riesgo", "Proyecto", "Nivel", "Prob.", "Impacto", "Impacto S/", "Responsable", "Estado"]],
      body: p.risks.map((r) => [
        r.code,
        r.title,
        r.project,
        r.level,
        `${r.probability}%`,
        `${r.impact}%`,
        PEN(r.estimatedCost),
        r.owner,
        r.status,
      ]),
      theme: "grid",
      styles: { fontSize: 7.5, cellPadding: 4, textColor: TEXT, lineColor: [229, 231, 235] },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          const lvl = data.cell.text[0];
          const color = lvl === "Crítico" ? RED : lvl === "Alto" ? AMBER : lvl === "Medio" ? [202, 138, 4] : GREEN;
          data.cell.styles.textColor = color as any;
          data.cell.styles.fontStyle = "bold";
        }
      },
      didDrawPage: () => drawFooter(doc),
      margin: { left: M, right: M, bottom: 50 },
    });
  }

  // ============ PÁGINA CONCLUSIÓN ============
  doc.addPage();
  drawHeader(doc, p, "Conclusión Ejecutiva");

  let cy = 120;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  doc.text("Diagnóstico general", M, cy);
  cy += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...TEXT);
  const concLines = doc.splitTextToSize(p.conclusion, pageW - M * 2);
  doc.text(concLines, M, cy);
  cy += concLines.length * 14 + 20;

  // Box destacado
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(...ORANGE);
  doc.roundedRect(M, cy, pageW - M * 2, 80, 4, 4, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...ORANGE);
  doc.text("ACCIÓN RECOMENDADA", M + 14, cy + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT);
  const actionText =
    p.totals.profit < 0
      ? "Reúna al equipo de finanzas esta semana. Revise los proyectos en pérdida y renegocie alcance o precio con clientes."
      : p.risks.filter((r) => r.level === "Crítico").length > 0
      ? "Atienda hoy los riesgos críticos identificados. El impacto económico potencial puede afectar el margen del trimestre."
      : "Mantenga el monitoreo mensual. Aproveche para invertir en mitigaciones preventivas y crecimiento.";
  doc.text(doc.splitTextToSize(actionText, pageW - M * 2 - 28), M + 14, cy + 40);

  drawFooter(doc);

  const fileName = `informe-ejecutivo-${p.generatedAt.toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

function drawHeader(doc: jsPDF, p: ReportPayload, sectionTitle: string) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...ORANGE);
  doc.text("ScorpionFlow", 40, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(p.companyName, 40, 44);
  doc.text(p.generatedAt.toLocaleDateString("es-PE"), pageW - 40, 30, { align: "right" });

  doc.setDrawColor(229, 231, 235);
  doc.line(40, 60, pageW - 40, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...DARK);
  doc.text(sectionTitle, 40, 88);
}

function drawFooter(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pageNum = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("ScorpionFlow · Informe Ejecutivo", 40, pageH - 25);
  doc.text(`Página ${pageNum}`, pageW - 40, pageH - 25, { align: "right" });
}
