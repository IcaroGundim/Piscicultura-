'use client';

import * as React from 'react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ConfirmPopoverProps {
  /** Elemento gatilho (ex.: o botão de lixeira). O popover ancora nele. */
  children: React.ReactElement;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

/**
 * Confirmação leve ancorada ao próprio gatilho (em vez de um modal central).
 * Ideal para ações por linha, como excluir um item de uma tabela.
 */
export default function ConfirmPopover({
  children,
  title = 'Confirmar?',
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  side = 'left',
  align = 'center',
}: ConfirmPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={children} />
      <PopoverContent side={side} align={align} className="w-64 p-3">
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            size="sm"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
