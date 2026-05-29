function ChartSkeleton({ className = 'h-[280px]' }: { className?: string }) {
  return <div className={`rounded-2xl bg-slate-100 animate-pulse ${className}`} />;
}

export default function FinanceiroLoading() {
  return (
    <div className="min-w-0 px-4 py-6 lg:px-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2 h-full">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
        <div className="lg:w-96 xl:w-[420px] shrink-0">
          <ChartSkeleton className="h-[500px]" />
        </div>
      </div>
      <ChartSkeleton className="h-[400px]" />
      <ChartSkeleton className="h-40" />
    </div>
  );
}
