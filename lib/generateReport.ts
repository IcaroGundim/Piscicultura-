import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Tank, BercarioLote, RecriaLote, EngordaLote, Premissas, TankPhase } from './types';
import { PHASE_LABELS } from './types';
import { useStore } from './store';

// Augment jsPDF type for lastAutoTable property added by jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

interface ReportData {
  tanks: Tank[];
  bercarioLotes: BercarioLote[];
  recriaLotes: RecriaLote[];
  engordaLotes: EngordaLote[];
  premissas: Premissas;
  locationName?: string;
}

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtBRL = (n: number) =>
  `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * jsPDF's built-in Helvetica font only supports WinAnsiEncoding (Latin-1).
 * Portuguese diacritics and special Unicode chars must be mapped to safe equivalents.
 */
const CHAR_MAP: Record<string, string> = {
  'ã': 'a', 'Ã': 'A',
  'á': 'a', 'Á': 'A',
  'â': 'a', 'Â': 'A',
  'à': 'a', 'À': 'A',
  'é': 'e', 'É': 'E',
  'ê': 'e', 'Ê': 'E',
  'í': 'i', 'Í': 'I',
  'ó': 'o', 'Ó': 'O',
  'ô': 'o', 'Ô': 'O',
  'õ': 'o', 'Õ': 'O',
  'ú': 'u', 'Ú': 'U',
  'ü': 'u', 'Ü': 'U',
  'ç': 'c', 'Ç': 'C',
  '→': '>', '←': '<',
  '—': '-', '–': '-',
  '²': '2', '³': '3',
  '·': '.', '•': '-',
};
const CHAR_RE = new RegExp(`[${Object.keys(CHAR_MAP).join('')}]`, 'g');
const s = (text: unknown): string => String(text ?? '').replace(CHAR_RE, (ch) => CHAR_MAP[ch] || ch);

// ═══════════════════════════════════════════════════════════════
// CHART DRAWING HELPERS
// ═══════════════════════════════════════════════════════════════

type RGB = [number, number, number];

const PHASE_RGB: Record<string, RGB> = {
  bercario: [148, 186, 101],
  recria: [243, 250, 107],
  engorda: [37, 99, 235],
};

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

function hexToRgbTuple(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return [128, 128, 128];
  return [r, g, b];
}

/** Read phase colors from Zustand at PDF generation time; fallback to PHASE_RGB. */
function getPhaseRgb(phase: string): RGB {
  const hex = useStore.getState().phaseColors[phase as TankPhase];
  if (hex && HEX6.test(hex)) {
    const rgb = hexToRgbTuple(hex);
    if (!rgb.some((n) => Number.isNaN(n))) return rgb;
  }
  return PHASE_RGB[phase] ?? [128, 128, 128];
}

function relativeLuminance(rgb: RGB): number {
  const linear = rgb.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

/** Dark text on light headers, white on saturated/dark headers. */
function contrastingTextRgb(bg: RGB): RGB {
  return relativeLuminance(bg) > 0.55 ? [15, 23, 42] : [255, 255, 255];
}

/** Alternate table row: mostly white with a hint of phase color. */
function mixWithWhite(rgb: RGB, phaseWeight = 0.13): RGB {
  const w = 1 - phaseWeight;
  return [
    Math.round(rgb[0] * phaseWeight + 255 * w),
    Math.round(rgb[1] * phaseWeight + 255 * w),
    Math.round(rgb[2] * phaseWeight + 255 * w),
  ];
}

/**
 * Draw a vertical bar chart at given position.
 * Returns the Y position after the chart.
 */
function drawBarChart(
  doc: jsPDF,
  x: number,
  startY: number,
  chartWidth: number,
  chartHeight: number,
  bars: { label: string; value: number; color: RGB }[],
  title: string,
  subtitle: string,
  unit: string
): number {
  const titleAreaH = 14;
  const axisLabelW = 14;
  const bottomLabelH = 10;
  const barAreaTop = startY + titleAreaH;
  const barAreaHeight = chartHeight - titleAreaH - bottomLabelH;
  const barAreaBottom = barAreaTop + barAreaHeight;

  // Background card
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, startY, chartWidth, chartHeight, 3, 3, 'FD');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(title, x + 5, startY + 5.5);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, x + 5, startY + 10);

  if (bars.length === 0) return startY + chartHeight + 4;

  const maxValue = Math.max(...bars.map((b) => b.value), 1);
  const barCount = bars.length;
  const drawAreaLeft = x + axisLabelW;
  const drawAreaRight = x + chartWidth - 6;
  const drawAreaWidth = drawAreaRight - drawAreaLeft;
  const barGap = 8;
  const barWidth = Math.min(22, (drawAreaWidth - barGap * (barCount + 1)) / barCount);
  const totalBarsWidth = barWidth * barCount + barGap * (barCount - 1);
  const barsStartX = drawAreaLeft + (drawAreaWidth - totalBarsWidth) / 2;

  // Y-axis grid lines (4 horizontal lines)
  const gridSteps = 4;
  doc.setDrawColor(230, 233, 240);
  doc.setLineWidth(0.15);
  for (let i = 0; i <= gridSteps; i++) {
    const lineY = barAreaBottom - (barAreaHeight * i) / gridSteps;
    doc.line(drawAreaLeft, lineY, drawAreaRight, lineY);

    const axisVal = (maxValue * i) / gridSteps;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`${axisVal.toFixed(0)}`, drawAreaLeft - 1.5, lineY + 1, { align: 'right' });
  }

  // Bars
  const minBarH = 3; // minimum visible bar height in mm
  bars.forEach((bar, i) => {
    const barX = barsStartX + i * (barWidth + barGap);
    const rawBarH = (bar.value / maxValue) * barAreaHeight;
    const barH = Math.max(rawBarH, bar.value > 0 ? minBarH : 0);
    const barY = barAreaBottom - barH;

    doc.setFillColor(...bar.color);
    // Main body (flat rectangle)
    doc.rect(barX, barY + 1.5, barWidth, Math.max(barH - 1.5, 0.5), 'F');
    // Rounded top cap
    if (barH > 2) {
      doc.roundedRect(barX, barY, barWidth, 3, 1.2, 1.2, 'F');
    }

    // Value label on top of bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...bar.color);
    doc.text(s(`${bar.value.toFixed(1)}`), barX + barWidth / 2, barY - 1.5, { align: 'center' });

    // X-axis label below bar
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(s(bar.label), barX + barWidth / 2, barAreaBottom + 5, { align: 'center' });
  });

  // Unit label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(unit, x + chartWidth - 5, startY + 10, { align: 'right' });

  return startY + chartHeight + 4;
}

/**
 * Draw a donut/pie chart at given position.
 * Returns the Y position after the chart.
 */
function drawDonutChart(
  doc: jsPDF,
  x: number,
  startY: number,
  chartWidth: number,
  chartHeight: number,
  slices: { label: string; value: number; color: RGB; detail?: string }[],
  title: string,
  subtitle: string,
  centerLabel: string
): number {
  // Background card
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, startY, chartWidth, chartHeight, 3, 3, 'FD');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(title, x + 5, startY + 5.5);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, x + 5, startY + 10);

  if (slices.length === 0) return startY + chartHeight + 4;

  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total <= 0) return startY + chartHeight + 4;

  // Chart center
  const cx = x + chartWidth / 2 - 20;
  const cy = startY + chartHeight / 2 + 4;
  const outerR = Math.min(chartWidth, chartHeight) * 0.28;
  const innerR = outerR * 0.55;

  // Draw pie segments using many small arcs
  let startAngle = -Math.PI / 2; // Start from top
  slices.forEach((slice) => {
    const sliceAngle = (slice.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const steps = Math.max(20, Math.floor(sliceAngle * 40));
    const angleStep = sliceAngle / steps;

    doc.setFillColor(...slice.color);

    // Build path using triangles from center
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + i * angleStep;
      const a2 = startAngle + (i + 1) * angleStep;

      // Outer arc segment
      const ox1 = cx + Math.cos(a1) * outerR;
      const oy1 = cy + Math.sin(a1) * outerR;
      const ox2 = cx + Math.cos(a2) * outerR;
      const oy2 = cy + Math.sin(a2) * outerR;

      // Inner arc segment
      const ix1 = cx + Math.cos(a1) * innerR;
      const iy1 = cy + Math.sin(a1) * innerR;
      const ix2 = cx + Math.cos(a2) * innerR;
      const iy2 = cy + Math.sin(a2) * innerR;

      // Draw as quad (two triangles)
      doc.triangle(ox1, oy1, ox2, oy2, ix1, iy1, 'F');
      doc.triangle(ox2, oy2, ix2, iy2, ix1, iy1, 'F');
    }

    startAngle = endAngle;
  });

  // Center circle (white)
  doc.setFillColor(249, 250, 251);
  const centerSteps = 60;
  for (let i = 0; i < centerSteps; i++) {
    const a1 = (i / centerSteps) * 2 * Math.PI;
    const a2 = ((i + 1) / centerSteps) * 2 * Math.PI;
    doc.triangle(
      cx, cy,
      cx + Math.cos(a1) * (innerR - 0.3), cy + Math.sin(a1) * (innerR - 0.3),
      cx + Math.cos(a2) * (innerR - 0.3), cy + Math.sin(a2) * (innerR - 0.3),
      'F'
    );
  }

  // Center text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text(s(centerLabel), cx, cy + 1, { align: 'center' });

  // Legend on the right
  const legendX = cx + outerR + 12;
  let legendY = startY + 18;

  slices.forEach((slice) => {
    const pct = ((slice.value / total) * 100).toFixed(1);

    // Color dot
    doc.setFillColor(...slice.color);
    doc.circle(legendX, legendY - 0.8, 1.5, 'F');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(s(slice.label), legendX + 4, legendY);

    // Value + percent
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(s(`${fmt(slice.value)} kg  (${pct}%)`), legendX + 4, legendY + 4);

    if (slice.detail) {
      doc.setFontSize(6);
      doc.text(s(slice.detail), legendX + 4, legendY + 7.5);
      legendY += 12;
    } else {
      legendY += 9;
    }
  });

  return startY + chartHeight + 4;
}

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════

export function generateReport(data: ReportData) {
  const { tanks, bercarioLotes, recriaLotes, engordaLotes, premissas } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 0;

  // ── Colors (accent = fase Engorda configurada) ──
  const accentRgb = getPhaseRgb('engorda');
  const accentTextRgb = contrastingTextRgb(accentRgb);
  const darkText: RGB = [30, 41, 59];
  const mutedText: RGB = [100, 116, 139];

  // ── Helper: add page if needed ──
  const ensureSpace = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // ── Helper: section title ──
  const sectionTitle = (title: string) => {
    ensureSpace(16);
    doc.setFillColor(...accentRgb);
    doc.roundedRect(marginLeft, y, contentWidth, 9, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...accentTextRgb);
    doc.text(s(title.toUpperCase()), marginLeft + 4, y + 6.3);
    y += 13;
    doc.setTextColor(...darkText);
  };

  // ── Helper: key-value line ──
  const kvLine = (key: string, value: string) => {
    ensureSpace(7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mutedText);
    doc.text(s(key), marginLeft + 2, y);
    doc.setTextColor(...darkText);
    doc.setFont('helvetica', 'bold');
    doc.text(s(value), pageWidth - marginRight - 2, y, { align: 'right' });
    y += 5.5;
  };

  // ── Pre-compute data used in multiple places ──
  const racaoMesBercario = bercarioLotes.reduce((s, l) => s + l.racao_mes_sc, 0);
  const racaoMesRecria = recriaLotes.reduce((s, l) => s + l.racao_mes_sc, 0);
  const racaoMesEngorda = engordaLotes.reduce((s, l) => s + l.racao_mes_sc, 0);
  const racaoMesTotal = racaoMesBercario + racaoMesRecria + racaoMesEngorda;

  const racaoTotalBercario = bercarioLotes.reduce((s, l) => s + l.racao_total_sc, 0);
  const racaoTotalRecria = recriaLotes.reduce((s, l) => s + l.racao_total_sc, 0);
  const racaoTotalEngorda = engordaLotes.reduce((s, l) => s + l.racao_total_sc, 0);
  const racaoTotal = racaoTotalBercario + racaoTotalRecria + racaoTotalEngorda;

  const totalFishBercario = bercarioLotes.reduce((s, l) => s + l.qtd_peixes, 0);
  const totalFishRecria = recriaLotes.reduce((s, l) => s + l.qtd_peixes, 0);
  const totalFishEngorda = engordaLotes.reduce((s, l) => s + l.qtd_peixes, 0);
  const totalFish = totalFishBercario + totalFishRecria + totalFishEngorda;

  const biomassBercario = bercarioLotes.reduce((s, l) => s + l.peso_total_kg, 0);
  const biomassRecria = recriaLotes.reduce((s, l) => s + l.peso_total_kg, 0);
  const biomassEngorda = engordaLotes.reduce((s, l) => s + l.peso_total_kg, 0);
  const totalBiomass = biomassBercario + biomassRecria + biomassEngorda;

  const countByPhase = (phase: string) => tanks.filter((t) => t.phase === phase).length;
  const totalArea = tanks.reduce((s, t) => s + t.area_ha, 0);

  // ═══════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════

  doc.setFillColor(...accentRgb);
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...accentTextRgb);
  doc.text(s('Relatorio de Producao'), marginLeft, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(s(`Manati${data.locationName ? ' — ' + data.locationName : ''}`), marginLeft, 23);

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  doc.setFontSize(8);
  doc.text(s(`Gerado em ${dateStr} as ${timeStr}`), pageWidth - marginRight, 30, { align: 'right' });

  y = 44;

  // ═══════════════════════════════════════════════════════════════
  // 1. PREMISSAS DE PRODUÇÃO
  // ═══════════════════════════════════════════════════════════════

  sectionTitle('Premissas de Producao');
  kvLine('Producao Anual', `${fmt(premissas.producao_anual)} kg`);
  kvLine('Conversao Alimentar', `${fmt(premissas.conversao_alimentar, 1)} kg/kg`);
  kvLine('Ciclos por Ano', `${fmt(premissas.ciclos_ano, 1)}`);
  kvLine('Preco de Venda', `R$ ${fmt(premissas.preco_venda, 2)}/kg`);
  kvLine('Peso Final Engorda', `${fmt(premissas.peso_final_engorda, 1)} kg`);
  kvLine('Transferencia Recria > Engorda', `${fmt(premissas.peso_transfer_recria, 2)} kg`);
  kvLine('Transferencia Bercario > Recria', `${fmt(premissas.peso_transfer_bercario, 2)} kg`);
  kvLine('Periodo de Engorda', `${premissas.periodo_engorda} meses`);
  kvLine('Periodo de Recria', `${premissas.periodo_recria} meses`);
  y += 4;

  // ═══════════════════════════════════════════════════════════════
  // 2. CHARTS — RAÇÃO BY PHASE + BIOMASS DONUT (side-by-side)
  // ═══════════════════════════════════════════════════════════════

  const chartH = 72;
  ensureSpace(chartH + 6);

  const halfW = (contentWidth - 4) / 2;

  // Bar chart — feed by phase
  y = drawBarChart(
    doc,
    marginLeft,
    y,
    halfW,
    chartH,
    [
      { label: 'Bercario', value: racaoMesBercario, color: getPhaseRgb('bercario') },
      { label: 'Recria', value: racaoMesRecria, color: getPhaseRgb('recria') },
      { label: 'Engorda', value: racaoMesEngorda, color: getPhaseRgb('engorda') },
    ],
    'Consumo de Racao por Fase',
    `Total: ${fmt(racaoMesTotal, 1)} sacos/mes`,
    'sc/mes'
  );

  // Reset y to same start for the donut (side-by-side)
  y -= (chartH + 4);

  drawDonutChart(
    doc,
    marginLeft + halfW + 4,
    y,
    halfW,
    chartH,
    [
      { label: 'Bercario', value: biomassBercario, color: getPhaseRgb('bercario'), detail: `${fmt(totalFishBercario)} peixes` },
      { label: 'Recria', value: biomassRecria, color: getPhaseRgb('recria'), detail: `${fmt(totalFishRecria)} peixes` },
      { label: 'Engorda', value: biomassEngorda, color: getPhaseRgb('engorda'), detail: `${fmt(totalFishEngorda)} peixes` },
    ],
    'Distribuicao de Biomassa',
    `Total: ${fmt(totalBiomass)} kg`,
    fmt(totalBiomass) + ' kg'
  );

  y += chartH + 4;

  // ═══════════════════════════════════════════════════════════════
  // 3. VISÃO GERAL DOS TANQUES
  // ═══════════════════════════════════════════════════════════════

  sectionTitle('Visao Geral dos Tanques');

  const tanksByPhase = [
    { phase: 'bercario' as const, count: countByPhase('bercario') },
    { phase: 'recria' as const, count: countByPhase('recria') },
    { phase: 'engorda' as const, count: countByPhase('engorda') },
    { phase: 'vazio' as const, count: countByPhase('vazio') },
  ];

  kvLine('Total de Tanques', `${tanks.length}`);
  kvLine('Area Total', `${fmt(totalArea, 2)} ha`);
  tanksByPhase.forEach(({ phase, count }) => {
    if (count > 0) kvLine(`  ${PHASE_LABELS[phase]}`, `${count} tanques`);
  });
  y += 4;

  // Tank table
  autoTable(doc, {
    startY: y,
    margin: { left: marginLeft, right: marginRight },
    head: [['Tanque', 'Fase', 'Subfase', 'Area (m2)', 'Area (ha)']],
    body: tanks.map((t) => [
      `Tanque ${t.id}`,
      s(PHASE_LABELS[t.phase]),
      s(t.subfase || '-'),
      fmt(t.area_m2),
      fmt(t.area_ha, 2),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: accentRgb, textColor: accentTextRgb, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: mixWithWhite(accentRgb, 0.1) },
    theme: 'grid',
  });

  y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;

  // ═══════════════════════════════════════════════════════════════
  // 4. LOTES — BERÇÁRIO
  // ═══════════════════════════════════════════════════════════════

  if (bercarioLotes.length > 0) {
    sectionTitle('Lotes - Bercario');
    const headB = getPhaseRgb('bercario');

    autoTable(doc, {
      startY: y,
      margin: { left: marginLeft, right: marginRight },
      head: [['Tanque', 'Nome', 'Peixes', 'Peso Entrada (kg)', 'Peso Total (kg)', 'Dens. (kg/m2)', 'Racao/Mes (sc)', 'Racao Total (sc)']],
      body: bercarioLotes.map((l) => [
        `T${l.tankId}`,
        s(l.nome),
        fmt(l.qtd_peixes),
        fmt(l.peso_entrada_kg, 1),
        fmt(l.peso_total_kg, 1),
        fmt(l.densidade_kg_m2, 3),
        fmt(l.racao_mes_sc, 2),
        fmt(l.racao_total_sc, 1),
      ]),
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: {
        fillColor: headB,
        textColor: contrastingTextRgb(headB),
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: { fillColor: mixWithWhite(headB) },
      theme: 'grid',
    });

    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. LOTES — RECRIA
  // ═══════════════════════════════════════════════════════════════

  if (recriaLotes.length > 0) {
    sectionTitle('Lotes - Recria');
    const headR = getPhaseRgb('recria');

    autoTable(doc, {
      startY: y,
      margin: { left: marginLeft, right: marginRight },
      head: [['Tanque', 'Peixes', 'Peso Ent. (kg)', 'Peso Total (kg)', 'Dens. (kg/m2)', 'Racao/Mes (sc)', 'Racao Total (sc)', 'Periodo (m)']],
      body: recriaLotes.map((l) => [
        `T${l.tankId}`,
        fmt(l.qtd_peixes),
        fmt(l.peso_entrada_kg, 1),
        fmt(l.peso_total_kg, 1),
        fmt(l.densidade_kg_m2, 3),
        fmt(l.racao_mes_sc, 2),
        fmt(l.racao_total_sc, 1),
        `${l.periodo_meses}`,
      ]),
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: {
        fillColor: headR,
        textColor: contrastingTextRgb(headR),
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: { fillColor: mixWithWhite(headR) },
      theme: 'grid',
    });

    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. LOTES — ENGORDA
  // ═══════════════════════════════════════════════════════════════

  if (engordaLotes.length > 0) {
    sectionTitle('Lotes - Engorda');
    const headE = getPhaseRgb('engorda');

    autoTable(doc, {
      startY: y,
      margin: { left: marginLeft, right: marginRight },
      head: [['Tanque', 'Modulo', 'Peixes', 'Peso Ent. (kg)', 'Peso Total (kg)', 'Conv. Alim.', 'Dens. (kg/m2)', 'Racao/Mes (sc)', 'Racao Total (sc)', 'Per. (m)']],
      body: engordaLotes.map((l) => [
        `T${l.tankId}`,
        s(l.modulo),
        fmt(l.qtd_peixes),
        fmt(l.peso_entrada_kg, 1),
        fmt(l.peso_total_kg, 1),
        fmt(l.conversao_alimentar, 1),
        fmt(l.densidade_kg_m2, 4),
        fmt(l.racao_mes_sc, 1),
        fmt(l.racao_total_sc, 1),
        `${l.periodo_meses}`,
      ]),
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: {
        fillColor: headE,
        textColor: contrastingTextRgb(headE),
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: { fillColor: mixWithWhite(headE) },
      theme: 'grid',
    });

    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. RESUMO DE RAÇÃO
  // ═══════════════════════════════════════════════════════════════

  sectionTitle('Resumo de Racao');

  kvLine('Racao/Mes - Bercario', `${fmt(racaoMesBercario, 2)} sc`);
  kvLine('Racao/Mes - Recria', `${fmt(racaoMesRecria, 2)} sc`);
  kvLine('Racao/Mes - Engorda', `${fmt(racaoMesEngorda, 1)} sc`);
  kvLine('Racao/Mes - TOTAL', `${fmt(racaoMesTotal, 1)} sc`);
  y += 2;
  kvLine('Racao Total (ciclo) - Bercario', `${fmt(racaoTotalBercario, 1)} sc`);
  kvLine('Racao Total (ciclo) - Recria', `${fmt(racaoTotalRecria, 1)} sc`);
  kvLine('Racao Total (ciclo) - Engorda', `${fmt(racaoTotalEngorda, 1)} sc`);
  kvLine('Racao Total (ciclo) - TOTAL', `${fmt(racaoTotal, 1)} sc`);
  y += 4;

  // ═══════════════════════════════════════════════════════════════
  // 8. RESUMO DE PEIXES
  // ═══════════════════════════════════════════════════════════════

  sectionTitle('Resumo de Peixes');

  kvLine('Peixes - Bercario', fmt(totalFishBercario));
  kvLine('Peixes - Recria', fmt(totalFishRecria));
  kvLine('Peixes - Engorda', fmt(totalFishEngorda));
  kvLine('Peixes - TOTAL', fmt(totalFish));
  y += 2;
  kvLine('Biomassa Total em Engorda', `${fmt(biomassEngorda)} kg`);
  y += 4;

  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(...mutedText);
    doc.text(
      s(`Manati${data.locationName ? ' — ' + data.locationName : ''} | Pagina ${i} de ${totalPages}`),
      pageWidth / 2,
      pageH - 8,
      { align: 'center' }
    );
  }

  // ── Save ──
  const locationSlug = data.locationName
    ? data.locationName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')
    : '';
  doc.save(`relatorio_piscicultura${locationSlug ? '_' + locationSlug : ''}_${now.toISOString().slice(0, 10)}.pdf`);
}
