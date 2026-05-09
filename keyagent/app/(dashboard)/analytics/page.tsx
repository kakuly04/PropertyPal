import { analytics } from "@/lib/mock-data";

export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
        <p className="mt-1 text-sm text-zinc-500">Operational performance across maintenance, approvals, OCR, conversations, leases, and invoices.</p>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {analytics.map((item) => (
          <div key={item.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="text-sm font-medium text-zinc-600">{item.label}</div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{item.value}</div>
            <div className="mt-1 text-sm text-zinc-500">{item.delta}</div>
          </div>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Chart title="OCR confidence distribution" values={[100, 98, 96, 91, 88, 74, 62]} />
        <Chart title="Lease expiry pipeline" values={[4, 3, 2, 2, 1]} />
      </section>
    </div>
  );
}

function Chart({ title, values }: { title: string; values: number[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-6 flex h-48 items-end gap-3">
        {values.map((value, index) => (
          <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-t-md bg-zinc-900" style={{ height: `${Math.max(value, 18)}%` }} />
            <span className="text-xs text-zinc-500">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
