'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBRL } from '@/lib/format';
import {
  CATEGORIA_LANCAMENTO_LABELS,
  PHASE_LABELS,
  type CategoriaLancamento,
  type Lancamento,
  type TipoLancamento,
} from '@/lib/types';
import { CATEGORIA_UNIDADES, CATEGORIAS_CUSTO, CATEGORIAS_RECEITA } from '@/lib/lancamentos';
import { useStore, type VendaVinculo } from '@/lib/store';
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

/**
 * Converte o texto digitado num número não-negativo, aceitando vírgula como
 * separador decimal (padrão pt-BR). Texto vazio/ inválido vira 0 — mas o estado
 * do input continua sendo a string crua, então o usuário pode apagar o "0" e
 * digitar livremente (inclusive valores decimais e intermediários como "1,").
 */
function parseNum(value: string): number {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Mantém apenas caracteres válidos de um número: dígitos e um único separador
 * decimal (vírgula ou ponto). Descarta letras, símbolos e separadores extras —
 * assim os campos só aceitam valores.
 */
function sanitizeNumeric(value: string): string {
  let cleaned = value.replace(/[^\d.,]/g, '');
  const firstSep = cleaned.search(/[.,]/);
  if (firstSep !== -1) {
    const intPart = cleaned.slice(0, firstSep);
    const decPart = cleaned.slice(firstSep + 1).replace(/[.,]/g, '');
    cleaned = intPart + cleaned[firstSep] + decPart;
  }
  return cleaned;
}

/** Formata um peso em kg com até 1 casa decimal (sem casas para inteiros). */
function formatKg(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

interface LancamentoDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: Lancamento | null;
  tipo?: TipoLancamento;
  onSave: (input: Omit<Lancamento, 'id'>, vinculo?: VendaVinculo) => void;
}

export default function LancamentoDialog({
  open,
  onClose,
  initial,
  tipo = 'custo',
  onSave,
}: LancamentoDialogProps) {
  const effectiveTipo: TipoLancamento = initial?.tipo ?? tipo;
  const categoriasDisponiveis: CategoriaLancamento[] =
    effectiveTipo === 'receita' ? [...CATEGORIAS_RECEITA] : [...CATEGORIAS_CUSTO];
  const categoriaPadrao: CategoriaLancamento =
    effectiveTipo === 'receita' ? 'venda_peixe' : 'racao';

  const tanks = useStore((s) => s.activeTanks);
  const movimentacoes = useStore((s) => s.activeMovimentacoes);
  const bercarioLotes = useStore((s) => s.activeBercarioLotes);
  const recriaLotes = useStore((s) => s.activeRecriaLotes);
  const engordaLotes = useStore((s) => s.activeEngordaLotes);

  const now = new Date();
  const [mes, setMes] = useState<number>(now.getMonth() + 1);
  const [ano, setAno] = useState<number>(now.getFullYear());
  const [categoria, setCategoria] = useState<CategoriaLancamento>(categoriaPadrao);
  // Inputs numéricos são guardados como string (texto cru) para permitir edição
  // livre — apagar o zero, digitar vírgula, valores intermediários. A conversão
  // para número acontece em `parseNum` no momento do cálculo/salvamento.
  const [quantidade, setQuantidade] = useState<string>('');
  const [precoUnitario, setPrecoUnitario] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [tankOrigemId, setTankOrigemId] = useState<number | null>(null);
  const [pesoAbatido, setPesoAbatido] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setMes(initial.mes);
      setAno(initial.ano);
      setCategoria(initial.categoria);
      setQuantidade(initial.quantidade ? String(initial.quantidade) : '');
      setPrecoUnitario(initial.precoUnitario ? String(initial.precoUnitario) : '');
      setDescricao(initial.descricao ?? '');
    } else {
      const n = new Date();
      setMes(n.getMonth() + 1);
      setAno(n.getFullYear());
      setCategoria(categoriaPadrao);
      setQuantidade('');
      setPrecoUnitario('');
      setDescricao('');
    }
    setTankOrigemId(null);
    setPesoAbatido('');
  }, [open, initial, categoriaPadrao]);

  if (!open) return null;

  const quantidadeNum = parseNum(quantidade);
  const precoUnitarioNum = parseNum(precoUnitario);
  const pesoAbatidoNum = parseNum(pesoAbatido);
  const total = quantidadeNum * precoUnitarioNum;
  const unidade = CATEGORIA_UNIDADES[categoria];
  const isReceita = effectiveTipo === 'receita';
  // Vínculo com tanque só na criação de uma venda de peixe (não na edição).
  const podeVincularTanque = isReceita && categoria === 'venda_peixe' && !initial;

  // Saldo do tanque de origem em nº de peixes (livro de movimentações) e o peso
  // médio por peixe do lote ativo — usado para converter o peso abatido (kg)
  // informado pelo usuário em nº de peixes para o registro da movimentação.
  const saldoOrigem =
    tankOrigemId != null ? saldoDoTanque(tankOrigemId, movimentacoes) : null;
  const loteOrigem =
    tankOrigemId != null
      ? bercarioLotes.find((l) => l.tankId === tankOrigemId) ??
        recriaLotes.find((l) => l.tankId === tankOrigemId) ??
        engordaLotes.find((l) => l.tankId === tankOrigemId) ??
        null
      : null;
  const pesoMedioOrigem =
    loteOrigem && loteOrigem.qtd_peixes > 0
      ? loteOrigem.peso_total_kg / loteOrigem.qtd_peixes
      : 0;
  // Peso total atual em estoque no tanque (kg).
  const saldoPesoOrigem =
    saldoOrigem != null ? saldoOrigem * pesoMedioOrigem : null;
  // Conversão do peso abatido (kg) → nº de peixes, limitada ao saldo do tanque.
  const qtdPeixesAbate =
    pesoMedioOrigem > 0 && saldoOrigem != null
      ? Math.min(saldoOrigem, Math.round(pesoAbatidoNum / pesoMedioOrigem))
      : 0;
  const titulo = initial
    ? isReceita
      ? 'Editar receita'
      : 'Editar lançamento'
    : isReceita
      ? 'Nova receita'
      : 'Novo lançamento';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const desc = descricao.trim();
    const vinculo: VendaVinculo | undefined =
      podeVincularTanque && tankOrigemId != null && qtdPeixesAbate > 0
        ? { tankId: tankOrigemId, qtdPeixes: qtdPeixesAbate }
        : undefined;
    onSave(
      {
        mes,
        ano,
        tipo: effectiveTipo,
        categoria,
        quantidade: quantidadeNum,
        precoUnitario: precoUnitarioNum,
        ...(desc ? { descricao: desc } : {}),
      },
      vinculo
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="block">
              <span className="text-xs font-semibold text-muted-foreground">Mês</span>
              <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                <SelectTrigger className="mt-1 h-10 w-full">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                        {String(mes).padStart(2, '0')}
                      </span>
                      <span className="truncate">{MONTH_LABELS[mes - 1]}</span>
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
            <label className="block">
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

          <div className="block">
            <span className="text-xs font-semibold text-muted-foreground">Categoria</span>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaLancamento)}>
              <SelectTrigger className="mt-1 h-10 w-full">
                <SelectValue>
                  <span className="truncate">{CATEGORIA_LANCAMENTO_LABELS[categoria]}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categoriasDisponiveis.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-2">
                      <span>{CATEGORIA_LANCAMENTO_LABELS[cat]}</span>
                      <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                        {CATEGORIA_UNIDADES[cat]}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                Quantidade ({unidade})
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={quantidade}
                onChange={(e) => setQuantidade(sanitizeNumeric(e.target.value))}
                className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                Preço unitário (R$)
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={precoUnitario}
                onChange={(e) => setPrecoUnitario(sanitizeNumeric(e.target.value))}
                className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums"
              />
            </label>
          </div>

          {podeVincularTanque && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                Abater peixes de um tanque
              </span>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="block">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Tanque de origem
                  </span>
                  <Select
                    value={tankOrigemId != null ? String(tankOrigemId) : 'nenhum'}
                    onValueChange={(v) => setTankOrigemId(v === 'nenhum' ? null : Number(v))}
                  >
                    <SelectTrigger className="mt-1 h-9 w-full">
                      <SelectValue>
                        <span className="truncate">
                          {tankOrigemId != null
                            ? `Tanque ${tankOrigemId.toString().padStart(2, '0')}`
                            : 'Nenhum'}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum</SelectItem>
                      {tanks.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          Tanque {t.id.toString().padStart(2, '0')} · {PHASE_LABELS[t.phase]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="block">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Peso abatido (kg)
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={pesoAbatido}
                    disabled={tankOrigemId == null}
                    onChange={(e) => setPesoAbatido(sanitizeNumeric(e.target.value))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums disabled:opacity-50"
                  />
                </label>
              </div>
              {saldoOrigem != null && (
                <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
                  {pesoMedioOrigem > 0 && saldoPesoOrigem != null ? (
                    <>
                      Saldo atual: {formatKg(saldoPesoOrigem)} kg
                      <span className="text-muted-foreground/70">
                        {' '}
                        (≈ {saldoOrigem.toLocaleString('pt-BR')} peixes)
                      </span>
                      {pesoAbatidoNum > 0 && (
                        <>
                          {' '}
                          → restará{' '}
                          {formatKg(Math.max(0, saldoPesoOrigem - pesoAbatidoNum))} kg
                          <span className="text-muted-foreground/70">
                            {' '}
                            (≈ {qtdPeixesAbate.toLocaleString('pt-BR')} peixes abatidos)
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-amber-700">
                      Tanque sem peso médio definido — abertura por peso indisponível.
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          <label className="block">
            <span className="flex items-baseline justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Descrição</span>
              <span className="text-[10px] text-muted-foreground/70">opcional</span>
            </span>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: lote 042, fornecedor X…"
              maxLength={120}
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </label>

          <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
            <span className="text-xs font-medium text-brand">Total</span>
            <span className="text-base font-semibold tabular-nums text-foreground">
              {formatBRL(total)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={cn(
                'rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground',
                'hover:bg-brand/90'
              )}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
