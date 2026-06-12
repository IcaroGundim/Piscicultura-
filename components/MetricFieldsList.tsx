'use client';

import { Pencil } from 'lucide-react';
import type { TankPhase } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  getDisplayedMetricValue,
  getLoteValue,
  type FieldDef,
  type LoteLike,
  type QuickEditState,
} from '@/lib/tankFields';
import { Table, TableBody, TableCell, TableRow } from './ui/table';

interface MetricFieldsListProps {
  fields: FieldDef[];
  phase: TankPhase;
  lote: LoteLike;
  quickEdit: QuickEditState | null;
  onEditField: (field: FieldDef, value: number) => void;
  onEditChange: (value: string) => void;
  onEditBlur: () => void;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

function formatValue(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

export function MetricFieldsList({
  fields,
  phase,
  lote,
  quickEdit,
  onEditField,
  onEditChange,
  onEditBlur,
  onEditKeyDown,
}: MetricFieldsListProps) {
  const editableFields = fields.filter((f) => !f.computed);
  const computedFields = fields.filter((f) => f.computed);

  const renderRow = (field: FieldDef) => {
    const rawValue = getLoteValue(lote, field.key);
    const displayValue = getDisplayedMetricValue(phase, lote, field);
    const isEditing = quickEdit?.fieldKey === field.key;
    const editable = !field.computed;
    const interactive = editable && !isEditing;
    const Icon = field.icon;
    const iconColor = field.color ?? 'text-primary';
    // No berçário o peso de entrada é editado por unidade.
    const editValue =
      phase === 'bercario' && field.key === 'peso_entrada_kg'
        ? displayValue / (field.scale ?? 1)
        : rawValue;

    return (
      <TableRow
        key={field.key}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? `Editar ${field.label}` : undefined}
        onClick={interactive ? () => onEditField(field, editValue) : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEditField(field, editValue);
                }
              }
            : undefined
        }
        title={interactive ? `Editar ${field.label}` : undefined}
        className={cn(
          'group/row border-border/60',
          interactive ? 'cursor-pointer hover:bg-primary/[0.04]' : 'hover:bg-transparent',
          isEditing && 'bg-primary/[0.04] hover:bg-primary/[0.04]'
        )}
      >
        <TableCell className="w-full py-2.5">
          <span className="flex items-center gap-2.5">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-current/10',
                iconColor
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 truncate text-foreground/90">{field.label}</span>
          </span>
        </TableCell>
        <TableCell className="py-1.5 text-right">
          {isEditing ? (
            <input
              autoFocus
              type="number"
              step={field.step ?? '0.001'}
              value={quickEdit?.inputValue ?? ''}
              onChange={(e) => onEditChange(e.target.value)}
              onBlur={onEditBlur}
              onKeyDown={onEditKeyDown}
              aria-label={field.label}
              className="h-8 w-28 rounded-md border border-input bg-primary/5 px-2 text-right text-sm font-semibold text-foreground ring-2 ring-primary/30 focus-visible:outline-none"
            />
          ) : (
            <span className="inline-flex items-center gap-2 font-semibold tabular-nums text-foreground">
              <span>
                {formatValue(displayValue)}
                {field.unit && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">{field.unit}</span>
                )}
              </span>
              {editable && (
                <Pencil className="h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover/row:text-primary" />
              )}
            </span>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-3">
      {editableFields.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-foreground/30">
          <Table>
            <TableBody>{editableFields.map(renderRow)}</TableBody>
          </Table>
        </div>
      )}

      {computedFields.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-foreground/30">
          <Table>
            <TableBody>{computedFields.map(renderRow)}</TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
