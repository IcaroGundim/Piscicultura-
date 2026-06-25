'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MOVIMENTACAO_TIPO_LABELS,
  PHASE_LABELS,
  type MovimentacaoTipo,
  type Tank,
  type TankPhase,
} from '@/lib/types';
import { useStore } from '@/lib/store';
import { saldoDoTanque } from '@/lib/movimentacoes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

// Tipos disponíveis a partir do painel do tanque (venda fica em Custos).
const TIPOS: MovimentacaoTipo[] = ['povoamento', 'ajuste', 'transferencia'];
const FASES_DESTINO: Exclude<TankPhase, 'vazio'>[] = ['bercario', 'recria', 'engorda'];

interface MovimentacaoDialogProps {
  open: boolean;
  onClose: () => void;
  tank: Tank;
}

export default function MovimentacaoDialog({ open, onClose, tank }: MovimentacaoDialogProps) {
  const addMovimentacao = useStore((s) => s.addMovimentacao);
  const transferirPeixes = useStore((s) => s.transferirPeixes);
  const tanks = useStore((s) => s.activeTanks);
  const movimentacoes = useStore((s) => s.activeMovimentacoes);

  const saldoAtual = useMemo(
    () => saldoDoTanque(tank.id, movimentacoes),
    [tank.id, movimentacoes]
  );

  const destinos = useMemo(() => tanks.filter((t) => t.id !== tank.id), [tanks, tank.id]);

  const now = new Date();
  const [tipo, setTipo] = useState<MovimentacaoTipo>('povoamento');
  const [direcao, setDirecao] = useState<'entrada' | 'saida'>('entrada');
  const [quantidade, setQuantidade] = useState<number>(0);
  const [mes, setMes] = useState<number>(now.getMonth() + 1);
  const [ano, setAno] = useState<number>(now.getFullYear());
  const [descricao, setDescricao] = useState<string>('');
  const [destinoTankId, setDestinoTankId] = useState<number | null>(destinos[0]?.id ?? null);
  const [faseDestino, setFaseDestino] = useState<Exclude<TankPhase, 'vazio'>>('recria');

  useEffect(() => {
    if (!open) return;
    const n = new Date();
    setTipo('povoamento');
    setDirecao('entrada');
    setQuantidade(0);
    setMes(n.getMonth() + 1);
    setAno(n.getFullYear());
    setDescricao('');
    setDestinoTankId(destinos[0]?.id ?? null);
    setFaseDestino('recria');
  }, [open, destinos]);

  if (!open) return null;

  const isTransfer = tipo === 'transferencia';
  const isAjuste = tipo === 'ajuste';
  // Saída quando: ajuste de saída ou transferência (sai da origem).
  const efDirecao: 'entrada' | 'saida' = isTransfer ? 'saida' : isAjuste ? direcao : 'entrada';
  const qtdValida = Math.max(0, Math.round(quantidade));
  const delta = efDirecao === 'saida' ? -qtdValida : qtdValida;
  const saldoPrevisto = Math.max(0, saldoAtual + delta);

  const transferSemDestino = isTransfer && destinoTankId == null;
  const podeSalvar = qtdValida > 0 && !transferSemDestino;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeSalvar) return;
    const desc = descricao.trim();

    if (isTransfer && destinoTankId != null) {
      transferirPeixes({
        origemTankId: tank.id,
        destinoTankId,
        quantidade: qtdValida,
        faseDestino,
        ano,
        mes,
        ...(desc ? { descricao: desc } : {}),
      });
    } else {
      addMovimentacao({
        tankId: tank.id,
        tipo,
        direcao: efDirecao,
        quantidade: qtdValida,
        ano,
        mes,
        ...(tank.phase !== 'vazio' ? { faseTanque: tank.phase } : {}),
        ...(desc ? { descricao: desc } : {}),
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Movimentar — Tanque {tank.id.toString().padStart(2, '0')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="block">
            <span className="text-xs font-semibold text-muted-foreground">Tipo</span>
            <Select value={tipo} onValueChange={(v) => setTipo(v as MovimentacaoTipo)}>
              <SelectTrigger className="mt-1 h-10 w-full">
                <SelectValue>
                  <span className="truncate">{MOVIMENTACAO_TIPO_LABELS[tipo]}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {MOVIMENTACAO_TIPO_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAjuste && (
            <div className="block">
              <span className="text-xs font-semibold text-muted-foreground">Direção</span>
              <Select value={direcao} onValueChange={(v) => setDirecao(v as 'entrada' | 'saida')}>
                <SelectTrigger className="mt-1 h-10 w-full">
                  <SelectValue>
                    <span className="truncate">
                      {direcao === 'entrada' ? 'Entrada (+)' : 'Saída (−)'}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (+)</SelectItem>
                  <SelectItem value="saida">Saída (−)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isTransfer && (
            <div className="grid grid-cols-2 gap-3">
              <div className="block">
                <span className="text-xs font-semibold text-muted-foreground">Tanque destino</span>
                <Select
                  value={destinoTankId != null ? String(destinoTankId) : ''}
                  onValueChange={(v) => setDestinoTankId(Number(v))}
                >
                  <SelectTrigger className="mt-1 h-10 w-full">
                    <SelectValue>
                      <span className="truncate">
                        {destinoTankId != null
                          ? `Tanque ${destinoTankId.toString().padStart(2, '0')}`
                          : '—'}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {destinos.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        Tanque {t.id.toString().padStart(2, '0')} · {PHASE_LABELS[t.phase]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="block">
                <span className="text-xs font-semibold text-muted-foreground">Fase destino</span>
                <Select
                  value={faseDestino}
                  onValueChange={(v) => setFaseDestino(v as Exclude<TankPhase, 'vazio'>)}
                >
                  <SelectTrigger className="mt-1 h-10 w-full">
                    <SelectValue>
                      <span className="truncate">{PHASE_LABELS[faseDestino]}</span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FASES_DESTINO.map((f) => (
                      <SelectItem key={f} value={f}>
                        {PHASE_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-1 block">
              <span className="text-xs font-semibold text-muted-foreground">Qtd. peixes</span>
              <input
                type="number"
                min={0}
                step={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums"
              />
            </label>
            <div className="col-span-1 block">
              <span className="text-xs font-semibold text-muted-foreground">Mês</span>
              <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                <SelectTrigger className="mt-1 h-10 w-full">
                  <SelectValue>
                    <span className="font-mono text-[11px] tabular-nums">
                      {String(mes).padStart(2, '0')}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MONTH_LABELS.map((label, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span>{label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="col-span-1 block">
              <span className="text-xs font-semibold text-muted-foreground">Ano</span>
              <input
                type="number"
                min={1900}
                max={3000}
                step={1}
                value={ano}
                onChange={(e) => setAno(Math.floor(Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums"
              />
            </label>
          </div>

          <label className="block">
            <span className="flex items-baseline justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Descrição</span>
              <span className="text-[10px] text-muted-foreground/70">opcional</span>
            </span>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: classificação, mortalidade, lote X…"
              maxLength={120}
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </label>

          <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium text-muted-foreground">
              Saldo {tank.id.toString().padStart(2, '0')}
            </span>
            <span className="tabular-nums text-foreground">
              {saldoAtual.toLocaleString('pt-BR')}
              <span className="mx-1.5 text-muted-foreground">→</span>
              <span className="font-semibold">{saldoPrevisto.toLocaleString('pt-BR')}</span>
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!podeSalvar}
              className={cn(
                'rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90',
                !podeSalvar && 'cursor-not-allowed opacity-50'
              )}
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
