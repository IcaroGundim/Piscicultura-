import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Tank, BercarioLote, RecriaLote, EngordaLote, Premissas, TankPhase } from './types';
import { PHASE_LABELS } from './types';
import { useStore } from './store';
import {
  fmt,
  s,
  type RGB,
  HEX6,
  hexToRgbTuple,
  contrastingTextRgb,
  mixWithWhite,
  drawBarChart,
  drawDonutChart,
} from './pdf/reportKit';

interface ReportData {
  tanks: Tank[];
  bercarioLotes: BercarioLote[];
  recriaLotes: RecriaLote[];
  engordaLotes: EngordaLote[];
  premissas: Premissas;
  locationName?: string;
}

const PHASE_RGB: Record<string, RGB> = {
  bercario: [148, 186, 101],
  recria: [243, 250, 107],
  engorda: [37, 99, 235],
};

/** Read phase colors from Zustand at PDF generation time; fallback to PHASE_RGB. */
function getPhaseRgb(phase: string): RGB {
  const hex = useStore.getState().phaseColors[phase as TankPhase];
  if (hex && HEX6.test(hex)) {
    const rgb = hexToRgbTuple(hex);
    if (!rgb.some((n) => Number.isNaN(n))) return rgb;
  }
  return PHASE_RGB[phase] ?? [128, 128, 128];
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
      head: [['Tanque', 'Nome', 'Peixes', 'Peso Entrada (kg)', 'Peso Total (kg)', 'Dens. (kg/m3)', 'Racao/Mes (sc)', 'Racao Total (sc)']],
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
      head: [['Tanque', 'Peixes', 'Peso Ent. (kg)', 'Peso Total (kg)', 'Dens. (kg/m3)', 'Racao/Mes (sc)', 'Racao Total (sc)', 'Periodo (m)']],
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
      head: [['Tanque', 'Modulo', 'Peixes', 'Peso Ent. (kg)', 'Peso Total (kg)', 'Conv. Alim.', 'Dens. (kg/m3)', 'Racao/Mes (sc)', 'Racao Total (sc)', 'Per. (m)']],
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
