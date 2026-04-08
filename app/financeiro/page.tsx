'use client';

import FinancialKPIs from '@/components/Financeiro/FinancialKPIs';
import FeedCostChart from '@/components/Financeiro/FeedCostChart';
import RevenueDistribution from '@/components/Financeiro/RevenueDistribution';
import FishCountChart from '@/components/Financeiro/FishCountChart';
import TankFinancialTable from '@/components/Financeiro/TankFinancialTable';

export default function FinanceiroPage() {
  return (
    <div className="min-w-0 px-4 py-6 lg:px-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Charts Column (Left) */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2 h-full">
            <FeedCostChart />
            <RevenueDistribution />
          </div>
        </div>

        {/* KPIs Column (Right) */}
        <div className="lg:w-96 xl:w-[420px] shrink-0">
          <FinancialKPIs />
        </div>
      </div>

      {/* Fish Count Chart */}
      <FishCountChart />

      {/* Tank Detail Table */}
      <TankFinancialTable />
    </div>
  );
}
