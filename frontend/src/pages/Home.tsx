import { useTransactions, useSummary, useAccounts } from '../hooks/useApi';
import { getCategoryUi } from '../data/categoryHelper';
import { formatIDR, deleteTransaction, getCurrentMonth } from '../api/client';
import { useBalanceHidden } from '../hooks/useBalanceHidden';
import TransactionItem from '../components/shared/TransactionItem';
import CategoryBar from '../components/shared/CategoryBar';
import { TrendingUp, TrendingDown, ArrowRight, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface SelectedTx {
  id: number;
  title: string;
  amount: number;
  type: 'masuk' | 'keluar';
  category: string;
  dateText: string;
}

export default function Home({ onNavigate }: { onNavigate?: (tab: 'beranda' | 'transaksi' | 'dompet' | 'laporan' | 'budgeting') => void }) {
  const { data: transactions, loading: txLoading, refresh: refreshTx } = useTransactions(getCurrentMonth());
  const { data: summary, loading: sumLoading, refresh: refreshSummary } = useSummary(getCurrentMonth());
  const { totalBalance, loading: accLoading, refresh: refreshAccounts } = useAccounts();
  const { hidden, toggle: toggleHidden } = useBalanceHidden();
  const [selectedTx, setSelectedTx] = useState<SelectedTx | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loading = txLoading || sumLoading || accLoading;

  const recentTransactions = transactions.slice(0, 5);
  const categories = summary?.categories || [];
  const totalExpense = summary?.keluar || 0;
  const totalIncome = summary?.masuk || 0;

  const handleDelete = async () => {
    if (!selectedTx) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(selectedTx.id);
      setSelectedTx(null);
      // Refresh all data hooks
      refreshTx();
      refreshSummary();
      refreshAccounts();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Gagal menghapus transaksi');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-40 rounded-3xl bg-stone-200" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 rounded-2xl bg-stone-200" />
          <div className="h-20 rounded-2xl bg-stone-200" />
          <div className="h-20 rounded-2xl bg-stone-200" />
        </div>
        <div className="h-64 rounded-3xl bg-stone-200" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="h-24 w-24 bg-accent-soft text-accent rounded-full flex items-center justify-center mb-6 shadow-sm">
          <TrendingUp className="h-10 w-10" />
        </div>
        <h3 className="font-display text-xl font-bold text-text">Belum ada aktivitas</h3>
        <p className="mt-3 text-[15px] text-text-muted max-w-[260px] leading-relaxed">
          Kirim pesan ke bot WhatsApp untuk mencatat transaksi pertamamu.
        </p>
        <div className="mt-6 p-4 bg-surface border border-stone-200 rounded-2xl shadow-sm text-left w-full max-w-sm">
          <p className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Contoh Format:</p>
          <code className="block rounded-xl bg-stone-50 px-3 py-2.5 text-[13px] text-text font-mono border border-stone-100">
            keluar 50rb makan siang
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Hero Balance Card */}
      <section className="px-4 pt-2 hero-card">
        <div className="relative rounded-3xl bg-gradient-to-br from-accent to-[#00B4D8] p-6 text-white shadow-float overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-emerald-50/90 tracking-wide">Total Saldo (Semua Rekening)</p>
              <button
                onClick={toggleHidden}
                className="p-1.5 -mr-1.5 -mt-1 rounded-lg hover:bg-white/10 active:scale-95 transition-transform"
                title={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'}
              >
                {hidden ? <EyeOff className="h-4 w-4 text-white/70" /> : <Eye className="h-4 w-4 text-white/70" />}
              </button>
            </div>
            <p className="mt-1 font-display text-4xl font-bold tracking-tight">
              {hidden ? 'Rp ••••••••' : formatIDR(totalBalance)}
            </p>
            
            <div className="mt-6 flex items-center gap-4 border-t border-white/20 pt-4">
              <div className="flex-1">
                <p className="text-[11px] text-emerald-50/80 font-medium mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Pemasukan
                </p>
                <p className="font-sans font-semibold text-[15px]">{hidden ? '••••••' : formatIDR(totalIncome)}</p>
              </div>
              <div className="w-[1px] h-8 bg-white/20" />
              <div className="flex-1">
                <p className="text-[11px] text-emerald-50/80 font-medium mb-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Pengeluaran
                </p>
                <p className="font-sans font-semibold text-[15px]">{hidden ? '••••••' : formatIDR(totalExpense)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="px-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display text-[15px] font-bold text-text">Pengeluaran Bulan Ini</h3>
          </div>
          <div className="rounded-3xl border border-stone-100 bg-surface p-5 shadow-card">
            <div className="space-y-1">
              {categories.slice(0, 4).map((cat) => {
                const ui = getCategoryUi(cat.category);
                const pct = totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0;
                return (
                  <CategoryBar
                    key={cat.category}
                    categoryName={cat.category}
                    amount={cat.total}
                    percentage={pct}
                    colorClass={ui.colorClass}
                    icon={ui.icon}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recent Transactions */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display text-[15px] font-bold text-text">Transaksi Terakhir</h3>
          <button 
            onClick={() => onNavigate && onNavigate('transaksi')}
            className="text-[13px] font-medium text-accent flex items-center gap-1 cursor-pointer px-3 py-2 -mr-3"
          >
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="rounded-3xl border border-stone-100 bg-surface px-4 py-2 shadow-card">
          {recentTransactions.map((tx) => {
            const ui = getCategoryUi(tx.category);
            return (
              <div key={tx.id} className="stagger-item">
                <TransactionItem
                  id={tx.id}
                  title={tx.title}
                  amount={tx.amount}
                  type={tx.type}
                  category={tx.category}
                  dateText={tx.date}
                  timeText={tx.time}
                  icon={ui.icon}
                  colorClass={ui.bgClass}
                  onTap={setSelectedTx}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Delete Transaction Bottom Sheet — rendered via portal to escape sliding viewport stacking context */}
      {selectedTx && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center modal-backdrop"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-surface w-full max-w-[480px] rounded-t-[28px] p-6 shadow-float modal-sheet"
            onClick={e => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="mx-auto w-12 h-1.5 rounded-full bg-stone-200 mb-5" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-text">Detail Transaksi</h3>
              <button onClick={() => setSelectedTx(null)} className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors">
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>

            {/* Transaction Detail */}
            <div className="mb-6 rounded-2xl bg-stone-50 p-4 border border-stone-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Judul</span>
                <span className="text-sm font-semibold text-text capitalize">{selectedTx.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Nominal</span>
                <span className={`text-sm font-bold ${selectedTx.type === 'keluar' ? 'text-expense' : 'text-income'}`}>
                  {selectedTx.type === 'keluar' ? '-' : '+'}{formatIDR(selectedTx.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Kategori</span>
                <span className="text-sm font-medium text-text capitalize">{selectedTx.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Tanggal</span>
                <span className="text-sm font-medium text-text">{selectedTx.dateText}</span>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Menghapus...' : 'Hapus Transaksi'}
            </button>
            <button
              onClick={() => setSelectedTx(null)}
              className="w-full mt-2 rounded-xl border border-stone-200 bg-white py-3 text-sm font-medium text-text-muted hover:bg-stone-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
