import type jsPDF from 'jspdf';

// Augment jsPDF type for lastAutoTable property added by jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

// ═══════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════

export const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const fmtBRL = (n: number) =>
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
export const s = (text: unknown): string =>
  String(text ?? '').replace(CHAR_RE, (ch) => CHAR_MAP[ch] || ch);

/** Slug de nome de localização para nome de arquivo. */
export const locationSlug = (locationName?: string): string =>
  locationName
    ? locationName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, '_')
    : '';

// ═══════════════════════════════════════════════════════════════
// COLOR HELPERS
// ═══════════════════════════════════════════════════════════════

export type RGB = [number, number, number];

export const HEX6 = /^#[0-9A-Fa-f]{6}$/;

export function hexToRgbTuple(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return [128, 128, 128];
  return [r, g, b];
}

export function relativeLuminance(rgb: RGB): number {
  const linear = rgb.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

/** Dark text on light headers, white on saturated/dark headers. */
export function contrastingTextRgb(bg: RGB): RGB {
  return relativeLuminance(bg) > 0.55 ? [15, 23, 42] : [255, 255, 255];
}

/** Alternate table row: mostly white with a hint of accent color. */
export function mixWithWhite(rgb: RGB, phaseWeight = 0.13): RGB {
  const w = 1 - phaseWeight;
  return [
    Math.round(rgb[0] * phaseWeight + 255 * w),
    Math.round(rgb[1] * phaseWeight + 255 * w),
    Math.round(rgb[2] * phaseWeight + 255 * w),
  ];
}

// ═══════════════════════════════════════════════════════════════
// CHART DRAWING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Draw a vertical bar chart at given position.
 * `formatValue` controls the label rendered on top of each bar and the Y-axis
 * ticks (default: one-decimal / integer, preserving the production report look).
 * Returns the Y position after the chart.
 */
export function drawBarChart(
  doc: jsPDF,
  x: number,
  startY: number,
  chartWidth: number,
  chartHeight: number,
  bars: { label: string; value: number; color: RGB }[],
  title: string,
  subtitle: string,
  unit: string,
  formatValue?: {
    bar?: (n: number) => string;
    axis?: (n: number) => string;
  }
): number {
  const barFmt = formatValue?.bar ?? ((n: number) => n.toFixed(1));
  const axisFmt = formatValue?.axis ?? ((n: number) => n.toFixed(0));
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
  doc.text(s(title), x + 5, startY + 5.5);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(s(subtitle), x + 5, startY + 10);

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
    doc.text(s(axisFmt(axisVal)), drawAreaLeft - 1.5, lineY + 1, { align: 'right' });
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
    doc.text(s(barFmt(bar.value)), barX + barWidth / 2, barY - 1.5, { align: 'center' });

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
  doc.text(s(unit), x + chartWidth - 5, startY + 10, { align: 'right' });

  return startY + chartHeight + 4;
}

/**
 * Draw a donut/pie chart at given position.
 * `formatSliceValue` controls the legend value (default: `"<n> kg"`, preserving
 * the production report's biomass donut).
 * Returns the Y position after the chart.
 */
export function drawDonutChart(
  doc: jsPDF,
  x: number,
  startY: number,
  chartWidth: number,
  chartHeight: number,
  slices: { label: string; value: number; color: RGB; detail?: string }[],
  title: string,
  subtitle: string,
  centerLabel: string,
  formatSliceValue?: (n: number) => string
): number {
  const sliceFmt = formatSliceValue ?? ((n: number) => `${fmt(n)} kg`);

  // Background card
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, startY, chartWidth, chartHeight, 3, 3, 'FD');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(s(title), x + 5, startY + 5.5);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(s(subtitle), x + 5, startY + 10);

  if (slices.length === 0) return startY + chartHeight + 4;

  const total = slices.reduce((acc, sl) => acc + sl.value, 0);
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
    doc.text(s(`${sliceFmt(slice.value)}  (${pct}%)`), legendX + 4, legendY + 4);

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
