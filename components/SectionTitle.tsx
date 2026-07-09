interface SectionTitleProps {
  children: React.ReactNode;
  /** Conteúdo opcional alinhado à direita (ex.: chip de período). */
  action?: React.ReactNode;
}

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-3 first:mt-0">
      <h3 className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-brand">
        {children}
      </h3>
      <div className="h-px flex-1 bg-gradient-to-r from-brand/40 to-transparent" />
      {action}
    </div>
  );
}
