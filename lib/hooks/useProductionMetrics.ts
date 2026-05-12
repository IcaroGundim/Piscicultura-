import { useMemo } from 'react';
import { useStore } from '@/lib/store';

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

    const receita = custos.receita_venda;
    const custoRacao = custos.custo_racao;
    const outrasDespesas = custos.outras_despesas;
    const lucro = receita - custoRacao - outrasDespesas;
    const margemLucro = receita > 0 ? ((lucro / receita) * 100).toFixed(2) : '0';

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
      outrasDespesas,
      lucro,
      margemLucro,
      isProfitable: lucro >= 0,
      premissas,
    };
  }, [bercarioLotes, recriaLotes, engordaLotes, premissas, custos, tanks]);
}
