import ExcelJS from 'exceljs';
import type { Tank, BercarioLote, RecriaLote, EngordaLote, Premissas, TankPhase } from './types';
import { PHASE_LABELS } from './types';

interface SpreadsheetData {
  tanks: Tank[];
  bercarioLotes: BercarioLote[];
  recriaLotes: RecriaLote[];
  engordaLotes: EngordaLote[];
  premissas: Premissas;
  locationName?: string;
}

type HexColor = string;

const COLOR_HEADER: HexColor = 'FF2563EB';
const COLOR_SECTION_BG: HexColor = 'FFE0E7FF';
const COLOR_TOTAL_BG: HexColor = 'FFF1F5F9';
const COLOR_WHITE: HexColor = 'FFFFFFFF';
const COLOR_BORDER_LIGHT: HexColor = 'FFE2E8F0';
const COLOR_BORDER_MED: HexColor = 'FFCBD5E1';

const FMT_INT = '#,##0';
const FMT_DEC1 = '#,##0.0';
const FMT_DEC2 = '#,##0.00';
const FMT_DEC3 = '#,##0.000';
const FMT_BRL = '"R$ "#,##0.00';

interface ColumnSpec {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
}

function styleHeaderRow(worksheet: ExcelJS.Worksheet, rowNumber: number) {
  const row = worksheet.getRow(rowNumber);
  row.height = 22;
  row.font = { bold: true, color: { argb: COLOR_WHITE }, size: 11 };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_HEADER },
    };
    cell.border = {
      top: { style: 'thin', color: { argb: COLOR_BORDER_MED } },
      bottom: { style: 'thin', color: { argb: COLOR_BORDER_MED } },
      left: { style: 'thin', color: { argb: COLOR_BORDER_MED } },
      right: { style: 'thin', color: { argb: COLOR_BORDER_MED } },
    };
  });
}

function applyDataBorders(worksheet: ExcelJS.Worksheet, fromRow: number, toRow: number) {
  for (let r = fromRow; r <= toRow; r++) {
    const row = worksheet.getRow(r);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: COLOR_BORDER_LIGHT } },
        bottom: { style: 'thin', color: { argb: COLOR_BORDER_LIGHT } },
        left: { style: 'thin', color: { argb: COLOR_BORDER_LIGHT } },
        right: { style: 'thin', color: { argb: COLOR_BORDER_LIGHT } },
      };
    });
  }
}

function styleTotalRow(worksheet: ExcelJS.Worksheet, rowNumber: number) {
  const row = worksheet.getRow(rowNumber);
  row.font = { bold: true, size: 11 };
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_TOTAL_BG },
    };
    cell.border = {
      top: { style: 'double', color: { argb: 'FF475569' } },
      bottom: { style: 'thin', color: { argb: COLOR_BORDER_MED } },
      left: { style: 'thin', color: { argb: COLOR_BORDER_MED } },
      right: { style: 'thin', color: { argb: COLOR_BORDER_MED } },
    };
  });
}

function styleSectionTitle(worksheet: ExcelJS.Worksheet, rowNumber: number, colspan: number) {
  worksheet.mergeCells(rowNumber, 1, rowNumber, colspan);
  const cell = worksheet.getCell(rowNumber, 1);
  cell.font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLOR_SECTION_BG },
  };
  worksheet.getRow(rowNumber).height = 22;
}

function setColumns(worksheet: ExcelJS.Worksheet, specs: ColumnSpec[]) {
  worksheet.columns = specs.map((s) => ({
    header: s.header,
    key: s.key,
    width: s.width,
    style: s.numFmt ? { numFmt: s.numFmt } : undefined,
  }));
}

