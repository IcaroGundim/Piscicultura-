'use client';

import type { Tank } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';
import TankDetailPanel from './TankDetailPanel';

interface TankDetailModalProps {
  tank: Tank | null;
  onClose: () => void;
}

export default function TankDetailModal({ tank, onClose }: TankDetailModalProps) {
  const bercarioLotes = useStore((s) => s.activeBercarioLotes);
  const recriaLotes = useStore((s) => s.activeRecriaLotes);
  const engordaLotes = useStore((s) => s.activeEngordaLotes);

  const open = tank !== null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogPrimitive.Portal>
        {/* Backdrop com desfoque sutil */}
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/15 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />

        {/* Popup centralizado */}
        <DialogPrimitive.Popup
          className={cn(
            'fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-xl h-auto max-h-[90vh] overflow-hidden',
            'rounded-2xl border border-border bg-card shadow-2xl',
            'duration-100 outline-none',
            'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-98',
            'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-98'
          )}
        >
          {tank && (
            <TankDetailPanel
              tank={tank}
              bercarioLote={bercarioLotes.find((l) => l.tankId === tank.id)}
              recriaLote={recriaLotes.find((l) => l.tankId === tank.id)}
              engordaLote={engordaLotes.find((l) => l.tankId === tank.id)}
              onClose={onClose}
            />
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
