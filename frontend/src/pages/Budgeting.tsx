import { useBudgets, useSinkingFunds } from '../hooks/useApi';
import { getCategoryUi } from '../data/categoryHelper';
import { formatIDR } from '../api/client';

import { type ApiSinkingFund } from '../api/client';

export default function Budgeting() {
  const { data: budgetData, loading: budgetLoading } = useBudgets();
  const { funds, loading: fundsLoading } = useSinkingFunds();

  const loading = budgetLoading || fundsLoading;

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="h-28 rounded-2xl bg-stone-200" /><div className="h-48 rounded-2xl bg-stone-200" /></div>;
  }

  const dailySafe = budgetData?.dailySafeBudget || 0;
  const remainingDays = budgetData?.remainingDays || 0;
  const remainingBudget = budgetData?.remainingBudget || 0;
  const budgets = budgetData?.budgets || [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-accent text-white p-4 shadow-float">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100/90 leading-none">💰 Batas aman belanja hari ini</p>
        <p className="font-display text-2xl font-bold tracking-tight mt-1.5">
          {formatIDR(dailySafe)} <span className="text-sm font-normal text-emerald-100">/ hari</span>
        </p>
        <div className="mt-3 border-t border-emerald-700/50 pt-2 flex items-center justify-between text-xs text-emerald-100">
          <span>Sisa {remainingDays} hari lagi</span>
          <span className="font-semibold">Total sisa: {formatIDR(remainingBudget)}</span>
        </div>
      </section>

      {budgets.length > 0 ? (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Limit per Kategori</h3>
          <div className="space-y-3">
            {budgets.map(b => {
              const ui = getCategoryUi(b.category);
              let barColor = 'bg-income';
              if (b.status === 'danger') barColor = 'bg-expense';
              else if (b.status === 'warning') barColor = 'bg-warning';

              return (
                <div key={b.category} className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${ui.bgClass}`}>{ui.icon}</span>
                      <span className="font-medium text-text capitalize">{b.category}</span>
                    </div>
                    <span className="font-display font-semibold text-text">
                      {formatIDR(b.spent)} <span className="text-xs text-text-muted">/ {formatIDR(b.limit)}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-stone-200">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${b.percentage}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted font-medium pt-1 border-t border-border/50">
                    <span className={b.status === 'danger' ? 'text-expense font-semibold' : b.status === 'warning' ? 'text-warning font-semibold' : 'text-income'}>
                      {b.status === 'danger' ? `⚠️ Sisa ${formatIDR(b.remaining)}` : b.status === 'warning' ? `⚠️ Waspada` : '✅ Aman'}
                    </span>
                    <span>Aman: {formatIDR(b.dailyLimit)}/hari</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-text-muted">Budget belum diatur. Atur dari WhatsApp atau dashboard.</p>
        </div>
      )}

      {funds.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Target Tabungan</h3>
          <div className="space-y-3">
            {funds.map((sf: ApiSinkingFund) => {
              const pct = sf.target_amount > 0 ? Math.min(100, Math.round((sf.saved_amount / sf.target_amount) * 100)) : 0;
              return (
                <div key={sf.id} className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <h4 className="font-display font-bold text-text">🎯 {sf.target_name}</h4>
                    <span className="font-display font-semibold text-accent">{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted mt-1">
                    <span>Target: {sf.deadline}</span>
                    <span>{formatIDR(sf.saved_amount)} / {formatIDR(sf.target_amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
