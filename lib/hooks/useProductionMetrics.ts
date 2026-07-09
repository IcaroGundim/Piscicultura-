import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import {
  custoMaoObraAnual,
  custoRacaoAnual,
  outrasDespesasAnuais,
  receitaTotalAnual,
} from '@/lib/lancamentos';

const KG_PER_SAC = 25;

export function useProductionMetrics() {
  const bercarioLotes = useStore((s) => s.activeBercarioLotes);
  const recriaLotes = useStore((s) => s.activeRecriaLotes);
  const engordaLotes = useStore((s) => s.activeEngordaLotes);
  const premissas = useStore((s) => s.activePremissas);
  const custos = useStore((s) => s.activeCustos);
  const tanks = useStore((s) => s.activeTanks);

  return useMemo(() => {
    const allLotes = [...bercarioLotes, ...recriaLotes, ...engordaLotes];

    const totalFish = allLotes.reduce((s, l) => s + l.qtd_peixes, 0);
    const totalBiomass = allLotes.reduce((s, l) => s + l.peso_total_kg, 0);
    const totalFeedMonthly = allLotes.reduce((s, l) => s + l.racao_mes_sc, 0);
    const totalFeedTotal = allLotes.reduce((s, l) => s + l.racao_total_sc, 0);

    const totalPesoEngorda = engordaLotes.reduce((s, l) => s + l.peso_total_kg, 0);
    const receitaEstimada = totalPesoEngorda * premissas.preco_venda * premissas.ciclos_ano;

    const countByPhase = (phase: 'bercario' | 'recria' | 'engorda' | 'vazio') =>
      tanks.filter((t) => t.phase === phase).length;

    const activeTanks = countByPhase('bercario') + countByPhase('recria') + countByPhase('engorda');

    const receita = receitaTotalAnual(custos.lancamentos);
    const custoRacao = custoRacaoAnual(custos.lancamentos);
    const custoMaoObra = custoMaoObraAnual(custos.lancamentos);
    const outrasDespesas = outrasDespesasAnuais(custos.lancamentos);
    const custoTotal = custoRacao + custoMaoObra + outrasDespesas;
    const lucro = receita - custoTotal;
    const margemLucro = receita > 0 ? ((lucro / receita) * 100).toFixed(2) : '0';

    const custoPorKg = premissas.producao_anual > 0
      ? custoTotal / premissas.producao_anual
      : 0;

    const pct = (part: number) => (custoTotal > 0 ? (part / custoTotal) * 100 : 0);
    const percentRacao = pct(custoRacao);
    const percentMaoObra = pct(custoMaoObra);
    const percentOutras = pct(outrasDespesas);

    const biomassaPorFase = {
      bercario: bercarioLotes.reduce((s, l) => s + l.peso_total_kg, 0),
      recria: recriaLotes.reduce((s, l) => s + l.peso_total_kg, 0),
      engorda: engordaLotes.reduce((s, l) => s + l.peso_total_kg, 0),
    };

    const racaoKgPorFase = {
      bercario: bercarioLotes.reduce((s, l) => s + l.racao_total_sc, 0) * KG_PER_SAC,
      recria: recriaLotes.reduce((s, l) => s + l.racao_total_sc, 0) * KG_PER_SAC,
      engorda: engordaLotes.reduce((s, l) => s + l.racao_total_sc, 0) * KG_PER_SAC,
    };

    return {
      totalFish,
      totalBiomass,
      totalFeedMonthly,
      totalFeedTotal,
      totalPesoEngorda,
      receitaEstimada,
      countByPhase,
      activeTanks,
      tanksCount: tanks.length,
      receita,
      custoRacao,
      custoMaoObra,
      outrasDespesas,
      custoTotal,
      custoPorKg,
      percentRacao,
      percentMaoObra,
      percentOutras,
      biomassaPorFase,
      racaoKgPorFase,
      lucro,
      margemLucro,
      isProfitable: lucro >= 0,
      premissas,
    };
  }, [bercarioLotes, recriaLotes, engordaLotes, premissas, custos, tanks]);
}
