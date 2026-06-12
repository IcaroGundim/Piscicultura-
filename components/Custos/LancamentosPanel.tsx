'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBRL } from '@/lib/format';
import {
  CATEGORIA_CUSTO_COLORS,
  CATEGORIA_CUSTO_LABELS,
  CATEGORIA_RECEITA_COLORS,
  CATEGORIA_RECEITA_LABELS,
  type CategoriaLancamento,
  type Lancamento,
  type TipoLancamento,
} from '@/lib/types';
import {
  CATEGORIA_UNIDADES,
  CATEGORIAS_CUSTO,
  CATEGORIAS_RECEITA,
  anosDisponiveis,
  isCusto,
  isReceita,
  totalLancamento,
  totalPorCategoriaCusto,
  totalPorCategoriaReceita,
} from '@/lib/lancamentos';
import { useStore } from '@/lib/store';
import LancamentoDialog from './LancamentoDialog';

const MONTH_LABELS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

interface LancamentosPanelProps {
  lancamentos: Lancamento[];
  onChange: () => void;
}

export default function LancamentosPanel({
  lancamentos,
  onChange,
}: LancamentosPanelProps) {
  const addLancamento = useStore((s) => s.addLancamento);
  const updateLancamento = useStore((s) => s.updateLancamento);
  const removeLancamento = useStore((s) => s.removeLancamento);

  const [tipoAtivo, setTipoAtivo] = useState<TipoLancamento>('custo');

  const anos = useMemo(() => {
    const list = anosDisponiveis(lancamentos);
    if (list.length === 0) list.push(new Date().getFullYear());
    return list;
  }, [lancamentos]);

  const [anoFiltro, setAnoFiltro] = useState<number>(anos[0]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaLancamento | 'todas'>('todas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lancamento | null>(null);

  if (!anos.includes(anoFiltro)) {
    setAnoFiltro(anos[0]);
  }

  const categorias: CategoriaLancamento[] =
    tipoAtivo === 'receita' ? [...CATEGORIAS_RECEITA] : [...CATEGORIAS_CUSTO];
  const labels = tipoAtivo === 'receita' ? CATEGORIA_RECEITA_LABELS : CATEGORIA_CUSTO_LABELS;
  const colors = tipoAtivo === 'receita' ? CATEGORIA_RECEITA_COLORS : CATEGORIA_CUSTO_COLORS;

  const filtrados = useMemo(() => {
    const filtroTipo = tipoAtivo === 'receita' ? isReceita : isCusto;
    return lancamentos
      .filter(filtroTipo)
      .filter((l) => l.ano === anoFiltro)
      .filter((l) => categoriaFiltro === 'todas' || l.categoria === categoriaFiltro)
      .sort((a, b) => (b.mes - a.mes) || b.id.localeCompare(a.id));
  }, [lancamentos, anoFiltro, categoriaFiltro, tipoAtivo]);

  const totaisAno = useMemo(() => {
    const doAno = lancamentos.filter((l) => l.ano === anoFiltro);
    return tipoAtivo === 'receita'
      ? totalPorCategoriaReceita(doAno)
      : totalPorCategoriaCusto(doAno);
  }, [lancamentos, anoFiltro, tipoAtivo]);

  const totalAno = Object.values(totaisAno).reduce((s, v) => s + v, 0);

  const handleTipoChange = (next: TipoLancamento) => {
    setTipoAtivo(next);
    setCategoriaFiltro('todas');
  };

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (l: Lancamento) => {
    setEditing(l);
    setDialogOpen(true);
  };

  const handleSave = (input: Omit<Lancamento, 'id'>) => {
    if (editing) {
      updateLancamento(editing.id, input);
    } else {
      addLancamento(input);
    }
    onChange();
  };

  const handleRemove = (id: string) => {
    if (confirm(`Excluir este${tipoAtivo === 'receita' ? 'a receita' : ' lançamento'}?`)) {
      removeLancamento(id);
      onChange();
    }
  };

  const isReceitaAtivo = tipoAtivo === 'receita';
  const novoLabel = isReceitaAtivo ? 'Nova receita' : 'Novo lançamento';
  const resumoTitulo = isReceitaAtivo ? `Receitas ${anoFiltro}` : `Custos ${anoFiltro}`;
  const tipoLabel = isReceitaAtivo ? 'receita' : 'lançamento';

  return (
    <div className="space-y-5">
      {/* Sub-abas Custos / Receitas */}
      <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
        <SubTabButton
          active={tipoAtivo === 'custo'}
          onClick={() => handleTipoChange('custo')}
        >
          Custos
        </SubTabButton>
        <SubTabButton
          active={tipoAtivo === 'receita'}
          onClick={() => handleTipoChange('receita')}
        >
          Receitas
        </SubTabButton>
      </div>

      {/* Resumo por categoria */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-foreground">{resumoTitulo}</h2>
          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              isReceitaAtivo ? 'text-emerald-700' : 'text-foreground'
            )}
          >
            Total: {formatBRL(totalAno)}
          </span>
        </div>
        <ul
          className={cn(
            'grid grid-cols-2 gap-2',
            isReceitaAtivo ? 'sm:grid-cols-3' : 'sm:grid-cols-3 lg:grid-cols-6'
          )}
        >
          {categorias.map((cat) => (
            <li key={cat} className="rounded-lg border border-border/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colors[cat as keyof typeof colors] }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {labels[cat as keyof typeof labels]}
                </span>
              </div>
              <span className="mt-1 block text-sm font-bold tabular-nums text-foreground">
                {formatBRL(totaisAno[cat as keyof typeof totaisAno] ?? 0)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Filtros + ação */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-end gap-3 flex-wrap">
          <FilterSelect
            label="Ano"
            value={anoFiltro}
            onChange={(e) => setAnoFiltro(Number(e.target.value))}
          >
            {anos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Categoria"
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value as CategoriaLancamento | 'todas')}
          >
            <option value="todas">Todas</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {labels[cat as keyof typeof labels]}
              </option>
            ))}
          </FilterSelect>
        </div>
        <button
          type="button"
          onClick={handleNew}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-primary-foreground',
            isReceitaAtivo ? 'bg-emerald-600 hover:bg-emerald-600/90' : 'bg-primary hover:bg-primary/90'
          )}
        >
          <Plus className="h-4 w-4" />
          {novoLabel}
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {filtrados.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum{isReceitaAtivo ? 'a receita' : ' lançamento'}
            {categoriaFiltro !== 'todas'
              ? ` de ${labels[categoriaFiltro as keyof typeof labels] ?? ''}`
              : ''} em {anoFiltro}.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Mês</th>
                <th className="px-3 py-2 text-left font-semibold">Categoria</th>
                <th className="px-3 py-2 text-right font-semibold">Qtd</th>
                <th className="px-3 py-2 text-right font-semibold">Preço un.</th>
                <th className="px-3 py-2 text-right font-semibold">Total</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtrados.map((l) => {
                const catColor = colors[l.categoria as keyof typeof colors] ?? '#52525b';
                const catLabel = labels[l.categoria as keyof typeof labels] ?? l.categoria;
                return (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 tabular-nums">{MONTH_LABELS_SHORT[l.mes - 1]}/{l.ano}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: catColor }}
                        />
                        {catLabel}
                      </span>
                      {l.descricao && (
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {l.descricao}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {l.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        {CATEGORIA_UNIDADES[l.categoria]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatBRL(l.precoUnitario)}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2 text-right font-bold tabular-nums',
                        isReceitaAtivo ? 'text-emerald-700' : 'text-foreground'
                      )}
                    >
                      {formatBRL(totalLancamento(l))}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(l)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title={`Editar ${tipoLabel}`}
                          aria-label={`Editar ${tipoLabel}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(l.id)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          title={`Excluir ${tipoLabel}`}
                          aria-label={`Excluir ${tipoLabel}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <LancamentoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editing}
        tipo={tipoAtivo}
        onSave={handleSave}
      />
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}

function FilterSelect({ label, value, onChange, children }: FilterSelectProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="group relative">
        <select
          value={value}
          onChange={onChange}
          className={cn(
            'w-full appearance-none cursor-pointer rounded-lg border border-input bg-background py-2 pl-3 pr-9 text-sm font-medium text-foreground shadow-sm transition-colors',
            'hover:border-primary/50 hover:bg-muted/30',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
          )}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
    </label>
  );
}

interface SubTabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function SubTabButton({ active, onClick, children }: SubTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}
