'use client';

import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { CORRECOES_ENDPOINT, type CorrecaoSaldo } from '@/lib/correcoesHistory';
import { History, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

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

export default function AdjustmentsHistory() {
  const activeLocation = useStore((s) => s.activeLocation);
  const [correcoes, setCorrecoes] = useState<CorrecaoSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(CORRECOES_ENDPOINT, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { correcoes?: CorrecaoSaldo[] };
      setCorrecoes(Array.isArray(data.correcoes) ? data.correcoes : []);
      setErro(false);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    // Recarrega ao voltar o foco à aba (correções são feitas em outra tela).
    const onFocus = () => carregar();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [carregar]);

  const events = correcoes.filter((c) => c.location === activeLocation);
  const total = events.length;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card/90 p-4 shadow-sm shadow-blue-950/5 backdrop-blur-sm sm:p-5">
      {/* Header */}
      <div className="mb-4 min-w-0">
        <h3 className="text-sm font-bold text-slate-800">Histórico de correções</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {loading
            ? 'Carregando…'
            : erro
              ? 'Não foi possível carregar o histórico'
              : total > 0
                ? `${total} ${total === 1 ? 'correção de saldo registrada' : 'correções de saldo registradas'}`
                : 'Nenhuma correção de saldo registrada'}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <History className="mb-3 h-10 w-10 animate-pulse text-slate-200" />
          <p className="text-sm text-slate-400">Carregando histórico…</p>
        </div>
      ) : total > 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-2">
            {events.map((ev) => {
              const isEntrada = ev.direcao === 'entrada';
              const delta = ev.saldoDepois - ev.saldoAntes;
              const periodo = `${MONTH_LABELS[ev.mes - 1] ?? '—'} ${ev.ano}`;
              return (
                <div
                  key={ev.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ' +
                        (isEntrada
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600')
                      }
                    >
                      {isEntrada ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <p className="text-sm font-semibold text-slate-800">
                          Tanque {ev.tankId.toString().padStart(2, '0')}
                        </p>
                        <span className="rounded-md bg-brand px-1.5 py-0.5 text-[11px] font-bold text-brand-foreground shadow-sm">
                          {periodo}
                        </span>
                      </div>
                      <p
                        className={
                          'text-xs font-medium tabular-nums ' +
                          (isEntrada ? 'text-emerald-600' : 'text-rose-600')
                        }
                      >
                        {delta > 0 ? '+' : '−'}
                        {Math.abs(delta).toLocaleString('pt-BR')} un
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 text-sm tabular-nums text-slate-500">
                    <span>{ev.saldoAntes.toLocaleString('pt-BR')}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                    <span className="font-bold text-slate-800">
                      {ev.saldoDepois.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <History className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">
            {erro ? 'Erro ao carregar o histórico' : 'Nenhuma correção de saldo ainda'}
          </p>
          <p className="mt-1 max-w-[260px] text-xs text-slate-400">
            {erro
              ? 'Verifique a conexão com o banco de dados e tente novamente.'
              : 'Ao editar o saldo de um tanque pelo lápis ao lado do total, a alteração aparece aqui.'}
          </p>
        </div>
      )}
    </div>
  );
}
