'use client';

import { useStore } from '@/lib/store';

export default function FinancialKPIs() {
  const { tanks, bercarioLotes, recriaLotes, engordaLotes, premissas, custos } = useStore();

  const totalFish = [...bercarioLotes, ...recriaLotes, ...engordaLotes].reduce((s, l) => s + l.qtd_peixes, 0);
  const totalBiomass = [...bercarioLotes, ...recriaLotes, ...engordaLotes].reduce((s, l) => s + l.peso_total_kg, 0);
  const totalFeedMonthly = [...bercarioLotes, ...recriaLotes, ...engordaLotes].reduce((s, l) => s + l.racao_mes_sc, 0);

  const receita = custos.receita_venda;
  const custoRacao = custos.custo_racao;
  const outrasDespesas = custos.outras_despesas;
  const lucro = receita - custoRacao - outrasDespesas;
  const margemLucro = receita > 0 ? ((lucro / receita) * 100).toFixed(2) : '0';

  const activeTanks = tanks.filter(t => t.phase !== 'vazio').length;

  const isProfitable = lucro >= 0;

  return (
    <div className="h-full rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col shadow-slate-200/50">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight" style={{ fontFamily: 'var(--font-syne)' }}>
          Resumo Financeiro
        </h2>
      </div>

      {/* Main Content */}
      <div className="p-6 flex flex-col gap-4 flex-1 justify-between bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50/50 via-white to-white">

        {/* Revenue Block */}
        <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/30 rounded-xl p-5 border border-emerald-100/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Receita Anual</span>
            </div>
            <span className="text-xl font-bold text-emerald-700" style={{ fontFamily: 'var(--font-syne)' }}>
              R$ {receita.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Costs Block */}
        <div className="bg-gradient-to-br from-rose-50/60 to-orange-50/30 rounded-xl p-5 border border-rose-100/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Custos Totais</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-rose-700" style={{ fontFamily: 'var(--font-syne)' }}>
                R$ {(custoRacao + outrasDespesas).toLocaleString('pt-BR')}
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] text-rose-500/80">Ração: R$ {custoRacao.toLocaleString('pt-BR')}</span>
                <span className="text-[11px] text-slate-400">•</span>
                <span className="text-[11px] text-slate-400">Outros: R$ {outrasDespesas.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit & Margin Row */}
        <div className="grid grid-cols-1 gap-4">
          <div className={`rounded-xl p-4 border ${isProfitable ? 'bg-gradient-to-br from-teal-50/60 to-cyan-50/30 border-teal-100/60' : 'bg-gradient-to-br from-orange-50/60 to-amber-50/30 border-orange-100/60'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isProfitable ? 'text-teal-700' : 'text-orange-700'}`}>
                  Lucro Líquido
                </span>
                <div className="text-xs text-slate-500 mt-0.5">
                  {margemLucro}% margem
                </div>
              </div>
              <span className={`text-2xl font-bold ${isProfitable ? 'text-teal-700' : 'text-orange-700'}`} style={{ fontFamily: 'var(--font-syne)' }}>
                R$ {lucro.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Profit Margin Bar */}
        <div className="mt-2 px-1">
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-slate-500">Composição do Resultado</span>
          </div>
          <div className="h-8 rounded-lg bg-slate-100 overflow-hidden flex shadow-inner group cursor-pointer">
            {lucro >= 0 ? (
              <>
                <div
                  className="h-full bg-rose-500 flex items-center justify-center transition-all duration-300 group-hover:brightness-110 relative"
                  style={{ width: `${((custoRacao + outrasDespesas) / receita) * 100}%` }}
                  title={`Custos: R$ ${(custoRacao + outrasDespesas).toLocaleString('pt-BR')} (${((custoRacao + outrasDespesas) / receita * 100).toFixed(2)}%)`}
                >
                  <span className="text-[10px] font-bold text-white">{((custoRacao + outrasDespesas) / receita * 100).toFixed(2)}%</span>
                </div>
                <div
                  className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-300 group-hover:brightness-110 relative"
                  style={{ width: `${(lucro / receita) * 100}%` }}
                  title={`Lucro: R$ ${lucro.toLocaleString('pt-BR')} (${((lucro / receita) * 100).toFixed(2)}%)`}
                >
                  <span className="text-[10px] font-bold text-white">{((lucro / receita) * 100).toFixed(2)}%</span>
                </div>
              </>
            ) : (
              <>
                <div
                  className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-300 group-hover:brightness-110 relative"
                  style={{ width: `${(receita / (receita - lucro)) * 100}%` }}
                  title={`Receita: R$ ${receita.toLocaleString('pt-BR')} (${((receita / (receita - lucro)) * 100).toFixed(2)}%)`}
                >
                  <span className="text-[10px] font-bold text-white">{((receita / (receita - lucro)) * 100).toFixed(2)}%</span>
                </div>
                <div
                  className="h-full bg-rose-600 flex items-center justify-center transition-all duration-300 group-hover:brightness-110 relative"
                  style={{ width: `${((-lucro) / (receita - lucro)) * 100}%` }}
                  title={`Prejuízo: R$ ${(-lucro).toLocaleString('pt-BR')} (${((-lucro) / (receita - lucro) * 100).toFixed(2)}%)`}
                >
                  <span className="text-[10px] font-bold text-white">{((-lucro) / (receita - lucro) * 100).toFixed(2)}%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 pt-3">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>
              {totalFish.toLocaleString('pt-BR')}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Peixes</div>
          </div>
          <div className="text-center border-x border-slate-100">
            <div className="text-xl font-bold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>
              {totalBiomass.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Biomassa</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>
              {activeTanks}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Tanques</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-5 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] text-slate-500">{premissas.ciclos_ano} ciclos/ano</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <span className="text-[10px] text-slate-500">{totalFeedMonthly.toFixed(1)} sc/mês</span>
          </div>
        </div>
      </div>
    </div>
  );
}
