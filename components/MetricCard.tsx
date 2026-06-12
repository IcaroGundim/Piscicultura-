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

const ICON_BG_MAP: Record<string, string> = {
  'text-blue-600': 'bg-blue-600/10',
  'text-blue-700': 'bg-blue-700/10',
  'text-green-600': 'bg-green-600/10',
  'text-amber-600': 'bg-amber-600/10',
  'text-indigo-600': 'bg-indigo-600/10',
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color = 'text-primary',
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
  const iconBgClass = ICON_BG_MAP[color ?? ''] ?? 'bg-primary/10';

  if (variant === 'compact') {
    return (
      <div
        role={isEditable ? 'button' : undefined}
        tabIndex={isEditable && !isEditing ? 0 : -1}
        aria-label={isEditable ? `Editar ${label}` : undefined}
        className={cn(
          'group flex min-w-0 flex-col gap-2.5 rounded-xl border p-3 transition-all duration-200',
          isEditable && !isEditing && 'cursor-pointer hover:border-primary/30 hover:shadow-sm',
          isEditing && 'border-primary/40 ring-2 ring-primary/20',
          highlight ? 'border-primary/20 bg-primary/[0.04]' : 'border-border bg-card/90'
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
          <div className={cn('flex shrink-0 items-center justify-center w-6 h-6 rounded-lg', iconBgClass)}>
            <Icon className={cn('w-3.5 h-3.5', color)} />
          </div>
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {isEditable && !isEditing && (
            <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
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
            className="h-9 w-full rounded-md border border-input bg-primary/5 px-2 text-lg font-semibold text-foreground ring-2 ring-primary/30 focus-visible:outline-none"
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
        'flex min-w-0 flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all duration-200',
        isEditable && !isEditing && 'cursor-pointer hover:-translate-y-0.5 hover:ring-1 hover:ring-primary/20',
        highlight ? 'border-primary/20 bg-primary/5' : 'border-border bg-card/90'
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
      <div className="flex min-w-0 items-center gap-3 mb-3">
        <div className={cn('flex shrink-0 items-center justify-center w-9 h-9 rounded-full', iconBgClass)}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <span className="min-w-0 text-xs text-foreground/85 font-medium uppercase tracking-wider break-words">{label}</span>
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
            className="h-10 w-full rounded-md border border-input bg-primary/5 px-3 text-sm text-foreground shadow-sm ring-2 ring-primary/30 focus-visible:outline-none"
          />
        ) : (
          <p className="min-w-0 break-words text-2xl font-semibold text-foreground leading-none">
            {typeof value === 'number' ? value.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) : value}
            {unit && <span className="text-sm text-muted-foreground font-normal ml-1.5">{unit}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
