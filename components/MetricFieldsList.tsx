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
  /** Rótulo do bloco de campos editáveis (ex.: Parâmetros). */
  editableTitle?: string;
  /** Rótulo do bloco de campos calculados (ex.: Projeções). */
  computedTitle?: string;
}

function formatValue(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

function MetricCardShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-brand/30 bg-card shadow-sm">
      {title ? (
        <div className="border-b border-brand/30 bg-brand px-3 py-2 sm:px-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
            {title}
          </p>
        </div>
      ) : null}
      {children}
    </div>
  );
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
  editableTitle = 'Parâmetros',
  computedTitle = 'Projeções',
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
          'group/row relative border-brand/10',
          interactive ? 'cursor-pointer hover:bg-brand/[0.03]' : 'hover:bg-transparent',
          isEditing && 'bg-brand/[0.05] hover:bg-brand/[0.05]'
        )}
      >
        <TableCell className="relative z-10 w-full py-3 pl-3 sm:pl-4">
          <span className="min-w-0 truncate text-sm text-foreground/90">{field.label}</span>
        </TableCell>
        <TableCell className="py-2 pr-3 text-right sm:pr-4">
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
              className="h-8 w-28 rounded-md border border-brand/40 bg-white px-2 text-right text-sm font-semibold tabular-nums text-foreground outline-none ring-2 ring-brand/20 focus-visible:border-brand"
            />
          ) : (
            <span className="inline-flex items-center justify-end gap-1.5 font-semibold tabular-nums text-foreground">
              {/* Ícone à esquerda do valor, como marca d’água sutil */}
              <Icon
                aria-hidden
                className={cn(
                  'h-5 w-5 shrink-0 opacity-55 transition-opacity duration-200 group-hover/row:opacity-70',
                  field.color ?? 'text-brand'
                )}
              />
              <span>
                {formatValue(displayValue)}
                {field.unit && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">{field.unit}</span>
                )}
              </span>
              {editable && (
                <Pencil className="h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover/row:text-brand" />
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
        <MetricCardShell title={editableTitle}>
          <Table>
            <TableBody>{editableFields.map(renderRow)}</TableBody>
          </Table>
        </MetricCardShell>
      )}

      {computedFields.length > 0 && (
        <MetricCardShell title={computedTitle}>
          <Table>
            <TableBody>{computedFields.map(renderRow)}</TableBody>
          </Table>
        </MetricCardShell>
      )}
    </div>
  );
}
