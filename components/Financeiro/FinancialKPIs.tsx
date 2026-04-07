'use client';

import { useStore } from '@/lib/store';
import { DollarSign, TrendingDown, TrendingUp, Percent, Fish, Package } from 'lucide-react';

export default function FinancialKPIs() {
  const { tanks, bercarioLotes, recriaLotes, engordaLotes, premissas, custos } = useStore();

  const totalFish = [...bercarioLotes, ...recriaLotes, ...engordaLotes].reduce((s, l) => s + l.qtd_peixes, 0);
  const totalBiomass = [...bercarioLotes, ...recriaLotes, ...engordaLotes].reduce((s, l) => s + l.peso_total_kg, 0);
  const totalFeedMonthly = [...bercarioLotes, ...recriaLotes, ...engordaLotes].reduce((s, l) => s + l.racao_mes_sc, 0);

  const receita = custos.receita_venda;
  const custoRacao = custos.custo_racao;
  const outrasDespesas = custos.outras_despesas;
  const lucro = receita - custoRacao - outrasDespesas;
  const margemLucro = receita > 0 ? ((lucro / receita) * 100).toFixed(1) : '0';

  const kpis = [
    {
      icon: DollarSign,
      label: 'Receita Anual',
      value: `R$ ${receita.toLocaleString('pt-BR')}`,
      sub: `${premissas.ciclos_ano} ciclos/ano`,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-500/10',
      border: 'border-emerald-200/50 hover:border-emerald-400',
      gradient: 'from-emerald-50/80 to-emerald-100/30',
    },
    {
      icon: TrendingDown,
      label: 'Custos Totais',
      value: `R$ ${(custoRacao + outrasDespesas).toLocaleString('pt-BR')}`,
      sub: `Ração: R$ ${custoRacao.toLocaleString('pt-BR')}`,
      color: 'text-rose-600',
      iconBg: 'bg-rose-500/10',
      border: 'border-rose-200/50 hover:border-rose-400',
      gradient: 'from-rose-50/80 to-rose-100/30',
    },
    {
      icon: TrendingUp,
      label: 'Lucro Líquido',
      value: `R$ ${lucro.toLocaleString('pt-BR')}`,
      sub: lucro >= 0 ? 'Resultado positivo' : 'Déficit',
      color: lucro >= 0 ? 'text-teal-600' : 'text-orange-600',
      iconBg: lucro >= 0 ? 'bg-teal-500/10' : 'bg-orange-500/10',
      border: lucro >= 0 ? 'border-teal-200/50 hover:border-teal-400' : 'border-orange-200/50 hover:border-orange-400',
      gradient: lucro >= 0 ? 'from-teal-50/80 to-teal-100/30' : 'from-orange-50/80 to-orange-100/30',
    },
    {
      icon: Percent,
      label: 'Margem de Lucro',
      value: `${margemLucro}%`,
      sub: 'Sobre receita total',
      color: parseFloat(margemLucro) >= 20 ? 'text-indigo-600' : 'text-amber-600',
      iconBg: parseFloat(margemLucro) >= 20 ? 'bg-indigo-500/10' : 'bg-amber-500/10',
      border: parseFloat(margemLucro) >= 20 ? 'border-indigo-200/50 hover:border-indigo-400' : 'border-amber-200/50 hover:border-amber-400',
      gradient: parseFloat(margemLucro) >= 20 ? 'from-indigo-50/80 to-indigo-100/30' : 'from-amber-50/80 to-amber-100/30',
    },
    {
      icon: Fish,
      label: 'Total de Peixes',
      value: totalFish.toLocaleString('pt-BR'),
      sub: `${tanks.filter(t => t.phase !== 'vazio').length} tanques ativos`,
      color: 'text-blue-600',
      iconBg: 'bg-blue-500/10',
      border: 'border-blue-200/50 hover:border-blue-400',
      gradient: 'from-blue-50/80 to-blue-100/30',
    },
    {
      icon: Package,
      label: 'Biomassa Total',
      value: `${totalBiomass.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`,
      sub: `Ração/mês: ${totalFeedMonthly.toFixed(1)} sc`,
      color: 'text-violet-600',
      iconBg: 'bg-violet-500/10',
      border: 'border-violet-200/50 hover:border-violet-400',
      gradient: 'from-violet-50/80 to-violet-100/30',
    },
  ];

  return (
    <div className="flex flex-col h-full gap-2">
      {kpis.map(({ icon: Icon, label, value, sub, color, border, gradient, iconBg }) => (
        <div
          key={label}
          className={`group relative overflow-hidden rounded-xl border ${border} bg-gradient-to-br ${gradient} px-3 py-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow backdrop-blur-md bg-white/40 flex-1 flex items-center gap-3`}
        >
          {/* Decorative light */}
          <div className="absolute -left-2 -top-2 h-16 w-16 rounded-full bg-white/50 blur-xl transition-transform duration-500 group-hover:scale-125 pointer-events-none" />
          
          <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg} shadow-inner ring-1 ring-inset ring-black/5`}>
            <Icon className={`w-3.5 h-3.5 ${color}`} />
          </div>
          
          <div className="relative min-w-0 flex flex-col justify-center gap-0.5">
            <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-slate-500/90 truncate leading-tight">{label}</p>
            <h3 className={`text-base md:text-lg font-bold tracking-tight text-slate-800 leading-tight truncate`} style={{ fontFamily: 'var(--font-syne)' }}>
              {value}
            </h3>
            <p className="text-[10px] md:text-[11px] font-medium text-slate-500/80 truncate leading-tight mt-0.5">
              {sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
