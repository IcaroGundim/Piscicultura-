interface SectionTitleProps {
  children: React.ReactNode;
}

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-6 first:mt-0">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">{children}</h3>
      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
    </div>
  );
}
