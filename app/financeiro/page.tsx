'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const FeedCostChart = dynamic(() => import('@/components/Financeiro/FeedCostChart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

const RevenueDistribution = dynamic(() => import('@/components/Financeiro/RevenueDistribution'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

const FishCountChart = dynamic(() => import('@/components/Financeiro/FishCountChart'), {
  ssr: false,
  loading: () => <ChartSkeleton height={400} />,
});

const FinancialKPIs = dynamic(() => import('@/components/Financeiro/FinancialKPIs'), {
  ssr: false,
  loading: () => <ChartSkeleton height={500} />,
});

const TankFinancialTable = dynamic(() => import('@/components/Financeiro/TankFinancialTable'), {
  ssr: false,
  loading: () => <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />,
});

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <div className="w-full rounded-2xl bg-slate-100 animate-pulse" style={{ height }} />;
}

function DeferredSection({
  children,
  fallback,
  rootMargin = '420px',
}: {
  children: ReactNode;
  fallback: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady) return undefined;

    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const node = ref.current;

    const reveal = () => {
      if (!cancelled) {
        setIsReady(true);
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(reveal, { timeout: 1800 });
    } else {
      timeoutId = setTimeout(reveal, 1200);
    }

    if (!node || !('IntersectionObserver' in window)) {
      return () => {
        cancelled = true;
        if (idleId !== null) {
          window.cancelIdleCallback(idleId);
        }
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (idleId !== null) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [isReady, rootMargin]);

  return <div ref={ref}>{isReady ? children : fallback}</div>;
}

export default function FinanceiroPage() {
  return (
    <div className="min-w-0 px-4 py-6 lg:px-6 space-y-6">
      <ErrorBoundary>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Charts Column (Left) */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2 h-full">
              <Suspense fallback={<ChartSkeleton />}>
                <FeedCostChart />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <RevenueDistribution />
              </Suspense>
            </div>
          </div>

          {/* KPIs Column (Right) */}
          <div className="lg:w-96 xl:w-[420px] shrink-0">
            <Suspense fallback={<ChartSkeleton height={500} />}>
              <FinancialKPIs />
            </Suspense>
          </div>
        </div>
      </ErrorBoundary>

      {/* Fish Count Chart */}
      <ErrorBoundary>
        <DeferredSection fallback={<ChartSkeleton height={400} />}>
          <Suspense fallback={<ChartSkeleton height={400} />}>
            <FishCountChart />
          </Suspense>
        </DeferredSection>
      </ErrorBoundary>

      {/* Tank Detail Table */}
      <ErrorBoundary>
        <DeferredSection fallback={<div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />}>
          <Suspense fallback={<div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />}>
            <TankFinancialTable />
          </Suspense>
        </DeferredSection>
      </ErrorBoundary>
    </div>
  );
}
