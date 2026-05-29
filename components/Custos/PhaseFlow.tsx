import { ArrowRight } from 'lucide-react';

interface PhaseFlowProps {
  fromKg: number;
  midKg: number;
}

export default function PhaseFlow({ fromKg, midKg }: PhaseFlowProps) {
  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-2">
      <div className="flex items-center justify-between gap-1.5 text-[10px] font-semibold">
        <span className="flex-1 text-center px-1.5 py-1 rounded bg-(--phase-bercario)/22 border border-(--phase-bercario)/45 text-[#2d4518]">
          Berçário
        </span>
        <span className="shrink-0 flex flex-col items-center text-muted-foreground">
          <ArrowRight className="h-3 w-3" />
          <span className="tabular-nums">{fromKg} kg</span>
        </span>
        <span className="flex-1 text-center px-1.5 py-1 rounded bg-(--phase-recria)/12 border border-(--phase-recria)/28 text-(--phase-recria)">
          Recria
        </span>
        <span className="shrink-0 flex flex-col items-center text-muted-foreground">
          <ArrowRight className="h-3 w-3" />
          <span className="tabular-nums">{midKg} kg</span>
        </span>
        <span className="flex-1 text-center px-1.5 py-1 rounded bg-(--phase-engorda)/12 border border-(--phase-engorda)/35 text-blue-900">
          Engorda
        </span>
      </div>
    </div>
  );
}
