import { ArrowRight } from 'lucide-react';

interface PhaseFlowProps {
  fromKg: number;
  midKg: number;
}

export default function PhaseFlow({ fromKg, midKg }: PhaseFlowProps) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      <span className="font-medium text-(--phase-bercario)">Berçário</span>
      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span className="font-mono tabular-nums">{fromKg} kg</span>
      </span>
      <span className="font-medium text-(--phase-recria)">Recria</span>
      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span className="font-mono tabular-nums">{midKg} kg</span>
      </span>
      <span className="font-medium text-(--phase-engorda)">Engorda</span>
    </div>
  );
}
