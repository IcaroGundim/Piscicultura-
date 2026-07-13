'use client';

import { useMemo, useState } from 'react';
import { FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBRL } from '@/lib/format';
import {
  CATEGORIA_CUSTO_LABELS,
  CATEGORIA_RECEITA_LABELS,
  LOCATION_LABELS,
  type CategoriaLancamento,
  type Lancamento,
  type LocationKey,
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
import { useStore, type VendaVinculo } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ConfirmPopover from '@/components/ui/ConfirmPopover';
import LancamentoDialog from './LancamentoDialog';

const MONTH_LABELS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

interface LancamentosPanelProps {
  lancamentos: Lancamento[];
  onChange: () => void;
}

export default function LancamentosPanel({ lancamentos, onChange }: LancamentosPanelProps) {
  const addLancamento = useStore((s) => s.addLancamento);
  const updateLancamento = useStore((s) => s.updateLancamento);
  const removeLancamento = useStore((s) => s.removeLancamento);
  const activeLocation = useStore((s) => s.activeLocation);

  const [tipoAtivo, setTipoAtivo] = useState<TipoLancamento>('custo');
  const [exporting, setExporting] = useState(false);

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

  const filtrados = useMemo(() => {
    const filtroTipo = tipoAtivo === 'receita' ? isReceita : isCusto;
    return lancamentos
      .filter(filtroTipo)
      .filter((l) => l.ano === anoFiltro)
      .filter((l) => categoriaFiltro === 'todas' || l.categoria === categoriaFiltro)
      .sort((a, b) => b.mes - a.mes || b.id.localeCompare(a.id));
  }, [lancamentos, anoFiltro, categoriaFiltro, tipoAtivo]);

  const totaisAno = useMemo(() => {
    const doAno = lancamentos.filter((l) => l.ano === anoFiltro);
    return tipoAtivo === 'receita'
      ? totalPorCategoriaReceita(doAno)
      : totalPorCategoriaCusto(doAno);
  }, [lancamentos, anoFiltro, tipoAtivo]);

  const totalAno = Object.values(totaisAno).reduce((s, v) => s + v, 0);

  const temDadosDoTipo = useMemo(
    () => lancamentos.some(tipoAtivo === 'receita' ? isReceita : isCusto),
    [lancamentos, tipoAtivo]
  );

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

  const handleSave = (input: Omit<Lancamento, 'id'>, vinculo?: VendaVinculo) => {
    if (editing) {
      updateLancamento(editing.id, input);
    } else {
      addLancamento(input, vinculo);
    }
    onChange();
  };

  const handleRemove = (id: string) => {
    removeLancamento(id);
    onChange();
  };

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { generateFinanceReport } = await import('@/lib/generateFinanceReport');
      generateFinanceReport({
        lancamentos,
        tipo: tipoAtivo,
        locationName: LOCATION_LABELS[activeLocation as LocationKey],
      });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  const isReceitaAtivo = tipoAtivo === 'receita';
  const novoLabel = isReceitaAtivo ? 'Nova receita' : 'Novo lançamento';
  const resumoTitulo = isReceitaAtivo ? `Receitas ${anoFiltro}` : `Custos ${anoFiltro}`;
  const tipoLabel = isReceitaAtivo ? 'receita' : 'lançamento';

  return (
    <div className="space-y-5">
      {/* Sub-abas Custos / Receitas */}
      <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
        <SubTabButton active={tipoAtivo === 'custo'} onClick={() => handleTipoChange('custo')}>
          Custos
        </SubTabButton>
        <SubTabButton active={tipoAtivo === 'receita'} onClick={() => handleTipoChange('receita')}>
          Receitas
        </SubTabButton>
      </div>

      {/* Resumo por categoria */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-medium text-brand">{resumoTitulo}</h2>
          <span
            className={cn(
              'text-sm font-medium tabular-nums',
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
            <li key={cat} className="rounded-md border border-border/60 px-3 py-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                {labels[cat as keyof typeof labels]}
              </span>
              <span className="mt-1 block text-sm font-medium tabular-nums text-foreground">
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
            options={anos.map((a) => ({ value: String(a), label: String(a) }))}
            onChange={(v) => setAnoFiltro(Number(v))}
          />
          <FilterSelect
            label="Categoria"
            value={categoriaFiltro}
            options={[
              { value: 'todas', label: 'Todas' },
              ...categorias.map((cat) => ({
                value: cat,
                label: labels[cat as keyof typeof labels],
              })),
            ]}
            onChange={(v) => setCategoriaFiltro(v as CategoriaLancamento | 'todas')}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting || !temDadosDoTipo}
            title={
              !temDadosDoTipo
                ? `Nenhum${isReceitaAtivo ? 'a receita' : ' lançamento'} para exportar`
                : `Exportar ${isReceitaAtivo ? 'receitas' : 'custos'} em PDF (todos os anos)`
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={handleNew}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-brand-foreground',
              isReceitaAtivo ? 'bg-emerald-600 hover:bg-emerald-600/90' : 'bg-brand hover:bg-brand/90'
            )}
          >
            <Plus className="h-4 w-4" />
            {novoLabel}
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {filtrados.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum{isReceitaAtivo ? 'a receita' : ' lançamento'}
            {categoriaFiltro !== 'todas'
              ? ` de ${labels[categoriaFiltro as keyof typeof labels] ?? ''}`
              : ''}{' '}
            em {anoFiltro}.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Mês</th>
                <th className="px-3 py-2 text-left font-medium">Categoria</th>
                <th className="px-3 py-2 text-right font-medium">Qtd</th>
                <th className="px-3 py-2 text-right font-medium">Preço un.</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtrados.map((l) => {
                const catLabel = labels[l.categoria as keyof typeof labels] ?? l.categoria;
                return (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 tabular-nums">
                      {MONTH_LABELS_SHORT[l.mes - 1]}/{l.ano}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-foreground">{catLabel}</span>
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
                        'px-3 py-2 text-right font-medium tabular-nums',
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
                        <ConfirmPopover
                          variant="destructive"
                          title={isReceitaAtivo ? 'Excluir receita?' : 'Excluir lançamento?'}
                          description={
                            <>
                              {catLabel} · {MONTH_LABELS_SHORT[l.mes - 1]}/{l.ano} ·{' '}
                              {formatBRL(totalLancamento(l))}
                            </>
                          }
                          confirmLabel="Excluir"
                          onConfirm={() => handleRemove(l.id)}
                        >
                          <button
                            type="button"
                            className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            title={`Excluir ${tipoLabel}`}
                            aria-label={`Excluir ${tipoLabel}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </ConfirmPopover>
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

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string | number;
  options: FilterOption[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  const selected = options.find((o) => o.value === String(value));
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={String(value)} onValueChange={(v) => onChange(v ?? '')}>
        <SelectTrigger className="h-9 w-48 rounded-md border-input bg-background font-medium shadow-none hover:bg-muted/30 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20">
          <SelectValue>
            <span className="truncate">{selected?.label ?? '—'}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} sideOffset={4}>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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
        'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-brand text-brand-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}
