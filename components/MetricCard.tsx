import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  highlight?: boolean;
  variant?: 'default' | 'compact';
  onEdit?: () => void;
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (v: string) => void;
  onEditBlur?: () => void;
  onEditKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  step?: string;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color = 'text-brand',
  highlight = false,
  variant = 'default',
  onEdit,
  isEditing = false,
  editValue = '',
  onEditChange,
  onEditBlur,
  onEditKeyDown,
  step = '0.001',
}: MetricCardProps) {
  const isEditable = !!onEdit;

  if (variant === 'compact') {
    return (
      <div
        role={isEditable ? 'button' : undefined}
        tabIndex={isEditable && !isEditing ? 0 : -1}
        aria-label={isEditable ? `Editar ${label}` : undefined}
        className={cn(
          'group flex min-w-0 flex-col gap-2.5 rounded-xl border border-brand/30 bg-card p-3 shadow-sm transition-all duration-200',
          isEditable && !isEditing && 'cursor-pointer hover:border-brand/50 hover:bg-brand/[0.03] hover:shadow-md',
          isEditing && 'border-brand/50 ring-2 ring-brand/20',
          highlight && 'bg-brand/[0.03]'
        )}
        onClick={!isEditing ? onEdit : undefined}
        onKeyDown={(e) => {
          if (isEditable && !isEditing && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onEdit?.();
          }
        }}
        title={isEditable && !isEditing ? 'Clique para editar' : undefined}
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-current/10', color)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {isEditable && !isEditing && (
            <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-brand" />
          )}
        </div>
        {isEditing ? (
          <input
            autoFocus
            type="number"
            step={step}
            value={editValue}
            onChange={(e) => onEditChange?.(e.target.value)}
            onBlur={onEditBlur}
            onKeyDown={onEditKeyDown}
            onClick={(e) => e.stopPropagation()}
            aria-label={label}
            className="h-9 w-full rounded-md border border-brand/40 bg-white px-2 text-lg font-semibold tabular-nums text-foreground outline-none ring-2 ring-brand/20"
          />
        ) : (
          <p
            className={cn(
              'min-w-0 break-words font-semibold leading-none tabular-nums text-foreground',
              highlight ? 'text-2xl' : 'text-xl'
            )}
          >
            {typeof value === 'number'
              ? value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
              : value}
            {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      role={isEditable ? 'button' : undefined}
      tabIndex={isEditable && !isEditing ? 0 : -1}
      aria-label={isEditable ? `Editar ${label}` : undefined}
      className={cn(
        'flex min-w-0 flex-col justify-between rounded-2xl border border-brand/30 bg-card p-4 shadow-sm transition-all duration-200',
        isEditable && !isEditing && 'cursor-pointer hover:-translate-y-0.5 hover:border-brand/50 hover:ring-1 hover:ring-brand/20',
        highlight && 'bg-brand/[0.03]'
      )}
      onClick={!isEditing ? onEdit : undefined}
      onKeyDown={(e) => {
        if (isEditable && !isEditing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onEdit?.();
        }
      }}
      title={isEditable && !isEditing ? 'Clique para editar este KPI' : undefined}
    >
      <div className="mb-3 flex min-w-0 items-center gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-current/10', color)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="min-w-0 break-words text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="min-w-0">
        {isEditing ? (
          <input
            autoFocus
            type="number"
            step={step}
            value={editValue}
            onChange={(e) => onEditChange?.(e.target.value)}
            onBlur={onEditBlur}
            onKeyDown={onEditKeyDown}
            onClick={(e) => e.stopPropagation()}
            aria-label={label}
            className="h-10 w-full rounded-md border border-brand/40 bg-white px-3 text-sm font-semibold tabular-nums text-foreground shadow-sm outline-none ring-2 ring-brand/20"
          />
        ) : (
          <p className="min-w-0 break-words text-2xl font-semibold leading-none tabular-nums text-foreground">
            {typeof value === 'number'
              ? value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
              : value}
            {unit && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">{unit}</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
