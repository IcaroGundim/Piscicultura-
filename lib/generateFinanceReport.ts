import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Lancamento, TipoLancamento } from './types';
import {
  CATEGORIA_CUSTO_LABELS,
  CATEGORIA_RECEITA_LABELS,
  CATEGORIA_CUSTO_COLORS,
  CATEGORIA_RECEITA_COLORS,
} from './types';
import {
  MESES_CURTOS,
  CATEGORIA_UNIDADES,
  anosDisponiveis,
  composicaoPorCategoria,
  isCusto,
  isReceita,
  totalLancamento,
  totalPorCategoriaCusto,
  totalPorCategoriaReceita,
} from './lancamentos';
import {
  fmtBRL,
  s,
  type RGB,
  hexToRgbTuple,
  contrastingTextRgb,
  mixWithWhite,
  drawBarChart,
  drawDonutChart,
  locationSlug,
} from './pdf/reportKit';

interface FinanceReportData {
  lancamentos: Lancamento[];
  tipo: TipoLancamento;
  locationName?: string;
}

// Cor de destaque por tipo: custos = teal da marca (TopNav), receitas = emerald.
const ACCENT: Record<TipoLancamento, RGB> = {
  custo: [29, 94, 105], // #1d5e69
  receita: [5, 150, 105], // #059669
};

export function generateFinanceReport(data: FinanceReportData) {
  const { tipo, locationName } = data;
  const isReceitaTipo = tipo === 'receita';
  const labels = isReceitaTipo ? CATEGORIA_RECEITA_LABELS : CATEGORIA_CUSTO_LABELS;
  const colors = isReceitaTipo ? CATEGORIA_RECEITA_COLORS : CATEGORIA_CUSTO_COLORS;
  const totalPorCategoria = isReceitaTipo ? totalPorCategoriaReceita : totalPorCategoriaCusto;
  const filtroTipo = isReceitaTipo ? isReceita : isCusto;

  // Apenas os lançamentos do tipo escolhido.
  const lancamentos = data.lancamentos.filter(filtroTipo);
  const anos = anosDisponiveis(lancamentos); // desc

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 0;

  const accentRgb = ACCENT[tipo];
  const accentTextRgb = contrastingTextRgb(accentRgb);
  const darkText: RGB = [30, 41, 59];
  const mutedText: RGB = [100, 116, 139];

  const catColorRgb = (categoria: string): RGB => {
    const hex = colors[categoria as keyof typeof colors];
    return hex ? hexToRgbTuple(hex) : [128, 128, 128];
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

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

  // ── Pré-cálculos ──
  const totalGeral = lancamentos.reduce((acc, l) => acc + totalLancamento(l), 0);
  const totalDoAno = (ano: number) =>
    lancamentos.filter((l) => l.ano === ano).reduce((acc, l) => acc + totalLancamento(l), 0);

  // ═══════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════

  doc.setFillColor(...accentRgb);
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...accentTextRgb);
  doc.text(s(isReceitaTipo ? 'Relatorio de Receitas' : 'Relatorio de Custos'), marginLeft, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(s(`Manati${locationName ? ' — ' + locationName : ''}`), marginLeft, 23);

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
  // 1. RESUMO GERAL (todos os anos)
  // ═══════════════════════════════════════════════════════════════

  sectionTitle(isReceitaTipo ? 'Resumo Geral de Receitas' : 'Resumo Geral de Custos');
  kvLine('Total geral (todos os anos)', fmtBRL(totalGeral));
  kvLine('Anos com lancamentos', anos.length > 0 ? String(anos.length) : '0');
  y += 4;

  // Charts lado a lado: barras por ano + donut de composição.
  const chartH = 72;
  ensureSpace(chartH + 6);
  const halfW = (contentWidth - 4) / 2;

  // Barras: total por ano (mais antigo → mais recente).
  const anosAsc = [...anos].sort((a, b) => a - b);
  drawBarChart(
    doc,
    marginLeft,
    y,
    halfW,
    chartH,
    anosAsc.map((ano) => ({ label: String(ano), value: totalDoAno(ano), color: accentRgb })),
    isReceitaTipo ? 'Receitas por Ano' : 'Custos por Ano',
    `Total: ${fmtBRL(totalGeral)}`,
    'R$',
    {
      bar: (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0)),
      axis: (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : n.toFixed(0)),
    }
  );

  // Donut: composição por categoria (todos os anos).
  const composicao = composicaoPorCategoria(lancamentos, tipo);
  drawDonutChart(
    doc,
    marginLeft + halfW + 4,
    y,
    halfW,
    chartH,
    composicao.map((fatia) => ({
      label: fatia.label,
      value: fatia.valor,
      color: catColorRgb(fatia.categoria),
    })),
    'Composicao por Categoria',
    `Total: ${fmtBRL(totalGeral)}`,
    fmtBRL(totalGeral),
    (n) => fmtBRL(n)
  );

  y += chartH + 4;

  // ═══════════════════════════════════════════════════════════════
  // 2. SEÇÕES POR ANO
  // ═══════════════════════════════════════════════════════════════

  if (anos.length === 0) {
    ensureSpace(10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mutedText);
    doc.text(
      s(`Nenhum${isReceitaTipo ? 'a receita' : ' custo'} lancado${isReceitaTipo ? 'a' : ''}.`),
      marginLeft + 2,
      y
    );
    y += 8;
  }

  anos.forEach((ano) => {
    const doAno = lancamentos
      .filter((l) => l.ano === ano)
      .sort((a, b) => a.mes - b.mes || a.id.localeCompare(b.id));

    sectionTitle(`Ano ${ano} — Total: ${fmtBRL(totalDoAno(ano))}`);

    // Totais por categoria (oculta zeradas).
    const totais = totalPorCategoria(lancamentos.filter((l) => l.ano === ano));
    (Object.entries(totais) as Array<[string, number]>)
      .filter(([, valor]) => valor > 0)
      .sort((a, b) => b[1] - a[1])
      .forEach(([categoria, valor]) => {
        kvLine(`  ${labels[categoria as keyof typeof labels] ?? categoria}`, fmtBRL(valor));
      });
    y += 3;

    // Tabela detalhada dos lançamentos do ano.
    autoTable(doc, {
      startY: y,
      margin: { left: marginLeft, right: marginRight },
      head: [['Mes', 'Categoria', 'Descricao', 'Qtd', 'Preco un.', 'Total']],
      body: doAno.map((l) => [
        `${MESES_CURTOS[l.mes - 1]}/${l.ano}`,
        s(labels[l.categoria as keyof typeof labels] ?? l.categoria),
        s(l.descricao || '-'),
        `${l.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${
          CATEGORIA_UNIDADES[l.categoria] ?? ''
        }`.trim(),
        fmtBRL(l.precoUnitario),
        fmtBRL(totalLancamento(l)),
      ]),
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
      },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: accentRgb,
        textColor: accentTextRgb,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: mixWithWhite(accentRgb, 0.1) },
      theme: 'grid',
    });

    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;
  });

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
      s(`Manati${locationName ? ' — ' + locationName : ''} | Pagina ${i} de ${totalPages}`),
      pageWidth / 2,
      pageH - 8,
      { align: 'center' }
    );
  }

  // ── Save ──
  const slug = locationSlug(locationName);
  const prefix = isReceitaTipo ? 'relatorio_receitas' : 'relatorio_custos';
  doc.save(`${prefix}${slug ? '_' + slug : ''}_${now.toISOString().slice(0, 10)}.pdf`);
}
