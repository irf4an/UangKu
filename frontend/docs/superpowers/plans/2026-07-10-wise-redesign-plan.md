# UangKu Wise-style Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the UangKu PWA UI into a clean, modern, Wise-inspired design language with custom progress bars, gradient cards, and a new layout structure for the Home screen.

**Architecture:** We will modify the global design tokens (`tokens.css`, `tailwind.config.ts`) to match the new color palette. Then we will refactor shared components (`TransactionItem`, `CategoryBar`) to remove bulky borders and adopt a cleaner look. Finally, we will overhaul the `Home` page to include a new Hero Balance card and Quick Stats row, integrating real account data.

**Tech Stack:** React, Tailwind CSS, Vite.

## Global Constraints

- Must run `npm run build` after changes to verify build stability before completing the task.
- Must ensure components have adequate touch targets (min `h-11 w-11` or using generous padding).
- Must use standard Tailwind classes (no fractional extensions unless configured).

---

### Task 1: Update Design Tokens & Tailwind Config

**Files:**
- Modify: `/home/ubuntu/wafin-pwa/src/styles/tokens.css`
- Modify: `/home/ubuntu/wafin-pwa/tailwind.config.ts`

**Interfaces:**
- Produces: CSS variables `--emerald-500` through `--emerald-700` pointing to `#00D68F` base, and `--color-primary` semantic token.

- [ ] **Step 1: Replace tokens in CSS**

Update `/home/ubuntu/wafin-pwa/src/styles/tokens.css` with the new color hexes and semantic names.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Primitives */
  --emerald-50:   #E6FAFC;
  --emerald-100:  #B5F4E2;
  --emerald-500:  #00D68F;
  --emerald-600:  #00B4D8;
  --emerald-700:  #0096C7;

  --stone-50:     #F8FAFC;
  --stone-100:    #F1F5F9;
  --stone-200:    #E2E8F0;
  --stone-300:    #CBD5E1;
  --stone-500:    #64748B;
  --stone-700:    #334155;
  --stone-900:    #1A1A2E;

  --red-50:       #FFF1F2;
  --red-500:      #FF6B6B;
  --red-600:      #FA5252;

  --amber-50:     #FFFBEB;
  --amber-500:    #F59E0B;

  /* Semantic Tokens */
  --color-bg:         var(--stone-50);
  --color-surface:    #FFFFFF;
  --color-card:       #FFFFFF;
  --color-border:     var(--stone-200);
  --color-border-strong: var(--stone-300);

  --color-text:       var(--stone-900);
  --color-text-secondary: var(--stone-700);
  --color-text-muted: var(--stone-500);

  --color-accent:     var(--emerald-500);
  --color-accent-hover: var(--emerald-600);
  --color-accent-soft: var(--emerald-50);

  --color-income:     var(--emerald-500);
  --color-expense:    var(--red-500);
  --color-expense-soft: var(--red-50);
  --color-warning:    var(--amber-500);
  --color-warning-soft: var(--amber-50);

  /* Elevation / Shadow */
  --shadow-card:  0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01);
  --shadow-float: 0 8px 30px rgba(0,214,143,0.12);
}
```

- [ ] **Step 2: Update Tailwind HTML Theme Color**

Update `/home/ubuntu/wafin-pwa/index.html` line 10 to match new primary color:
```html
<meta name="theme-color" content="#00D68F" />
```

- [ ] **Step 3: Run Build**

Run: `cd /home/ubuntu/wafin-pwa && npm run build`
Expected: Passes.

---

### Task 2: Redesign Bottom Navigation & Shared Components

**Files:**
- Modify: `/home/ubuntu/wafin-pwa/src/components/layout/BottomNav.tsx`
- Modify: `/home/ubuntu/wafin-pwa/src/components/shared/TransactionItem.tsx`
- Modify: `/home/ubuntu/wafin-pwa/src/components/shared/CategoryBar.tsx`

- [ ] **Step 1: Update BottomNav.tsx**

```tsx
import { Home, ClipboardList, Wallet, BarChart3, Settings } from 'lucide-react'

