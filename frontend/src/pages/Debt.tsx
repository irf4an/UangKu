import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDebts, useAccounts } from '../hooks/useApi';
import { formatIDR, getPhone } from '../api/client';
import { Plus, Wallet, CreditCard, X, TrendingDown, TrendingUp, ChevronDown, ChevronUp, History, Eye, EyeOff } from 'lucide-react';
import { useBalanceHidden } from '../hooks/useBalanceHidden';

export default function Debt() {
  const { debts, loading: debtLoading, refresh: refreshDebts } = useDebts();
  const { accounts, totalBalance, loading: accLoading, refresh: refreshAccounts } = useAccounts();
  const { hidden, toggle: toggleHidden } = useBalanceHidden();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loading = debtLoading || accLoading;

  const debtList = debts.filter(d => d.type === 'debt' && d.status === 'active');
  const receivableList = debts.filter(d => d.type === 'receivable' && d.status === 'active');
  const totalDebt = debtList.reduce((sum, d) => sum + (d.remaining_amount || d.total_amount), 0);
  const totalReceivable = receivableList.reduce((sum, d) => sum + (d.remaining_amount || d.total_amount), 0);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = getPhone();
    if (!phone || !newAccName || !newAccBalance) return;
    
    setAdding(true);
    try {
      await fetch(`http://119.28.110.163:3000/api/accounts?phone=${encodeURIComponent(phone)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAccName, balance: parseInt(newAccBalance.replace(/\D/g, '')) || 0 })
      });
      setNewAccName('');
      setNewAccBalance('');
      setShowAddAccount(false);
      refreshAccounts();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = getPhone();
    if (!phone || !selectedDebt || !payAmount) return;
    
    setAdding(true);
    try {
      await fetch(`http://119.28.110.163:3000/api/debts/pay?phone=${encodeURIComponent(phone)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debt_id: selectedDebt.id, amount: parseInt(payAmount.replace(/\D/g, '')) || 0 })
      });
      setPayAmount('');
      setSelectedDebt(null);
      setShowPayModal(false);
      refreshDebts();
      refreshAccounts();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-2xl bg-stone-200" />
      <div className="h-28 rounded-2xl bg-stone-200" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Total Saldo Section */}
      <section className="rounded-2xl bg-accent p-4 text-white shadow-float">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100/80 leading-none flex items-center gap-1">
            <Wallet className="h-3 w-3" /> Total Saldo
          </p>
          <button
            onClick={toggleHidden}
            className="p-1 -mr-1 rounded-lg hover:bg-white/10 active:scale-95 transition-transform"
          >
            {hidden ? <EyeOff className="h-4 w-4 text-white/70" /> : <Eye className="h-4 w-4 text-white/70" />}
          </button>
        </div>
        <p className="mt-2 font-display text-2xl font-bold tracking-tight">
          {hidden ? 'Rp ••••••••' : formatIDR(totalBalance)}
        </p>
        <div className="mt-3 border-t border-emerald-700/50 pt-2 flex items-center justify-between text-xs text-emerald-100">
          <span>{accounts.length} Rekening Aktif</span>
          <button 
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-1 bg-emerald-700/60 hover:bg-emerald-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </div>
      </section>

      {/* Debt Summary */}
      {(totalDebt > 0 || totalReceivable > 0) && (
        <section className="grid grid-cols-2 gap-3">
          {totalDebt > 0 && (
            <div className="rounded-2xl border border-expense/20 bg-expense/5 p-4">
              <div className="flex items-center gap-2 text-expense">
                <TrendingDown className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Total Hutang</span>
              </div>
              <p className="mt-1 font-display text-lg font-bold text-expense">{hidden ? '••••••' : formatIDR(totalDebt)}</p>
              <p className="text-[11px] text-text-muted">{debtList.length} aktif</p>
            </div>
          )}
          {totalReceivable > 0 && (
            <div className="rounded-2xl border border-income/20 bg-income/5 p-4">
              <div className="flex items-center gap-2 text-income">
                <TrendingUp className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Total Piutang</span>
              </div>
              <p className="mt-1 font-display text-lg font-bold text-income">{hidden ? '••••••' : formatIDR(totalReceivable)}</p>
              <p className="text-[11px] text-text-muted">{receivableList.length} aktif</p>
            </div>
          )}
        </section>
      )}

      {/* Add Account Modal */}
      {showAddAccount && createPortal(
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center modal-backdrop" onClick={() => setShowAddAccount(false)}>
          <div className="bg-surface w-full max-w-[480px] rounded-t-2xl p-5 shadow-float modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-text">Tambah Rekening Baru</h3>
              <button onClick={() => setShowAddAccount(false)} className="p-1.5 rounded-lg hover:bg-stone-100">
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>
            <form onSubmit={handleAddAccount} className="space-y-3">
              <input
                type="text"
                placeholder="Nama rekening (contoh: BCA, Mandiri, OVO)"
                value={newAccName}
                onChange={e => setNewAccName(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
                required
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Saldo awal (contoh: 1000000)"
                value={newAccBalance}
                onChange={e => setNewAccBalance(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
                required
              />
              <button
                type="submit"
                disabled={adding || !newAccName || !newAccBalance}
                className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {adding ? 'Menambahkan...' : 'Simpan Rekening'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Pay Debt Modal */}
      {showPayModal && selectedDebt && createPortal(
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center modal-backdrop" onClick={() => setShowPayModal(false)}>
          <div className="bg-surface w-full max-w-[480px] rounded-t-2xl p-5 shadow-float modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-text">Bayar Cicilan</h3>
              <button onClick={() => setShowPayModal(false)} className="p-1.5 rounded-lg hover:bg-stone-100">
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>
            <div className="mb-4 rounded-xl bg-stone-50 p-3">
              <p className="text-sm font-medium text-text">{selectedDebt.name}</p>
              <p className="text-xs text-text-muted mt-1">
                Sisa: {formatIDR(selectedDebt.remaining_amount || selectedDebt.total_amount)}
              </p>
              {selectedDebt.due_day > 0 && (
                <p className="text-xs text-text-muted">Jatuh tempo: tgl {selectedDebt.due_day}</p>
              )}
            </div>
            <form onSubmit={handlePayDebt} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Jumlah pembayaran"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
                required
              />
              <button
                type="submit"
                disabled={adding || !payAmount}
                className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {adding ? 'Mencatat...' : 'Catat Pembayaran'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Accounts List */}
      {accounts.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Daftar Rekening
          </h3>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-2">
            {accounts.map(acc => (
              <div key={acc.id} className="stagger-item flex items-center justify-between py-2 border-b border-border/50 last:border-0 last:pb-0 last:mb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm text-text capitalize">{acc.name}</span>
                </div>
                <span className="font-display font-semibold text-sm text-text">{hidden ? '••••••' : formatIDR(acc.balance)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {accounts.length === 0 && !showAddAccount && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-text-muted">Belum ada rekening. Tambah rekening baru atau catat lewat WhatsApp.</p>
        </div>
      )}

      {/* Hutang (Debts) Section */}
      {debtList.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Hutang & Cicilan
          </h3>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-3">
            {debtList.map(debt => {
              const paidPercent = debt.total_paid && debt.total_amount > 0
                ? Math.round((debt.total_paid / debt.total_amount) * 100)
                : 0;
              const isExpanded = expandedId === debt.id;
              
              return (
                <div key={debt.id} className="space-y-2 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : debt.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-text capitalize">{debt.name}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
                    </div>
                    <span className="font-display font-semibold text-sm text-expense">
                      {formatIDR(debt.remaining_amount || debt.total_amount)}
                    </span>
                  </div>
                  {debt.tenor > 1 && (
                    <>
                      <div className="h-2 w-full rounded-full bg-stone-200">
                        <div 
                          className="h-full rounded-full bg-expense" 
                          style={{ width: `${paidPercent}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-text-muted font-medium">
                        <span>Cicilan: {formatIDR(debt.installment_amount)}/bln</span>
                        {debt.due_day > 0 && <span>Jatuh tempo: tgl {debt.due_day}</span>}
                      </div>
                    </>
                  )}

                  {/* Expandable History Area */}
                  {isExpanded && (
                    <div className="mt-2 bg-stone-50 rounded-xl p-3 border border-stone-100 text-xs text-text space-y-2">
                      <p className="font-semibold text-text-secondary flex items-center gap-1">
                        <History className="h-3.5 w-3.5" /> Riwayat Cicilan / Pembayaran:
                      </p>
                      {debt.payments && debt.payments.length > 0 ? (
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                          {debt.payments.map((p: any) => (
                            <div key={p.id} className="flex justify-between border-b border-stone-200/50 pb-1 last:border-0 last:pb-0">
                              <span className="text-text-muted">{p.date}</span>
                              <span className="font-semibold text-expense">-{formatIDR(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-text-muted italic">Belum ada riwayat pembayaran.</p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => { setSelectedDebt(debt); setShowPayModal(true); }}
                    className="w-full mt-1 rounded-lg border border-accent/30 bg-accent/5 py-2 text-xs font-semibold text-accent hover:bg-accent/10 transition-colors"
                  >
                    Bayar Cicilan
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Piutang (Receivables) Section */}
      {receivableList.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Piutang
          </h3>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-2">
            {receivableList.map(recv => {
              const isExpanded = expandedId === recv.id;
              return (
                <div key={recv.id} className="py-2 border-b border-border/50 last:border-0 last:pb-0 space-y-2">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : recv.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-income/10 text-income">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-text capitalize">{recv.name}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
                        </div>
                        <p className="text-[11px] text-text-muted">
                          {recv.total_paid ? `Dibayar: ${formatIDR(recv.total_paid)}` : 'Belum ada pembayaran'}
                        </p>
                      </div>
                    </div>
                    <span className="font-display font-semibold text-sm text-income">
                      {formatIDR(recv.remaining_amount || recv.total_amount)}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="ml-12 bg-stone-50 rounded-xl p-3 border border-stone-100 text-xs text-text space-y-2">
                      <p className="font-semibold text-text-secondary flex items-center gap-1">
                        <History className="h-3.5 w-3.5" /> Riwayat Penerimaan:
                      </p>
                      {recv.payments && recv.payments.length > 0 ? (
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                          {recv.payments.map((p: any) => (
                            <div key={p.id} className="flex justify-between border-b border-stone-200/50 pb-1 last:border-0 last:pb-0">
                              <span className="text-text-muted">{p.date}</span>
                              <span className="font-semibold text-income">+{formatIDR(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-text-muted italic">Belum ada riwayat penerimaan.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {debts.length === 0 && accounts.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-text-muted">Belum ada data. Kirim chat ke WhatsApp untuk mulai mencatat!</p>
          <div className="mt-3 text-xs text-text-muted space-y-1">
            <p><code>hutang baru Kredivo 12jt 1.2jt 10x tgl 5</code></p>
            <p><code>utang Andi 500rb</code></p>
            <p><code>piutang Budi 300rb</code></p>
          </div>
        </div>
      )}
    </div>
  );
}
