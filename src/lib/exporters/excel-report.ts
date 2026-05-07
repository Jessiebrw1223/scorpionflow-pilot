import * as XLSX from "xlsx";

export interface ReportRow {
  name: string;
  client: string;
  status: string;
  progress: number;
  billed: number;
  cost: number;
  profit: number;
  margin: number;
  health: string;
}

export interface ReportRisk {
  code: string;
  title: string;
  project: string;
  category: string;
  level: string;
  probability: number;
  impact: number;
  estimatedCost: number;
  owner: string;
  status: string;
}

export interface ReportTotals {
  billed: number;
  cost: number;
  profit: number;
  margin: number;
}

export interface ReportPayload {
  companyName: string;
  generatedAt: Date;
  rows: ReportRow[];
  risks: ReportRisk[];
  totals: ReportTotals;
  conclusion: string;
  currency: string;
}

const PEN = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 }).format(n || 0);

export async function generateExcelReport(p: ReportPayload) {
  const wb = XLSX.utils.book_new();

  // === Sheet 1: Resumen Ejecutivo ===
  const resumenAoa: any[][] = [
    ["INFORME EJECUTIVO"],
    [p.companyName],
    [`Generado: ${p.generatedAt.toLocaleDateString("es-PE")} ${p.generatedAt.toLocaleTimeString("es-PE")}`],
    [],
    ["INDICADORES CLAVE"],
    ["Concepto", "Valor"],
    ["Facturado total", PEN(p.totals.billed)],
    ["Costo total", PEN(p.totals.cost)],
    ["Ganancia neta", PEN(p.totals.profit)],
    ["Margen consolidado", `${p.totals.margin.toFixed(1)}%`],
    ["Proyectos analizados", p.rows.length],
    ["Riesgos identificados", p.risks.length],
    ["Riesgos críticos", p.risks.filter((r) => r.level === "Crítico").length],
    [],
    ["CONCLUSIÓN EJECUTIVA"],
    [p.conclusion],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(resumenAoa);
  ws1["!cols"] = [{ wch: 32 }, { wch: 28 }];
  ws1["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    { s: { r: 14, c: 0 }, e: { r: 14, c: 1 } },
    { s: { r: 15, c: 0 }, e: { r: 15, c: 1 } },
  ];
  applyHeaderStyle(ws1, "A1");
  applySubHeaderStyle(ws1, "A5");
  applySubHeaderStyle(ws1, "A15");
  applyTableHeader(ws1, "A6:B6");
  // Frozen top
  ws1["!freeze"] = { xSplit: 0, ySplit: 6 } as any;
  XLSX.utils.book_append_sheet(wb, ws1, "Resumen Ejecutivo");

  // === Sheet 2: Detalle Proyectos ===
  const detalleHeader = ["Proyecto", "Cliente", "Estado", "Avance %", "Facturado", "Costado", "Ganancia", "Margen %", "Salud"];
  const detalleRows = p.rows.map((r) => [
    r.name,
    r.client,
    r.status,
    r.progress,
    Number(r.billed.toFixed(2)),
    Number(r.cost.toFixed(2)),
    Number(r.profit.toFixed(2)),
    Number(r.margin.toFixed(2)),
    r.health,
  ]);
  const totalRow = ["TOTALES", "", "", "", Number(p.totals.billed.toFixed(2)), Number(p.totals.cost.toFixed(2)), Number(p.totals.profit.toFixed(2)), Number(p.totals.margin.toFixed(2)), ""];
  const ws2 = XLSX.utils.aoa_to_sheet([detalleHeader, ...detalleRows, [], totalRow]);
  ws2["!cols"] = [{ wch: 32 }, { wch: 24 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 18 }];
  applyTableHeader(ws2, `A1:I1`);
  // Format currency cells
  for (let i = 0; i < detalleRows.length; i++) {
    const r = i + 2;
    ["E", "F", "G"].forEach((col) => {
      const cell = ws2[`${col}${r}`];
      if (cell) cell.z = '"S/" #,##0.00';
    });
    const m = ws2[`H${r}`];
    if (m) m.z = "0.00\\%";
    // Color profit
    const profit = detalleRows[i][6] as number;
    const cell = ws2[`G${r}`];
    if (cell) cell.s = { font: { color: { rgb: profit >= 0 ? "008000" : "C00000" }, bold: true } };
  }
  // Total row styling
  const totalRowIdx = detalleRows.length + 3;
  ["A", "E", "F", "G", "H"].forEach((c) => {
    const cell = ws2[`${c}${totalRowIdx}`];
    if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: "F2F2F2" } } };
    if (cell && (c === "E" || c === "F" || c === "G")) cell.z = '"S/" #,##0.00';
    if (cell && c === "H") cell.z = "0.00\\%";
  });
  ws2["!freeze"] = { xSplit: 0, ySplit: 1 } as any;
  XLSX.utils.book_append_sheet(wb, ws2, "Detalle Proyectos");

  // === Sheet 3: Riesgos ===
  const riesgosHeader = ["Código", "Riesgo", "Proyecto", "Categoría", "Nivel", "Prob. %", "Impacto %", "Impacto S/", "Responsable", "Estado"];
  const riesgosRows = p.risks.map((r) => [
    r.code, r.title, r.project, r.category, r.level, r.probability, r.impact, Number(r.estimatedCost.toFixed(2)), r.owner, r.status,
  ]);
  const ws3 = XLSX.utils.aoa_to_sheet([riesgosHeader, ...riesgosRows]);
  ws3["!cols"] = [{ wch: 10 }, { wch: 36 }, { wch: 26 }, { wch: 14 }, { wch: 12 }, { wch: 9 }, { wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 16 }];
  applyTableHeader(ws3, `A1:J1`);
  for (let i = 0; i < riesgosRows.length; i++) {
    const r = i + 2;
    const c = ws3[`H${r}`];
    if (c) c.z = '"S/" #,##0.00';
    const lvl = riesgosRows[i][4] as string;
    const lvlCell = ws3[`E${r}`];
    if (lvlCell) {
      const color = lvl === "Crítico" ? "C00000" : lvl === "Alto" ? "ED7D31" : lvl === "Medio" ? "FFC000" : "00B050";
      lvlCell.s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: color } }, alignment: { horizontal: "center" } };
    }
  }
  ws3["!freeze"] = { xSplit: 0, ySplit: 1 } as any;
  XLSX.utils.book_append_sheet(wb, ws3, "Riesgos");

  // === Sheet 4: Conclusiones ===
  const concluAoa: any[][] = [
    ["CONCLUSIONES Y RECOMENDACIONES"],
    [],
    ["Resumen financiero"],
    [p.conclusion],
    [],
    ["Indicadores"],
    ["Margen consolidado", `${p.totals.margin.toFixed(1)}%`],
    ["Ganancia neta", PEN(p.totals.profit)],
    ["Riesgos críticos abiertos", p.risks.filter((r) => r.level === "Crítico").length],
    ["Impacto económico potencial", PEN(p.risks.reduce((s, r) => s + r.estimatedCost, 0))],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(concluAoa);
  ws4["!cols"] = [{ wch: 36 }, { wch: 28 }];
  applyHeaderStyle(ws4, "A1");
  applySubHeaderStyle(ws4, "A3");
  applySubHeaderStyle(ws4, "A6");
  XLSX.utils.book_append_sheet(wb, ws4, "Conclusiones");

  const fileName = `informe-ejecutivo-${p.generatedAt.toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function applyHeaderStyle(ws: XLSX.WorkSheet, addr: string) {
  if (!ws[addr]) return;
  ws[addr].s = {
    font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1F2937" } },
    alignment: { horizontal: "center", vertical: "center" },
  };
}
function applySubHeaderStyle(ws: XLSX.WorkSheet, addr: string) {
  if (!ws[addr]) return;
  ws[addr].s = {
    font: { bold: true, sz: 12, color: { rgb: "EA580C" } },
  };
}
function applyTableHeader(ws: XLSX.WorkSheet, range: string) {
  const decoded = XLSX.utils.decode_range(range);
  for (let c = decoded.s.c; c <= decoded.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: decoded.s.r, c });
    if (!ws[addr]) continue;
    ws[addr].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "374151" } },
      alignment: { horizontal: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  }
}
