'use client';

import { useStore } from '@/lib/store';
import { Trash2 } from 'lucide-react';

interface TankDeleteButtonProps {
  tankId: number;
}

export default function TankDeleteButton({ tankId }: TankDeleteButtonProps) {
  const removeTank = useStore((s) => s.removeTank);

  const handleConfirm = () => {
    const confirmed = window.confirm(
      `Remover Tanque #${String(tankId).padStart(2, '0')}? Todos os dados de lote serão perdidos.`
    );
    if (confirmed) {
      removeTank(tankId);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleConfirm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleConfirm();
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="absolute bottom-2 right-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground/50 opacity-0 transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
      title={`Remover Tanque #${String(tankId).padStart(2, '0')}`}
      aria-label={`Remover Tanque #${String(tankId).padStart(2, '0')}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </span>
  );
}