export type TabType = 'beranda' | 'transaksi' | 'hutang' | 'laporan' | 'budgeting';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'transaksi', label: 'Transaksi', icon: ClipboardList },
    { id: 'hutang', label: 'Hutang', icon: Wallet },
    { id: 'laporan', label: 'Laporan', icon: BarChart3 },
    { id: 'budgeting', label: 'Budget', icon: Settings },
  ] as const;

  return (
    <nav className="sticky bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur-md px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-[68px] items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="flex flex-col items-center justify-center min-w-[64px] min-h-[44px] h-full transition-all"
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-accent-soft text-accent' : 'text-text-muted'}`}>
                <Icon className={`h-6 w-6 ${isActive ? 'fill-accent/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium leading-none mt-1 transition-colors ${isActive ? 'text-accent font-bold' : 'text-text-muted'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Update TransactionItem.tsx**

```tsx
import React from 'react'

interface TransactionItemProps {
  title: string;
  amount: number;
  type: 'masuk' | 'keluar';
  category: string;
  dateText: string;
  timeText: string;
  icon: React.ReactNode;
  colorClass: string;
}

export default function TransactionItem({ title, amount, type, category, dateText, timeText, icon, colorClass }: TransactionItemProps) {
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  const isExpense = type === 'keluar';

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors">
      <div className="flex items-center gap-3.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm ${colorClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h4 className="truncate text-[15px] font-medium text-text capitalize tracking-tight">{title}</h4>
          <p className="text-[13px] text-text-muted capitalize mt-0.5">
            {category} · {timeText}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className={`font-sans text-[15px] font-semibold tabular-nums tracking-tight ${isExpense ? 'text-text' : 'text-income'}`}>
          {isExpense ? '' : '+'}{formattedAmount.replace('Rp', 'Rp ')}
        </span>
        <p className="text-[11px] text-text-muted text-right mt-1">{dateText}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update CategoryBar.tsx**

```tsx
interface CategoryBarProps {
  categoryName: string;
  amount: number;
  percentage: number;
  colorClass: string;
  icon: React.ReactNode;
}

export default function CategoryBar({ categoryName, amount, percentage, colorClass, icon }: CategoryBarProps) {
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full shadow-sm ${colorClass} text-xs`}>
            {icon}
          </span>
          <span className="text-[14px] font-medium text-text capitalize">{categoryName}</span>
        </div>
        <div className="text-right">
          <span className="font-sans font-semibold text-[14px] text-text tabular-nums">{formattedAmount}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-stone-100 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass.replace('bg-', 'bg-opacity-100 bg-').split(' ')[0]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-[12px] font-medium text-text-muted w-8 text-right tabular-nums">{percentage}%</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run Build**

Run: `cd /home/ubuntu/wafin-pwa && npm run build`
Expected: Passes.

---

### Task 3: Overhaul Home.tsx Layout

**Files:**
- Modify: `/home/ubuntu/wafin-pwa/src/pages/Home.tsx`

**Interfaces:**
- Consumes: `useAccounts()` to show total balance in the Hero card.

- [ ] **Step 1: Rewrite Home.tsx**

```tsx
import { useTransactions, useSummary, useAccounts } from '../hooks/useApi';
import { getCategoryUi } from '../data/categoryHelper';
import TransactionItem from '../components/shared/TransactionItem';
import CategoryBar from '../components/shared/CategoryBar';
import { formatIDR, getCurrentMonth } from '../api/client';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

export default function Home() {
  const { data: transactions, loading: txLoading } = useTransactions(getCurrentMonth());
  const { data: summary, loading: sumLoading } = useSummary(getCurrentMonth());
  const { totalBalance, loading: accLoading } = useAccounts();

  const loading = txLoading || sumLoading || accLoading;

  const recentTransactions = transactions.slice(0, 5);
  const categories = summary?.categories || [];
  const totalExpense = summary?.keluar || 0;
  const totalIncome = summary?.masuk || 0;

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
      <section className="px-4 pt-2">
        <div className="relative rounded-3xl bg-gradient-to-br from-accent to-[#00B4D8] p-6 text-white shadow-float overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
          
          <div className="relative z-10">
            <p className="text-[13px] font-medium text-emerald-50/90 tracking-wide">Total Saldo (Semua Rekening)</p>
            <p className="mt-1 font-display text-4xl font-bold tracking-tight">
              {formatIDR(totalBalance)}
            </p>
            
            <div className="mt-6 flex items-center gap-4 border-t border-white/20 pt-4">
              <div className="flex-1">
                <p className="text-[11px] text-emerald-50/80 font-medium mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Pemasukan
                </p>
                <p className="font-sans font-semibold text-[15px]">{formatIDR(totalIncome)}</p>
              </div>
              <div className="w-[1px] h-8 bg-white/20" />
              <div className="flex-1">
                <p className="text-[11px] text-emerald-50/80 font-medium mb-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Pengeluaran
                </p>
                <p className="font-sans font-semibold text-[15px]">{formatIDR(totalExpense)}</p>
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
                    colorClass={ui.bgClass}
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
          <span className="text-[13px] font-medium text-accent flex items-center gap-1 cursor-pointer">
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="rounded-3xl border border-stone-100 bg-surface px-4 py-2 shadow-card">
          {recentTransactions.map((tx) => {
            const ui = getCategoryUi(tx.category);
            return (
              <TransactionItem
                key={tx.id}
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
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Run Build**

Run: `cd /home/ubuntu/wafin-pwa && npm run build`
Expected: Passes.

---

### Task 4: Global Styling Adjustments & Verification

**Files:**
- Modify: `/home/ubuntu/wafin-pwa/src/components/layout/Header.tsx`

- [ ] **Step 1: Simplify Header.tsx UI**

Change the header to match the new clean look without heavy borders.

```tsx
import { useState, useEffect } from 'react'
import { getPhone } from '../../api/client'

interface HeaderProps {
  title: string;
  onAddClick?: () => void;
}

export default function Header({ title, onAddClick }: HeaderProps) {
  const [workspace, setWorkspace] = useState('My Wallet');
  const phone = getPhone();

  useEffect(() => {
    if (!phone) return;
    fetch(`http://119.28.110.163:3000/api/transactions?phone=${phone}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data.user?.workspace) setWorkspace(data.user.workspace);
      })
      .catch(() => {});
  }, [phone]);

  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthStr = `${months[wib.getMonth()]} ${wib.getFullYear()}`;

  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between bg-bg/80 px-5 backdrop-blur-md">
      <div className="flex flex-col justify-center">
        <h1 className="font-display text-[19px] font-bold tracking-tight text-text leading-tight">{title}</h1>
        <p className="text-[11px] font-medium text-text-muted mt-0.5 uppercase tracking-wider">{monthStr}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-9 items-center justify-center rounded-full bg-surface px-4 shadow-sm border border-stone-200/50">
          <span className="text-[13px] font-semibold text-text">{workspace}</span>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Remove old App.tsx hardcoded padding logic**

In `App.tsx`, we need to make sure the main container layout removes padding overrides that conflict with the new page layouts (since pages now manage their own horizontal paddings like `px-4`).

Wait, the `Home.tsx` code I provided already has `px-4` sections. Let's look at `App.tsx` padding.
Modify `/home/ubuntu/wafin-pwa/src/App.tsx`:
Change `<main className="flex-1 overflow-y-auto p-4 pb-20">` to `<main className="flex-1 overflow-y-auto pb-24">` so children handle horizontal padding themselves.

```tsx
// Inside App.tsx return block, replace <main> wrapper
// We will use sed to patch it efficiently
```

Wait, it's safer to just provide the replacement file snippet or a sed command.

```bash
sed -i 's/<main className="flex-1 overflow-y-auto p-4 pb-20">/<main className="flex-1 overflow-y-auto pb-24 pt-2">/g' /home/ubuntu/wafin-pwa/src/App.tsx
```

- [ ] **Step 3: Run Final Build**

Run: `cd /home/ubuntu/wafin-pwa && npm run build`
Expected: Passes cleanly.

- [ ] **Step 4: Commit all changes**

```bash
git add src/styles/tokens.css tailwind.config.ts index.html src/components/layout/BottomNav.tsx src/components/shared/TransactionItem.tsx src/components/shared/CategoryBar.tsx src/pages/Home.tsx src/components/layout/Header.tsx src/App.tsx
git commit -m "feat(ui): implement wise-inspired dashboard redesign"
```
