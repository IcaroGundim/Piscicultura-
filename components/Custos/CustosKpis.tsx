import { formatBRLCompact } from '@/lib/format';
import KpiCard from './KpiCard';

interface CustosKpisProps {
  custoTotal: number;
  custoPorKg: number;
  receita: number;
  lucro: number;
  margemLucro: string;
  periodFactor: number;
  periodLabel: string;
  producaoDisplay: number;
  precoVenda: number;
}

export default function CustosKpis({
  custoTotal,
  custoPorKg,
  receita,
  lucro,
  margemLucro,
  periodFactor,
  periodLabel,
  producaoDisplay,
  precoVenda,
}: CustosKpisProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <KpiCard
        label={`Custo Total${periodLabel}`}
        value={formatBRLCompact(custoTotal * periodFactor)}
        sublabel="Ração + Mão de Obra + Outros"
        tone="negative"
      />
      <KpiCard
        label="R$ por kg"
        value={`R$ ${custoPorKg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`}
        sublabel={`${producaoDisplay.toLocaleString('pt-BR')} kg${periodLabel}`}
      />
      <KpiCard
        label={`Receita${periodLabel}`}
        value={formatBRLCompact(receita)}
        sublabel={`${precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/kg`}
        tone="positive"
      />
      <KpiCard
        label={`Lucro${periodLabel}`}
        value={formatBRLCompact(lucro * periodFactor)}
        sublabel="Receita − Custos"
        tone={lucro >= 0 ? 'positive' : 'negative'}
      />
      <KpiCard
        label="Margem"
        value={`${margemLucro}%`}
        sublabel="Lucro / Receita"
        tone={lucro >= 0 ? 'positive' : 'negative'}
      />
    </div>
  );
}
