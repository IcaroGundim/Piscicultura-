import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  Tank,
  BercarioLote,
  RecriaLote,
  EngordaLote,
  Premissas,
  TankPhase,
  Custos,
  Movimentacao,
} from './types';
import { PHASE_LABELS, CATEGORIA_CUSTO_LABELS, CATEGORIA_RECEITA_LABELS } from './types';
import { useStore } from './store';
import {
  MESES_CURTOS,
  CATEGORIA_UNIDADES,
  receitaTotalAnual,
  totalDespesasAnuais,
  composicaoPorCategoria,
  resumoAnual,
  isCusto,
  isReceita,
  totalLancamento,
} from './lancamentos';
import { extratoComSaldo } from './movimentacoes';
import {
  fmt,
  fmtBRL,
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
  custos: Custos;
  movimentacoes: Movimentacao[];
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
  const { tanks, bercarioLotes, recriaLotes, engordaLotes, premissas, custos, movimentacoes } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 0;

  // ── Colors (accent = teal do header da pagina, #1d5e69) ──
  const accentRgb: RGB = [29, 94, 105];
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
  // 9. RESULTADO FINANCEIRO (Custos e Receitas)
  // ═══════════════════════════════════════════════════════════════

  const lancamentos = custos.lancamentos;

  if (lancamentos.length > 0) {
    const receitaTotal = receitaTotalAnual(lancamentos);
    const custoTotal = totalDespesasAnuais(lancamentos);
    const resultado = receitaTotal - custoTotal;
    const margem = receitaTotal > 0 ? (resultado / receitaTotal) * 100 : 0;

    sectionTitle('Resultado Financeiro');
    kvLine('Receita Total', fmtBRL(receitaTotal));
    kvLine('Custo Total', fmtBRL(custoTotal));
    kvLine(resultado >= 0 ? 'Resultado (lucro)' : 'Resultado (prejuizo)', fmtBRL(resultado));
    kvLine('Margem Liquida', `${fmt(margem, 1)} %`);
    y += 4;

    const finChartH = 72;
    const brl = (n: number) => (Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0));

    // Barras: Receita x Custo x Resultado (todos os anos).
    const receitaRgb: RGB = [16, 185, 129];
    const custoRgb: RGB = [239, 68, 68];
    const resultadoRgb: RGB = resultado >= 0 ? accentRgb : [239, 68, 68];

    ensureSpace(finChartH + 6);
    y = drawBarChart(
      doc,
      marginLeft,
      y,
      contentWidth,
      finChartH,
      [
        { label: 'Receita', value: receitaTotal, color: receitaRgb },
        { label: 'Custo', value: custoTotal, color: custoRgb },
        { label: resultado >= 0 ? 'Lucro' : 'Prejuizo', value: Math.abs(resultado), color: resultadoRgb },
      ],
      'Receita x Custo x Resultado',
      `Margem liquida: ${fmt(margem, 1)}%`,
      'R$',
      { bar: brl, axis: brl }
    );

    // Donuts de composição por categoria (custos / receitas).
    const composCustos = composicaoPorCategoria(lancamentos, 'custo');
    const composReceitas = composicaoPorCategoria(lancamentos, 'receita');
    const donuts: Array<{ title: string; total: number; slices: typeof composCustos }> = [];
    if (composCustos.length > 0) {
      donuts.push({ title: 'Composicao de Custos', total: custoTotal, slices: composCustos });
    }
    if (composReceitas.length > 0) {
      donuts.push({ title: 'Composicao de Receitas', total: receitaTotal, slices: composReceitas });
    }

    if (donuts.length > 0) {
      ensureSpace(finChartH + 6);
      const donutW = donuts.length === 2 ? (contentWidth - 4) / 2 : contentWidth;
      donuts.forEach((d, i) => {
        drawDonutChart(
          doc,
          marginLeft + i * (donutW + 4),
          y,
          donutW,
          finChartH,
          d.slices.map((f) => ({ label: f.label, value: f.valor, color: hexToRgbTuple(f.color) })),
          d.title,
          `Total: ${fmtBRL(d.total)}`,
          fmtBRL(d.total),
          (n) => fmtBRL(n)
        );
      });
      y += finChartH + 4;
    }

    // Tabela: resultado por ano (mais recente primeiro).
    const porAno = resumoAnual(lancamentos);
    if (porAno.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: marginLeft, right: marginRight },
        head: [['Ano', 'Receita', 'Custo', 'Resultado', 'Margem']],
        body: porAno
          .slice()
          .reverse()
          .map((p) => [
            String(p.ano),
            fmtBRL(p.receita),
            fmtBRL(p.custo),
            fmtBRL(p.resultado),
            `${fmt(p.receita > 0 ? (p.resultado / p.receita) * 100 : 0, 1)} %`,
          ]),
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right', fontStyle: 'bold' },
          4: { halign: 'right' },
        },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: accentRgb, textColor: accentTextRgb, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: mixWithWhite(accentRgb, 0.1) },
        theme: 'grid',
      });
      y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 9b. CUSTOS LANÇADOS (detalhamento por lançamento)
  // ═══════════════════════════════════════════════════════════════

  const custosLancados = lancamentos
    .filter(isCusto)
    .sort((a, b) => b.ano - a.ano || a.mes - b.mes || a.id.localeCompare(b.id));

  if (custosLancados.length > 0) {
    const totalCustosLancados = custosLancados.reduce((acc, l) => acc + totalLancamento(l), 0);

    sectionTitle('Custos Lancados');
    autoTable(doc, {
      startY: y,
      margin: { left: marginLeft, right: marginRight },
      head: [['Periodo', 'Categoria', 'Descricao', 'Qtd', 'Preco un.', 'Total']],
      body: custosLancados.map((l) => [
        `${MESES_CURTOS[l.mes - 1] ?? '-'}/${l.ano}`,
        s(CATEGORIA_CUSTO_LABELS[l.categoria as keyof typeof CATEGORIA_CUSTO_LABELS] ?? l.categoria),
        s(l.descricao || '-'),
        `${l.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${
          CATEGORIA_UNIDADES[l.categoria] ?? ''
        }`.trim(),
        fmtBRL(l.precoUnitario),
        fmtBRL(totalLancamento(l)),
      ]),
      foot: [['', '', '', '', 'TOTAL', fmtBRL(totalCustosLancados)]],
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
      },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: accentRgb, textColor: accentTextRgb, fontStyle: 'bold', fontSize: 8 },
      footStyles: {
        fillColor: mixWithWhite(accentRgb, 0.2),
        textColor: darkText,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'right',
      },
      alternateRowStyles: { fillColor: mixWithWhite(accentRgb, 0.1) },
      theme: 'grid',
    });
    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;
  }

  // ═══════════════════════════════════════════════════════════════
  // 9c. RECEITAS LANÇADAS (detalhamento por lançamento)
  // ═══════════════════════════════════════════════════════════════

  const receitasLancadas = lancamentos
    .filter(isReceita)
    .sort((a, b) => b.ano - a.ano || a.mes - b.mes || a.id.localeCompare(b.id));

  if (receitasLancadas.length > 0) {
    const totalReceitasLancadas = receitasLancadas.reduce((acc, l) => acc + totalLancamento(l), 0);

    sectionTitle('Receitas Lancadas');
    autoTable(doc, {
      startY: y,
      margin: { left: marginLeft, right: marginRight },
      head: [['Periodo', 'Categoria', 'Descricao', 'Qtd', 'Preco un.', 'Total']],
      body: receitasLancadas.map((l) => [
        `${MESES_CURTOS[l.mes - 1] ?? '-'}/${l.ano}`,
        s(CATEGORIA_RECEITA_LABELS[l.categoria as keyof typeof CATEGORIA_RECEITA_LABELS] ?? l.categoria),
        s(l.descricao || '-'),
        `${l.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${
          CATEGORIA_UNIDADES[l.categoria] ?? ''
        }`.trim(),
        fmtBRL(l.precoUnitario),
        fmtBRL(totalLancamento(l)),
      ]),
      foot: [['', '', '', '', 'TOTAL', fmtBRL(totalReceitasLancadas)]],
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
      },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: accentRgb, textColor: accentTextRgb, fontStyle: 'bold', fontSize: 8 },
      footStyles: {
        fillColor: mixWithWhite(accentRgb, 0.2),
        textColor: darkText,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'right',
      },
      alternateRowStyles: { fillColor: mixWithWhite(accentRgb, 0.1) },
      theme: 'grid',
    });
    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. MOVIMENTAÇÕES DE PEIXES (Inclusões e Transferências)
  // ═══════════════════════════════════════════════════════════════

  const periodoMov = (m: Movimentacao) => `${MESES_CURTOS[m.mes - 1] ?? '-'}/${m.ano}`;

  const inclusoes = movimentacoes
    .filter((m) => m.tipo === 'povoamento' && m.direcao === 'entrada')
    .sort((a, b) => b.ano - a.ano || b.mes - a.mes);

  const transferencias = movimentacoes
    .filter((m) => m.tipo === 'transferencia' && m.direcao === 'saida' && m.tankDestino != null)
    .sort((a, b) => b.ano - a.ano || b.mes - a.mes);

  if (inclusoes.length > 0) {
    sectionTitle('Inclusoes de Peixes');
    autoTable(doc, {
      startY: y,
      margin: { left: marginLeft, right: marginRight },
      head: [['Periodo', 'Tanque', 'Fase', 'Peixes', 'Descricao']],
      body: inclusoes.map((m) => [
        periodoMov(m),
        `T${m.tankId.toString().padStart(2, '0')}`,
        s(m.faseTanque ? PHASE_LABELS[m.faseTanque] : '-'),
        fmt(m.quantidade),
        s(m.descricao || '-'),
      ]),
      columnStyles: { 3: { halign: 'right' } },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: accentRgb, textColor: accentTextRgb, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: mixWithWhite(accentRgb, 0.1) },
      theme: 'grid',
    });
    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;
  }

  if (transferencias.length > 0) {
    sectionTitle('Transferencias entre Tanques');
    autoTable(doc, {
      startY: y,
      margin: { left: marginLeft, right: marginRight },
      head: [['Periodo', 'Origem', 'Destino', 'Fases', 'Peixes', 'Descricao']],
      body: transferencias.map((m) => [
        periodoMov(m),
        `T${m.tankId.toString().padStart(2, '0')}`,
        `T${(m.tankDestino ?? 0).toString().padStart(2, '0')}`,
        s(
          `${m.faseTanque ? PHASE_LABELS[m.faseTanque] : '-'} > ${
            m.faseDestino ? PHASE_LABELS[m.faseDestino] : '-'
          }`
        ),
        fmt(m.quantidade),
        s(m.descricao || '-'),
      ]),
      columnStyles: { 4: { halign: 'right' } },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: accentRgb, textColor: accentTextRgb, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: mixWithWhite(accentRgb, 0.1) },
      theme: 'grid',
    });
    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. HISTÓRICO DE CORREÇÕES (ajustes de saldo)
  // ═══════════════════════════════════════════════════════════════

  const tankIdsComAjuste = new Set(
    movimentacoes.filter((m) => m.tipo === 'ajuste').map((m) => m.tankId)
  );
  const ajusteEvents: Array<{ mov: Movimentacao; saldoAntes: number; saldoDepois: number }> = [];
  for (const tankId of tankIdsComAjuste) {
    const extrato = extratoComSaldo(tankId, movimentacoes);
    extrato.forEach((entry, i) => {
      if (entry.mov.tipo !== 'ajuste') return;
      ajusteEvents.push({
        mov: entry.mov,
        saldoAntes: i > 0 ? extrato[i - 1].saldo : 0,
        saldoDepois: entry.saldo,
      });
    });
  }
  ajusteEvents.sort(
    (a, b) => b.mov.ano - a.mov.ano || b.mov.mes - a.mov.mes || a.mov.tankId - b.mov.tankId
  );

  if (ajusteEvents.length > 0) {
    sectionTitle('Historico de Correcoes');
    autoTable(doc, {
      startY: y,
      margin: { left: marginLeft, right: marginRight },
      head: [['Periodo', 'Tanque', 'Ajuste', 'Saldo antes', 'Saldo depois', 'Descricao']],
      body: ajusteEvents.map((ev) => {
        const delta = ev.saldoDepois - ev.saldoAntes;
        return [
          periodoMov(ev.mov),
          `T${ev.mov.tankId.toString().padStart(2, '0')}`,
          `${delta >= 0 ? '+' : '-'}${fmt(Math.abs(delta))}`,
          fmt(ev.saldoAntes),
          fmt(ev.saldoDepois),
          s(ev.mov.descricao || '-'),
        ];
      }),
      columnStyles: {
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: accentRgb, textColor: accentTextRgb, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: mixWithWhite(accentRgb, 0.1) },
      theme: 'grid',
    });
    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;
  }

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
