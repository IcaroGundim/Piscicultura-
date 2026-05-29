import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-4 shadow-sm',
        className
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}
