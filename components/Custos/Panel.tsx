import { cn } from '@/lib/utils';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  bare?: boolean;
}

function Panel({ children, className, bare = false }: PanelProps) {
  return (
    <div
      className={cn(
        !bare && 'overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
        'divide-y divide-border/60',
        className
      )}
    >
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  icon?: React.ElementType;
  title: string;
  subtitle?: React.ReactNode;
}

function PanelHeader({ icon: Icon, title, subtitle }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {subtitle && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {subtitle}
        </span>
      )}
    </div>
  );
}

interface PanelSectionProps {
  title?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

function PanelSection({
  title,
  hint,
  children,
  className,
  padded = true,
}: PanelSectionProps) {
  return (
    <div className={cn(padded && 'px-4 py-3', className)}>
      {(title || hint) && (
        <div className={cn('flex items-baseline justify-between gap-2', padded ? 'mb-2' : 'px-4 pt-3 pb-2')}>
          {title && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {title}
            </p>
          )}
          {hint && (
            <p className="text-[10px] text-muted-foreground/70">{hint}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface PanelFooterProps {
  children: React.ReactNode;
  className?: string;
}

function PanelFooter({ children, className }: PanelFooterProps) {
  return <div className={cn('bg-muted/10 px-4 py-3', className)}>{children}</div>;
}

Panel.Header = PanelHeader;
Panel.Section = PanelSection;
Panel.Footer = PanelFooter;

export default Panel;
