import { useTransactions, useSummary } from '../hooks/useApi';
import { getCategoryUi } from '../data/categoryHelper';
import CategoryBar from '../components/shared/CategoryBar';
import { formatIDR, getCurrentMonth } from '../api/client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function Reports() {
  const month = getCurrentMonth();
  const { data: transactions } = useTransactions(month);
  const { data: summary, loading } = useSummary(month);

  const categories = summary?.categories || [];
  const totalExpense = summary?.keluar || 0;

  // Build daily chart data
  const dailyMap: Record<string, { masuk: number; keluar: number }> = {};
  transactions.forEach(tx => {
    const day = tx.date.slice(8, 10);
    if (!dailyMap[day]) dailyMap[day] = { masuk: 0, keluar: 0 };
    dailyMap[day][tx.type] += tx.amount;
  });
  const chartData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, data]) => ({ name: day, ...data }));

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="h-60 rounded-2xl bg-stone-200" /><div className="h-48 rounded-2xl bg-stone-200" /></div>;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Arus Harian</h3>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
          <h4 className="font-display font-semibold text-text mb-2">{month} · per hari</h4>
          {chartData.length > 0 ? (
            <div className="h-60 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888" tickLine={false} />
                  <YAxis stroke="#888" tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => formatIDR(v)} />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="masuk" name="Masuk" stroke="#10B981" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="keluar" name="Keluar" stroke="#EF4444" strokeWidth={2} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-8">Belum ada data transaksi bulan ini</p>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Pengeluaran Per Kategori</h3>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider leading-none">Total Keluar</p>
              <p className="font-display text-2xl font-bold text-expense tracking-tight mt-1">{formatIDR(totalExpense)}</p>
            </div>
            <div className="border-t border-border pt-2 space-y-1">
              {categories.map(cat => {
                const ui = getCategoryUi(cat.category);
                const pct = totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0;
                return <CategoryBar key={cat.category} categoryName={cat.category} amount={cat.total} percentage={pct} colorClass={ui.colorClass} icon={ui.icon} />;
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
