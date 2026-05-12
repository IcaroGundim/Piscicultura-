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
          'flex items-center justify-between rounded-xl border py-2.5 px-3 transition-all duration-200',
          isEditable && !isEditing && 'cursor-pointer hover:bg-muted/50',
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
        <div className="flex items-center gap-2.5">
          <div className={cn('flex items-center justify-center w-7 h-7 rounded-full', iconBgClass)}>
            <Icon className={cn('w-3.5 h-3.5', color)} />
          </div>
          <span className="text-xs text-foreground/85">{label}</span>
        </div>
        <div>
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
              className="h-8 w-24 rounded-md border border-input bg-primary/5 px-2 text-sm text-foreground ring-2 ring-primary/30 focus-visible:outline-none"
            />
          ) : (
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {typeof value === 'number' ? value.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) : value}
              {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role={isEditable ? 'button' : undefined}
      tabIndex={isEditable && !isEditing ? 0 : -1}
      aria-label={isEditable ? `Editar ${label}` : undefined}
      className={cn(
        'flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all duration-200',
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
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('flex items-center justify-center w-9 h-9 rounded-full', iconBgClass)}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <span className="text-xs text-foreground/85 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div>
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
          <p className="text-2xl font-semibold text-foreground leading-none">
            {typeof value === 'number' ? value.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) : value}
            {unit && <span className="text-sm text-muted-foreground font-normal ml-1.5">{unit}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
