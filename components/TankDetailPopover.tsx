'use client';

import type { Tank } from '@/lib/types';
import { useStore } from '@/lib/store';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
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
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        nativeButton={false}
        render={
          <TankCard tank={tank} isSelected={open} animationDelay={animationDelay} />
        }
      />
      <PopoverContent
        side="right"
        align="start"
        sideOffset={10}
        className="w-[min(32rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border-border bg-card p-0 shadow-2xl shadow-black/10 ring-0 backdrop-blur-none duration-150"
      >
        <TankDetailPanel
          tank={tank}
          bercarioLote={bercarioLotes.find((l) => l.tankId === tank.id)}
          recriaLote={recriaLotes.find((l) => l.tankId === tank.id)}
          engordaLote={engordaLotes.find((l) => l.tankId === tank.id)}
          onClose={() => onOpenChange(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
