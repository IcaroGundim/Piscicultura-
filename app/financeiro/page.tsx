'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
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
        <Suspense fallback={<ChartSkeleton height={400} />}>
          <FishCountChart />
        </Suspense>
      </ErrorBoundary>

      {/* Tank Detail Table */}
      <ErrorBoundary>
        <Suspense fallback={<div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />}>
          <TankFinancialTable />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
