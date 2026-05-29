'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBRL } from '@/lib/format';
import {
  CATEGORIA_LANCAMENTO_COLORS,
  CATEGORIA_LANCAMENTO_LABELS,
  type CategoriaLancamento,
  type Lancamento,
  type TipoLancamento,
} from '@/lib/types';
import {
  CATEGORIA_UNIDADES,
  CATEGORIAS_CUSTO,
  CATEGORIAS_RECEITA,
} from '@/lib/lancamentos';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface LancamentoDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: Lancamento | null;
  tipo?: TipoLancamento;
  onSave: (input: Omit<Lancamento, 'id'>) => void;
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

  const now = new Date();
  const [mes, setMes] = useState<number>(now.getMonth() + 1);
  const [ano, setAno] = useState<number>(now.getFullYear());
  const [categoria, setCategoria] = useState<CategoriaLancamento>(categoriaPadrao);
  const [quantidade, setQuantidade] = useState<number>(0);
  const [precoUnitario, setPrecoUnitario] = useState<number>(0);
  const [descricao, setDescricao] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setMes(initial.mes);
      setAno(initial.ano);
      setCategoria(initial.categoria);
      setQuantidade(initial.quantidade);
      setPrecoUnitario(initial.precoUnitario);
      setDescricao(initial.descricao ?? '');
    } else {
      const n = new Date();
      setMes(n.getMonth() + 1);
      setAno(n.getFullYear());
      setCategoria(categoriaPadrao);
      setQuantidade(0);
      setPrecoUnitario(0);
      setDescricao('');
    }
  }, [open, initial, categoriaPadrao]);

  if (!open) return null;

  const total = quantidade * precoUnitario;
  const unidade = CATEGORIA_UNIDADES[categoria];
  const isReceita = effectiveTipo === 'receita';
  const titulo = initial
    ? (isReceita ? 'Editar receita' : 'Editar lançamento')
    : (isReceita ? 'Nova receita' : 'Novo lançamento');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const desc = descricao.trim();
    onSave({
      mes,
      ano,
      tipo: effectiveTipo,
      categoria,
      quantidade,
      precoUnitario,
      ...(desc ? { descricao: desc } : {}),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
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
              <Select
                value={String(mes)}
                onValueChange={(v) => setMes(Number(v))}
              >
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
            <Select
              value={categoria}
              onValueChange={(v) => setCategoria(v as CategoriaLancamento)}
            >
              <SelectTrigger className="mt-1 h-10 w-full">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORIA_LANCAMENTO_COLORS[categoria] }}
                    />
                    <span className="truncate">{CATEGORIA_LANCAMENTO_LABELS[categoria]}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categoriasDisponiveis.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORIA_LANCAMENTO_COLORS[cat] }}
                      />
                      <span>{CATEGORIA_LANCAMENTO_LABELS[cat]}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
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
                type="number"
                min={0}
                step="any"
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                Preço unitário (R$)
              </span>
              <input
                type="number"
                min={0}
                step="any"
                value={precoUnitario}
                onChange={(e) => setPrecoUnitario(Math.max(0, Number(e.target.value) || 0))}
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
              placeholder="Ex.: lote 042, fornecedor X…"
              maxLength={120}
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </label>

          <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </span>
            <span className="text-base font-bold tabular-nums text-foreground">
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
                'rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground',
                'hover:bg-primary/90'
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
