'use client';

import type { Tank } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import TankCard from './TankCard';
import TankDetailPanel from './TankDetailPanel';

interface TankDetailPopoverProps {
  tank: Tank;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animationDelay?: number;
}

export default function TankDetailPopover({
  tank,
  open,
  onOpenChange,
  animationDelay,
}: TankDetailPopoverProps) {
  const bercarioLotes = useStore((s) => s.activeBercarioLotes);
  const recriaLotes = useStore((s) => s.activeRecriaLotes);
  const engordaLotes = useStore((s) => s.activeEngordaLotes);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        nativeButton={false}
        render={<TankCard tank={tank} isSelected={open} animationDelay={animationDelay} />}
      />
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-none border-t-2 border-brand bg-card p-0 backdrop-blur-none data-[side=right]:w-full data-[side=right]:sm:max-w-[32rem] sm:rounded-l-sm sm:shadow-2xl sm:shadow-black/10"
      >
        <TankDetailPanel
          tank={tank}
          bercarioLote={bercarioLotes.find((l) => l.tankId === tank.id)}
          recriaLote={recriaLotes.find((l) => l.tankId === tank.id)}
          engordaLote={engordaLotes.find((l) => l.tankId === tank.id)}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