export async function generateSpreadsheet(data: SpreadsheetData) {
  const { tanks, bercarioLotes, recriaLotes, engordaLotes, premissas } = data;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Manati';
  workbook.created = new Date();

  // ═══════════════════════════════════════════════════════════════
  // ABA 1 — TANQUES & LOTES (visão unificada)
  // ═══════════════════════════════════════════════════════════════
  const wsOperacional = workbook.addWorksheet('Tanques & Lotes');
  setColumns(wsOperacional, [
    { header: 'Tanque', key: 'tank', width: 10 },
    { header: 'Área (m²)', key: 'area_m2', width: 12, numFmt: FMT_INT },
    { header: 'Área (ha)', key: 'area_ha', width: 11, numFmt: FMT_DEC2 },
    { header: 'Fase', key: 'fase', width: 12 },
    { header: 'Subfase/Módulo', key: 'subfase', width: 18 },
    { header: 'Peixes', key: 'qtd', width: 12, numFmt: FMT_INT },
    { header: 'Peso Entrada (kg)', key: 'peso_ent', width: 18, numFmt: FMT_DEC2 },
    { header: 'Peso Ganhar (kg)', key: 'peso_ganhar', width: 18, numFmt: FMT_DEC2 },
    { header: 'Peso Total (kg)', key: 'peso_total', width: 16, numFmt: FMT_DEC2 },
    { header: 'Densidade (kg/m²)', key: 'densidade', width: 18, numFmt: FMT_DEC3 },
    { header: 'Peso Transf. (kg)', key: 'peso_transf', width: 18, numFmt: FMT_DEC2 },
    { header: 'Conv. Alimentar', key: 'conv', width: 16, numFmt: FMT_DEC2 },
    { header: 'Peso Final/Peixe (kg)', key: 'peso_final', width: 20, numFmt: FMT_DEC2 },
    { header: 'Ração Dia (sc)', key: 'racao_dia', width: 15, numFmt: FMT_DEC3 },
    { header: 'Ração Mês (sc)', key: 'racao_mes', width: 15, numFmt: FMT_DEC2 },
    { header: 'Ração Total (sc)', key: 'racao_total', width: 16, numFmt: FMT_DEC2 },
    { header: 'Período (meses)', key: 'periodo', width: 14, numFmt: FMT_INT },
  ]);
  styleHeaderRow(wsOperacional, 1);

  const getLote = (
    tankId: number,
    phase: TankPhase
  ):
    | { type: 'bercario'; lote: BercarioLote }
    | { type: 'recria'; lote: RecriaLote }
    | { type: 'engorda'; lote: EngordaLote }
    | null => {
    if (phase === 'bercario') {
      const lote = bercarioLotes.find((l) => l.tankId === tankId);
      return lote ? { type: 'bercario', lote } : null;
    }
    if (phase === 'recria') {
      const lote = recriaLotes.find((l) => l.tankId === tankId);
      return lote ? { type: 'recria', lote } : null;
    }
    if (phase === 'engorda') {
      const lote = engordaLotes.find((l) => l.tankId === tankId);
      return lote ? { type: 'engorda', lote } : null;
    }
    return null;
  };

  const sortedTanks = [...tanks].sort((a, b) => a.id - b.id);
  sortedTanks.forEach((t) => {
    const found = getLote(t.id, t.phase);
    const base = {
      tank: `T${t.id.toString().padStart(2, '0')}`,
      area_m2: t.area_m2,
      area_ha: t.area_ha,
      fase: PHASE_LABELS[t.phase],
      subfase: t.subfase ?? '',
    };
    if (!found) {
      wsOperacional.addRow(base);
      return;
    }
    if (found.type === 'bercario') {
      const l = found.lote;
      wsOperacional.addRow({
        ...base,
        subfase: l.nome || base.subfase,
        qtd: l.qtd_peixes,
        peso_ent: l.peso_entrada_kg,
        peso_ganhar: l.peso_ganhar_kg,
        peso_total: l.peso_total_kg,
        densidade: l.densidade_kg_m2,
        peso_transf: l.peso_transferencia_kg,
        racao_dia: l.racao_dia_sc,
        racao_mes: l.racao_mes_sc,
        racao_total: l.racao_total_sc,
      });
    } else if (found.type === 'recria') {
      const l = found.lote;
      wsOperacional.addRow({
        ...base,
        qtd: l.qtd_peixes,
        peso_ent: l.peso_entrada_kg,
        peso_ganhar: l.peso_ganhar_kg,
        peso_total: l.peso_total_kg,
        densidade: l.densidade_kg_m2,
        peso_transf: l.peso_transferencia_kg,
        racao_dia: l.racao_dia_sc,
        racao_mes: l.racao_mes_sc,
        racao_total: l.racao_total_sc,
        periodo: l.periodo_meses,
      });
    } else {
      const l = found.lote;
      wsOperacional.addRow({
        ...base,
        subfase: l.modulo || base.subfase,
        qtd: l.qtd_peixes,
        peso_ent: l.peso_entrada_kg,
        peso_ganhar: l.peso_ganhar_kg,
        peso_total: l.peso_total_kg,
        densidade: l.densidade_kg_m2,
        conv: l.conversao_alimentar,
        peso_final: l.peso_final_kg_peixe,
        racao_dia: l.racao_dia_sc,
        racao_mes: l.racao_mes_sc,
        racao_total: l.racao_total_sc,
        periodo: l.periodo_meses,
      });
    }
  });

  // Linha de total
  const totQtd =
    bercarioLotes.reduce((s, l) => s + l.qtd_peixes, 0) +
    recriaLotes.reduce((s, l) => s + l.qtd_peixes, 0) +
    engordaLotes.reduce((s, l) => s + l.qtd_peixes, 0);
  const totPesoTotal =
    bercarioLotes.reduce((s, l) => s + l.peso_total_kg, 0) +
    recriaLotes.reduce((s, l) => s + l.peso_total_kg, 0) +
    engordaLotes.reduce((s, l) => s + l.peso_total_kg, 0);
  const totRacaoDia =
    bercarioLotes.reduce((s, l) => s + l.racao_dia_sc, 0) +
    recriaLotes.reduce((s, l) => s + l.racao_dia_sc, 0) +
    engordaLotes.reduce((s, l) => s + l.racao_dia_sc, 0);
  const totRacaoMes =
    bercarioLotes.reduce((s, l) => s + l.racao_mes_sc, 0) +
    recriaLotes.reduce((s, l) => s + l.racao_mes_sc, 0) +
    engordaLotes.reduce((s, l) => s + l.racao_mes_sc, 0);
  const totRacaoTotal =
    bercarioLotes.reduce((s, l) => s + l.racao_total_sc, 0) +
    recriaLotes.reduce((s, l) => s + l.racao_total_sc, 0) +
    engordaLotes.reduce((s, l) => s + l.racao_total_sc, 0);

  const totalRow = wsOperacional.addRow({
    tank: 'TOTAL',
    qtd: totQtd,
    peso_total: totPesoTotal,
    racao_dia: totRacaoDia,
    racao_mes: totRacaoMes,
    racao_total: totRacaoTotal,
  });
  applyDataBorders(wsOperacional, 2, wsOperacional.rowCount - 1);
  styleTotalRow(wsOperacional, totalRow.number);
  wsOperacional.views = [{ state: 'frozen', ySplit: 1 }];
  wsOperacional.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: wsOperacional.columnCount },
  };

  // ═══════════════════════════════════════════════════════════════
  // ABA 2 — PREMISSAS & RESUMOS
  // ═══════════════════════════════════════════════════════════════
  const wsResumo = workbook.addWorksheet('Premissas & Resumos');
  wsResumo.columns = [
    { width: 28 },
    { width: 18 },
    { width: 22 },
    { width: 18 },
  ];

  // ─── Seção 1: Premissas ───────────────────────────────────────
  let cursorRow = 1;
  wsResumo.getCell(cursorRow, 1).value = 'PREMISSAS DE PRODUÇÃO';
  styleSectionTitle(wsResumo, cursorRow, 4);
  cursorRow++;

  const premissasHeaderRow = cursorRow;
  wsResumo.getRow(premissasHeaderRow).values = ['Parâmetro', 'Valor', 'Unidade'];
  styleHeaderRow(wsResumo, premissasHeaderRow);
  cursorRow++;

  const premissasItems: Array<[string, number, string, string?]> = [
    ['Produção Anual', premissas.producao_anual, 'kg', FMT_INT],
    ['Conversão Alimentar', premissas.conversao_alimentar, 'kg/kg', FMT_DEC2],
    ['Ciclos por Ano', premissas.ciclos_ano, 'ciclos', FMT_DEC1],
    ['Preço de Venda', premissas.preco_venda, 'R$/kg', FMT_BRL],
    ['Peso Final Engorda', premissas.peso_final_engorda, 'kg', FMT_DEC2],
    ['Transf. Recria → Engorda', premissas.peso_transfer_recria, 'kg', FMT_DEC2],
    ['Transf. Berçário → Recria', premissas.peso_transfer_bercario, 'kg', FMT_DEC2],
    ['Período de Engorda', premissas.periodo_engorda, 'meses', FMT_INT],
    ['Período de Recria', premissas.periodo_recria, 'meses', FMT_INT],
  ];
  const premissasStart = cursorRow;
  premissasItems.forEach(([param, valor, unidade, fmt]) => {
    const row = wsResumo.getRow(cursorRow);
    row.getCell(1).value = param;
    row.getCell(2).value = valor;
    row.getCell(3).value = unidade;
    if (fmt) row.getCell(2).numFmt = fmt;
    cursorRow++;
  });
  applyDataBorders(wsResumo, premissasStart, cursorRow - 1);

  cursorRow += 2; // spacing

  // ─── Seção 2: Resumo de Ração ─────────────────────────────────
  const racaoMesBercario = bercarioLotes.reduce((s, l) => s + l.racao_mes_sc, 0);
  const racaoMesRecria = recriaLotes.reduce((s, l) => s + l.racao_mes_sc, 0);
  const racaoMesEngorda = engordaLotes.reduce((s, l) => s + l.racao_mes_sc, 0);
  const racaoTotalBercario = bercarioLotes.reduce((s, l) => s + l.racao_total_sc, 0);
  const racaoTotalRecria = recriaLotes.reduce((s, l) => s + l.racao_total_sc, 0);
  const racaoTotalEngorda = engordaLotes.reduce((s, l) => s + l.racao_total_sc, 0);

  wsResumo.getCell(cursorRow, 1).value = 'RESUMO DE RAÇÃO';
  styleSectionTitle(wsResumo, cursorRow, 4);
  cursorRow++;

  const racaoHeaderRow = cursorRow;
  wsResumo.getRow(racaoHeaderRow).values = ['Fase', 'Ração/Mês (sc)', 'Ração Total Ciclo (sc)'];
  styleHeaderRow(wsResumo, racaoHeaderRow);
  cursorRow++;

  const racaoStart = cursorRow;
  const racaoRows: Array<[string, number, number]> = [
    ['Berçário', racaoMesBercario, racaoTotalBercario],
    ['Recria', racaoMesRecria, racaoTotalRecria],
    ['Engorda', racaoMesEngorda, racaoTotalEngorda],
  ];
  racaoRows.forEach(([fase, mes, total]) => {
    const row = wsResumo.getRow(cursorRow);
    row.getCell(1).value = fase;
    row.getCell(2).value = mes;
    row.getCell(2).numFmt = FMT_DEC2;
    row.getCell(3).value = total;
    row.getCell(3).numFmt = FMT_DEC2;
    cursorRow++;
  });
  // Total ração
  const racaoTotalRowNum = cursorRow;
  const racaoTotRow = wsResumo.getRow(racaoTotalRowNum);
  racaoTotRow.getCell(1).value = 'TOTAL';
  racaoTotRow.getCell(2).value = racaoMesBercario + racaoMesRecria + racaoMesEngorda;
  racaoTotRow.getCell(2).numFmt = FMT_DEC2;
  racaoTotRow.getCell(3).value = racaoTotalBercario + racaoTotalRecria + racaoTotalEngorda;
  racaoTotRow.getCell(3).numFmt = FMT_DEC2;
  applyDataBorders(wsResumo, racaoStart, racaoTotalRowNum - 1);
  styleTotalRow(wsResumo, racaoTotalRowNum);
  cursorRow++;

  cursorRow += 2; // spacing

  // ─── Seção 3: Resumo de Peixes ────────────────────────────────
  const fishBercario = bercarioLotes.reduce((s, l) => s + l.qtd_peixes, 0);
  const fishRecria = recriaLotes.reduce((s, l) => s + l.qtd_peixes, 0);
  const fishEngorda = engordaLotes.reduce((s, l) => s + l.qtd_peixes, 0);
  const biomassBercario = bercarioLotes.reduce((s, l) => s + l.peso_total_kg, 0);
  const biomassRecria = recriaLotes.reduce((s, l) => s + l.peso_total_kg, 0);
  const biomassEngorda = engordaLotes.reduce((s, l) => s + l.peso_total_kg, 0);

  wsResumo.getCell(cursorRow, 1).value = 'RESUMO DE PEIXES';
  styleSectionTitle(wsResumo, cursorRow, 4);
  cursorRow++;

  const peixesHeaderRow = cursorRow;
  wsResumo.getRow(peixesHeaderRow).values = ['Fase', 'Peixes', 'Biomassa (kg)'];
  styleHeaderRow(wsResumo, peixesHeaderRow);
  cursorRow++;

  const peixesStart = cursorRow;
  const peixesRows: Array<[string, number, number]> = [
    ['Berçário', fishBercario, biomassBercario],
    ['Recria', fishRecria, biomassRecria],
    ['Engorda', fishEngorda, biomassEngorda],
  ];
  peixesRows.forEach(([fase, peixes, biomassa]) => {
    const row = wsResumo.getRow(cursorRow);
    row.getCell(1).value = fase;
    row.getCell(2).value = peixes;
    row.getCell(2).numFmt = FMT_INT;
    row.getCell(3).value = biomassa;
    row.getCell(3).numFmt = FMT_DEC2;
    cursorRow++;
  });
  const peixesTotalRowNum = cursorRow;
  const peixesTotRow = wsResumo.getRow(peixesTotalRowNum);
  peixesTotRow.getCell(1).value = 'TOTAL';
  peixesTotRow.getCell(2).value = fishBercario + fishRecria + fishEngorda;
  peixesTotRow.getCell(2).numFmt = FMT_INT;
  peixesTotRow.getCell(3).value = biomassBercario + biomassRecria + biomassEngorda;
  peixesTotRow.getCell(3).numFmt = FMT_DEC2;
  applyDataBorders(wsResumo, peixesStart, peixesTotalRowNum - 1);
  styleTotalRow(wsResumo, peixesTotalRowNum);

  // ═══════════════════════════════════════════════════════════════
  // SALVAR ARQUIVO
  // ═══════════════════════════════════════════════════════════════
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const locationSlug = data.locationName
    ? data.locationName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')
    : '';
  a.download = `planilha_piscicultura${locationSlug ? '_' + locationSlug : ''}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
