'use client';

import type { TankPhase } from '@/lib/types';
import {
  getDisplayedMetricValue,
  getLoteValue,
  type FieldDef,
  type LoteLike,
  type QuickEditState,
} from '@/lib/tankFields';
import { MetricCard } from './MetricCard';

interface MetricFieldsGridProps {
  fields: FieldDef[];
  phase: TankPhase;
  lote: LoteLike;
  quickEdit: QuickEditState | null;
  onEditField: (field: FieldDef, value: number) => void;
  onEditChange: (value: string) => void;
  onEditBlur: () => void;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function MetricFieldsGrid({
  fields,
  phase,
  lote,
  quickEdit,
  onEditField,
  onEditChange,
  onEditBlur,
  onEditKeyDown,
}: MetricFieldsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const rawValue = getLoteValue(lote, field.key);
        const displayValue = getDisplayedMetricValue(phase, lote, field);
        const isEditingField = quickEdit?.fieldKey === field.key;
        // No berçário o peso de entrada é editado por unidade (valor exibido / escala);
        // nos demais campos usa-se o valor bruto. A condição nunca casa para campos
        // de "feeding", então a mesma fórmula serve para ambos os grids.
        const editValue =
          phase === 'bercario' && field.key === 'peso_entrada_kg'
            ? displayValue / (field.scale ?? 1)
            : rawValue;

        return (
          <MetricCard
            key={field.key}
            variant="compact"
            icon={field.icon}
            label={field.label}
            value={displayValue}
            unit={field.unit}
            color={field.color}
            highlight={field.highlight}
            onEdit={field.computed ? undefined : () => onEditField(field, editValue)}
            isEditing={isEditingField}
            editValue={quickEdit?.inputValue ?? ''}
            onEditChange={onEditChange}
            onEditBlur={onEditBlur}
            onEditKeyDown={onEditKeyDown}
            step={field.step ?? '0.001'}
          />
        );
      })}
    </div>
  );
}
