import { Droplets, Scale, Package, Calculator, Clock, RefreshCw } from 'lucide-react';
import type { BercarioLote, EngordaLote, RecriaLote, TankPhase } from './types';

export type EditableMetricField =
  | 'qtd_peixes'
  | 'peso_total_kg'
  | 'densidade_kg_m2'
  | 'peso_entrada_kg'
  | 'peso_transferencia_kg'
  | 'peso_ganhar_kg'
  | 'racao_periodo_kg'
  | 'racao_mes_sc'
  | 'racao_dia_sc'
  | 'racao_total_sc'
  | 'periodo_meses'
  | 'peso_final_kg_peixe'
  | 'conversao_alimentar';

export interface QuickEditState {
  fieldKey: EditableMetricField;
  label: string;
  unit?: string;
  step: string;
  integer?: boolean;
  scale?: number;
  inputValue: string;
}

export interface FieldDef {
  key: EditableMetricField;
  label: string;
  icon: React.ElementType;
  color?: string;
  highlight?: boolean;
  unit?: string;
  step?: string;
  integer?: boolean;
  scale?: number;
  section: 'capacity' | 'feeding';
  hidden?: boolean;
  computed?: boolean;
}

export type LoteLike = BercarioLote | RecriaLote | EngordaLote | undefined;

export const PHASE_OPTIONS: TankPhase[] = ['bercario', 'recria', 'engorda', 'vazio'];

export const PHASE_FIELDS: Record<Exclude<TankPhase, 'vazio'>, FieldDef[]> = {
  bercario: [
    { key: 'qtd_peixes', label: 'Qtd. Peixes', icon: Package, highlight: true, color: 'text-[#2d4518]', step: '1', integer: true, section: 'capacity' },
    { key: 'peso_total_kg', label: 'Biomassa Total', icon: Scale, unit: 'kg', highlight: true, section: 'capacity', computed: true },
    { key: 'densidade_kg_m2', label: 'Densidade alvo', icon: Droplets, unit: 'kg/m³', section: 'capacity', computed: true },
    { key: 'peso_entrada_kg', label: 'Peso Entrada (un)', icon: Scale, unit: 'g', scale: 1000, section: 'capacity' },
    { key: 'peso_transferencia_kg', label: 'Peso Transf. (un)', icon: Scale, unit: 'g', scale: 1000, color: 'text-[#2d4518]', section: 'capacity' },
    { key: 'peso_ganhar_kg', label: 'Peso a Ganhar', icon: Scale, unit: 'kg', section: 'capacity', computed: true },
    { key: 'racao_periodo_kg', label: 'Total do Período', icon: Calculator, unit: 'kg', highlight: true, color: 'text-amber-600', section: 'feeding', computed: true },
    { key: 'racao_mes_sc', label: 'Consumo Mensal', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding', computed: true },
    { key: 'racao_dia_sc', label: 'Consumo Diário', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding', computed: true },
    { key: 'racao_total_sc', label: 'Total Geral', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding', computed: true },
  ],
  recria: [
    { key: 'periodo_meses', label: 'Período (meses)', icon: Clock, unit: 'meses', step: '1', integer: true, section: 'capacity', hidden: true },
    { key: 'qtd_peixes', label: 'Qtd. Peixes', icon: Package, highlight: true, color: 'text-(--phase-recria)', step: '1', integer: true, section: 'capacity' },
    { key: 'peso_total_kg', label: 'Biomassa Total', icon: Scale, unit: 'kg', highlight: true, section: 'capacity', computed: true },
    { key: 'densidade_kg_m2', label: 'Densidade alvo', icon: Droplets, unit: 'kg/m³', section: 'capacity', computed: true },
    { key: 'peso_entrada_kg', label: 'Peso Entrada (un)', icon: Scale, unit: 'kg', section: 'capacity' },
    { key: 'peso_transferencia_kg', label: 'Peso Transf. (un)', icon: Scale, unit: 'kg', color: 'text-(--phase-recria)', section: 'capacity' },
    { key: 'peso_ganhar_kg', label: 'Peso a Ganhar', icon: Scale, unit: 'kg', section: 'capacity', computed: true },
    { key: 'racao_periodo_kg', label: 'Total do Período', icon: Calculator, unit: 'kg', highlight: true, color: 'text-amber-600', section: 'feeding', computed: true },
    { key: 'racao_mes_sc', label: 'Consumo Mensal', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding', computed: true },
    { key: 'racao_dia_sc', label: 'Consumo Diário', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding', computed: true },
    { key: 'racao_total_sc', label: 'Total Geral', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding', computed: true },
  ],
  engorda: [
    { key: 'periodo_meses', label: 'Período (meses)', icon: Clock, unit: 'meses', step: '1', integer: true, section: 'capacity', hidden: true },
    { key: 'qtd_peixes', label: 'Qtd. Peixes', icon: Package, highlight: true, color: 'text-blue-800', step: '1', integer: true, section: 'capacity' },
    { key: 'peso_total_kg', label: 'Biomassa Total', icon: Scale, unit: 'kg', highlight: true, section: 'capacity', computed: true },
    { key: 'densidade_kg_m2', label: 'Densidade final', icon: Droplets, unit: 'kg/m³', section: 'capacity', computed: true },
    { key: 'peso_entrada_kg', label: 'Peso Entrada (un)', icon: Scale, unit: 'kg', section: 'capacity' },
    { key: 'peso_final_kg_peixe', label: 'Peso Abate (un)', icon: Scale, unit: 'kg', color: 'text-blue-800', section: 'capacity' },
    { key: 'peso_ganhar_kg', label: 'Peso a Ganhar', icon: Scale, unit: 'kg', section: 'capacity', computed: true },
    { key: 'racao_periodo_kg', label: 'Ração Total Período', icon: Calculator, unit: 'kg', highlight: true, color: 'text-amber-600', section: 'feeding', computed: true },
    { key: 'racao_mes_sc', label: 'Consumo Mensal', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding', computed: true },
    { key: 'racao_total_sc', label: 'Total Sacos', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding', computed: true },
    { key: 'conversao_alimentar', label: 'Conv. Alimentar (FCA)', icon: RefreshCw, unit: 'x', color: 'text-indigo-600', section: 'feeding' },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getLoteValue(lote: LoteLike, key: EditableMetricField): number {
  if (!lote || !isRecord(lote)) return 0;
  const val = lote[key];
  return typeof val === 'number' ? val : 0;
}

export function getDisplayedMetricValue(
  phase: TankPhase,
  lote: LoteLike,
  field: FieldDef
): number {
  const rawValue = getLoteValue(lote, field.key);
  const scale = field.scale ?? 1;

  if (phase === 'bercario' && field.key === 'peso_entrada_kg') {
    const qtdPeixes = getLoteValue(lote, 'qtd_peixes');
    return qtdPeixes > 0 ? (rawValue / qtdPeixes) * scale : 0;
  }

  return rawValue * scale;
}
