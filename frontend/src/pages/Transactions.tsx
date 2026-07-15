import { useTransactions, useSummary } from '../hooks/useApi';
import { getCategoryUi } from '../data/categoryHelper';
import TransactionItem from '../components/shared/TransactionItem';
import MetricCard from '../components/shared/MetricCard';
import { getCurrentMonth } from '../api/client';

export default function Transactions() {
  const month = getCurrentMonth();
  const { data: transactions, loading: txLoading } = useTransactions(month);
  const { data: summary } = useSummary(month);

  const masuk = summary?.masuk || 0;
  const keluar = summary?.keluar || 0;
  const neto = summary?.neto || 0;

  // Group by date
  const grouped: Record<string, typeof transactions> = {};
  transactions.forEach(tx => {
    if (!grouped[tx.date]) grouped[tx.date] = [];
    grouped[tx.date].push(tx);
  });
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (txLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 rounded-2xl bg-stone-200" />
        <div className="h-64 rounded-2xl bg-stone-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary font-medium">{transactions.length} entri</span>
        <div className="flex gap-2">
          <a
            href={`http://119.28.110.163:3000/api/export/csv?phone=${localStorage.getItem('uangku_phone')}&month=${month}`}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:bg-stone-50 min-h-[44px] flex items-center"
          >
            Export CSV
          </a>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Ringkasan Keuangan</h3>
        <div className="rounded-2xl border border-border bg-surface px-4 py-2 shadow-card">
          <MetricCard
            label="Masuk"
            amount={masuk}
            percentageText={`${transactions.filter(t => t.type === 'masuk').length} transaksi`}
            barColorClass="bg-income"
            typeColorClass="text-income"
          />
          <MetricCard
            label="Keluar"
            amount={keluar}
            percentageText={`${transactions.filter(t => t.type === 'keluar').length} transaksi`}
            barColorClass="bg-expense"
            typeColorClass="text-expense"
          />
          <MetricCard
            label="Neto"
            amount={neto}
            percentageText={neto >= 0 ? 'Surplus' : 'Defisit'}
            barColorClass="bg-emerald-600"
            typeColorClass="text-text"
          />
        </div>
      </section>

      {dates.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Riwayat Transaksi</h3>
          <div className="space-y-4">
            {dates.map(date => (
              <div key={date} className="space-y-1">
                <h4 className="text-xs font-semibold text-text-muted tracking-wider uppercase pl-1">{date}</h4>
                <div className="rounded-2xl border border-border bg-surface px-4 py-2 shadow-card">
                  {grouped[date].map(tx => {
                    const ui = getCategoryUi(tx.category);
                    return (
                      <TransactionItem
                        key={tx.id}
                        id={tx.id}
                        title={tx.title}
                        amount={tx.amount}
                        type={tx.type}
                        category={tx.category}
                        dateText={tx.date}
                        timeText={tx.time}
                        icon={ui.icon}
                        colorClass={ui.bgClass}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
