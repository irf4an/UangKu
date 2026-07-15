# Wafin PWA Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun antarmuka PWA mobile-first untuk pencatat keuangan yang menyerupai Wafin.id dengan 5 tab navigasi utama (Beranda, Transaksi, Hutang, Laporan, Budgeting) menggunakan React, TypeScript, dan TailwindCSS.

**Architecture:** Single Page Application (SPA) berbasis React dengan state local/mock data yang terstruktur. Routing ditangani menggunakan state internal (tab-based) untuk menjamin load dan transisi instan di mobile. Styling menggunakan TailwindCSS yang dikonfigurasikan dengan custom tokens CSS (OKLCH).

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS, Lucide React (Icons), Recharts (Charts).

## Global Constraints
- Target platform adalah Mobile-First (maksimum lebar layout di-clamp pada 480px di layar desktop, rata tengah).
- Menggunakan CSS Custom Properties untuk tokens (OKLCH color space) di `:root`.
- Semua teks tombol wajib spesifik (misal: "Simpan Transaksi", bukan "Submit").
- Touch targets minimal 44px height/width dengan padding yang sesuai.
- Semua icons menggunakan Lucide React (outline, stroke-width 2, size 24px).
- Tidak menggunakan database eksternal dulu; semua data bertumpu pada static mock data di `src/data/mock.ts`.

---

### Task 1: Project Scaffolding & Design Tokens Setup

**Files:**
- Create: `/home/ubuntu/wafin-pwa/package.json`
- Create: `/home/ubuntu/wafin-pwa/tsconfig.json`
- Create: `/home/ubuntu/wafin-pwa/vite.config.ts`
- Create: `/home/ubuntu/wafin-pwa/tailwind.config.ts`
- Create: `/home/ubuntu/wafin-pwa/index.html`
- Create: `/home/ubuntu/wafin-pwa/src/styles/tokens.css`
- Create: `/home/ubuntu/wafin-pwa/src/main.tsx`
- Create: `/home/ubuntu/wafin-pwa/src/App.tsx`
- Create: `/home/ubuntu/wafin-pwa/src/vite-env.d.ts`

**Interfaces:**
- Produces: CSS custom properties di `tokens.css` dan setup compiler TypeScript/Vite/Tailwind yang siap dijalankan.

- [ ] **Step 1: Tulis package.json dengan dependency yang dibutuhkan**
Write: `/home/ubuntu/wafin-pwa/package.json`
```json
{
  "name": "wafin-pwa-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.395.0",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.13.1",
    "@typescript-eslint/parser": "^7.13.1",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.2.2",
    "vite": "^5.3.1"
  }
}
```

- [ ] **Step 2: Tulis tsconfig.json**
Write: `/home/ubuntu/wafin-pwa/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassPlurals": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```
Create supporting `/home/ubuntu/wafin-pwa/tsconfig.node.json` with standard Vite config reference.

- [ ] **Step 3: Tulis vite.config.ts**
Write: `/home/ubuntu/wafin-pwa/vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
```

- [ ] **Step 4: Tulis tailwind.config.ts**
Write: `/home/ubuntu/wafin-pwa/tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        text: 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-soft': 'var(--color-accent-soft)',
        income: 'var(--color-income)',
        expense: 'var(--color-expense)',
        'expense-soft': 'var(--color-expense-soft)',
        warning: 'var(--color-warning)',
        'warning-soft': 'var(--color-warning-soft)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        'xl': '12px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
      }
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 5: Tulis index.html dengan import google fonts (Sora dan Inter)**
Write: `/home/ubuntu/wafin-pwa/index.html`
```html
<!doctype html>
<html lang="id" class="h-full bg-stone-100">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Wafin — Catat Keuangan</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="h-full overflow-hidden text-stone-900 antialiased">
    <div id="root" class="h-full"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Tulis src/styles/tokens.css**
Write: `/home/ubuntu/wafin-pwa/src/styles/tokens.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* === Primitives === */
  --emerald-50:   oklch(97% 0.02 160);
  --emerald-100:  oklch(93% 0.04 160);
  --emerald-500:  oklch(55% 0.18 160);
  --emerald-600:  oklch(50% 0.16 160);
  --emerald-700:  oklch(42% 0.14 165);
  --emerald-800:  oklch(35% 0.11 165);

  --stone-50:     oklch(98% 0.005 80);
  --stone-100:    oklch(96% 0.008 80);
  --stone-200:    oklch(92% 0.01 75);
  --stone-300:    oklch(85% 0.012 70);
  --stone-500:    oklch(60% 0.01 60);
  --stone-700:    oklch(40% 0.01 55);
  --stone-900:    oklch(22% 0.008 50);

  --red-50:       oklch(97% 0.02 25);
  --red-500:      oklch(55% 0.22 25);
  --red-600:      oklch(50% 0.20 25);

  --amber-50:     oklch(97% 0.03 85);
  --amber-500:    oklch(75% 0.18 80);

  /* === Semantic Tokens === */
  --color-bg:         var(--stone-100);
  --color-surface:    #FFFFFF;
  --color-card:       #FFFFFF;
  --color-border:     var(--stone-200);
  --color-border-strong: var(--stone-300);

  --color-text:       var(--stone-900);
  --color-text-secondary: var(--stone-700);
  --color-text-muted: var(--stone-500);

  --color-accent:     var(--emerald-600);
  --color-accent-hover: var(--emerald-700);
  --color-accent-soft: var(--emerald-50);

  --color-income:     var(--emerald-500);
  --color-expense:    var(--red-500);
  --color-expense-soft: var(--red-50);
  --color-warning:    var(--amber-500);
  --color-warning-soft: var(--amber-50);

  /* === Elevation / Shadow === */
  --shadow-card:  0 1px 3px oklch(0% 0 0 / 0.06), 0 1px 2px oklch(0% 0 0 / 0.04);
  --shadow-float: 0 4px 12px oklch(0% 0 0 / 0.08), 0 1px 3px oklch(0% 0 0 / 0.06);
}
```

- [ ] **Step 7: Tulis boilerplate src/main.tsx, src/App.tsx, dan src/vite-env.d.ts**
Write: `/home/ubuntu/wafin-pwa/src/main.tsx`
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/tokens.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```
Write: `/home/ubuntu/wafin-pwa/src/App.tsx`
```typescript
export default function App() {
  return (
    <div className="flex h-full items-center justify-center bg-stone-100">
      <h1 className="font-display text-2xl font-bold text-accent">Wafin Project Scaffolding Success</h1>
    </div>
  )
}
```
Write: `/home/ubuntu/wafin-pwa/src/vite-env.d.ts`
```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 8: Run npm install untuk setup boilerplate**
Run: `cd /home/ubuntu/wafin-pwa && npm install`
Expected: Berhasil menginstall dependencies tanpa error.

- [ ] **Step 9: Commit boilerplate**
Run: `cd /home/ubuntu/wafin-pwa && git init && git add . && git commit -m "chore: initial scaffold and styling tokens setup"`
Expected: Initial commit berhasil.

---

### Task 2: Mock Data & Navigation Frame Layout

**Files:**
- Create: `/home/ubuntu/wafin-pwa/src/data/mock.ts`
- Create: `/home/ubuntu/wafin-pwa/src/components/layout/Header.tsx`
- Create: `/home/ubuntu/wafin-pwa/src/components/layout/BottomNav.tsx`
- Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`

- [ ] **Step 1: Tulis static mock data sesuai struktur data PRD**
Write: `/home/ubuntu/wafin-pwa/src/data/mock.ts`
```typescript
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'masuk' | 'keluar';
  category: 'makanan' | 'transportasi' | 'kesehatan' | 'tagihan' | 'hiburan' | 'belanja' | 'pendidikan' | 'lainnya';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

export interface Installment {
  id: string;
  number: number;
  dueDate: string;
  amount: number;
  remainingAmount: number;
  status: 'lunas' | 'belum';
}

export interface BudgetLimit {
  category: string;
  limit: number;
  spent: number;
}

export interface SinkingFund {
  id: string;
  targetName: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
}

export const mockTransactions: Transaction[] = [
  { id: '1', title: 'yakult', amount: 21500, type: 'keluar', category: 'lainnya', date: '2026-07-02', time: '14:30' },
  { id: '2', title: 'jajan minum', amount: 13000, type: 'keluar', category: 'makanan', date: '2026-07-01', time: '16:15' },
  { id: '3', title: 'domain wafin.id', amount: 248049, type: 'keluar', category: 'tagihan', date: '2026-06-30', time: '10:00' },
  { id: '4', title: 'gaji bulanan', amount: 24887000, type: 'masuk', category: 'lainnya', date: '2026-06-25', time: '09:00' },
  { id: '5', title: 'konsultasi gigi', amount: 596000, type: 'keluar', category: 'kesehatan', date: '2026-06-20', time: '11:00' },
  { id: '6', title: 'langganan netflix', amount: 155000, type: 'keluar', category: 'hiburan', date: '2026-06-18', time: '20:00' },
  { id: '7', title: 'tiket kereta mudik', amount: 84000, type: 'keluar', category: 'transportasi', date: '2026-06-15', time: '07:30' }
];

export const mockInstallments: Installment[] = [
  { id: 'i1', number: 1, dueDate: '3 Jul 2026', amount: 0, remainingAmount: 0, status: 'lunas' },
  { id: 'i2', number: 2, dueDate: '12 Jun 2026', amount: 133900, remainingAmount: 133900, status: 'belum' },
  { id: 'i3', number: 3, dueDate: '12 Jul 2026', amount: 133900, remainingAmount: 133900, status: 'belum' },
  { id: 'i4', number: 4, dueDate: '12 Agt 2026', amount: 133900, remainingAmount: 133900, status: 'belum' },
  { id: 'i5', number: 5, dueDate: '12 Sep 2026', amount: 133900, remainingAmount: 133900, status: 'belum' }
];

export const mockBudgetLimits: BudgetLimit[] = [
  { category: 'makanan', limit: 2000000, spent: 284000 },
  { category: 'transportasi', limit: 500000, spent: 84000 },
  { category: 'kesehatan', limit: 1000000, spent: 596000 },
  { category: 'tagihan', limit: 500000, spent: 348049 },
  { category: 'hiburan', limit: 1000000, spent: 155000 },
  { category: 'lainnya', limit: 1000000, spent: 113000 }
];

export const mockSinkingFunds: SinkingFund[] = [
  { id: 'sf1', targetName: 'Liburan Bali', targetAmount: 5000000, savedAmount: 2400000, deadline: 'Desember 2026' },
  { id: 'sf2', targetName: 'Gadget Baru', targetAmount: 3000000, savedAmount: 800000, deadline: 'Maret 2027' }
];
```

- [ ] **Step 2: Tulis Header Component**
Write: `/home/ubuntu/wafin-pwa/src/components/layout/Header.tsx`
```typescript
import { Sparkles, Plus } from 'lucide-react'

interface HeaderProps {
  title: string;
  onAddClick?: () => void;
}

export default function Header({ title, onAddClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div>
          <h1 className="font-display text-base font-semibold text-text">{title}</h1>
          <p className="text-[10px] text-text-muted leading-none">Juni 2026 · Tiga Awan Studio</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onAddClick && (
          <button 
            onClick={onAddClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors"
            aria-label="Tambah Transaksi"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white font-display text-sm font-semibold">
          B
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Tulis BottomNav Component**
Write: `/home/ubuntu/wafin-pwa/src/components/layout/BottomNav.tsx`
```typescript
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
    <nav className="sticky bottom-0 z-40 border-t border-border bg-surface shadow-float px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all"
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-accent-soft text-accent' : 'text-text-muted'}`}>
                <Icon className="h-5.5 w-5.5" />
              </div>
              <span className={`text-[10px] font-medium leading-none mt-1 ${isActive ? 'text-accent font-semibold' : 'text-text-muted'}`}>
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

- [ ] **Step 4: Update App.tsx untuk handle Tab routing frame**
Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`
```typescript
import { useState } from 'react'
import Header from './components/layout/Header'
import BottomNav, { TabType } from './components/layout/BottomNav'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('beranda')

  const getHeaderTitle = (tab: TabType): string => {
    switch(tab) {
      case 'beranda': return 'Beranda';
      case 'transaksi': return 'Transaksi';
      case 'hutang': return 'Hutang';
      case 'laporan': return 'Laporan';
      case 'budgeting': return 'Budgeting';
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col border-x border-border bg-bg shadow-lg">
      <Header 
        title={getHeaderTitle(activeTab)} 
        onAddClick={activeTab !== 'laporan' ? () => alert('Tambah item') : undefined} 
      />
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        <div className="font-sans text-text">
          <p className="text-text-secondary">Konten aktif: Tab {activeTab}</p>
        </div>
      </main>
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  )
}
```

- [ ] **Step 5: Commit frame navigasi**
Run: `cd /home/ubuntu/wafin-pwa && git add . && git commit -m "feat: setup routing frame, header, bottom nav, and static mock data"`
Expected: Commit berhasil.

---

### Task 3: Beranda (Home) Halaman & Shared Kategori-Bar Component

**Files:**
- Create: `/home/ubuntu/wafin-pwa/src/components/shared/CategoryBar.tsx`
- Create: `/home/ubuntu/wafin-pwa/src/components/shared/TransactionItem.tsx`
- Create: `/home/ubuntu/wafin-pwa/src/pages/Home.tsx`
- Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`

- [ ] **Step 1: Tulis CategoryBar Component**
Write: `/home/ubuntu/wafin-pwa/src/components/shared/CategoryBar.tsx`
```typescript
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
    <div className="space-y-1.5 py-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-text-secondary">
          <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${colorClass}-bg text-xs`}>
            {icon}
          </span>
          <span className="font-medium text-text capitalize">{categoryName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-text">{formattedAmount}</span>
          <span className="text-xs text-text-muted">{percentage}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-stone-200">
        <div 
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Tulis TransactionItem Component**
Write: `/home/ubuntu/wafin-pwa/src/components/shared/TransactionItem.tsx`
```typescript
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
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h4 className="truncate text-sm font-medium text-text capitalize">{title}</h4>
          <p className="text-xs text-text-muted capitalize">
            {category} · {dateText} {timeText}
          </p>
        </div>
      </div>
      <span className={`font-display text-sm font-bold ${isExpense ? 'text-expense' : 'text-income'}`}>
        {isExpense ? '-' : '+'}{formattedAmount.replace('Rp', 'Rp ')}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Setup Helper Map Category untuk UI (pastels & Lucide icons)**
Write helper utilities di `/home/ubuntu/wafin-pwa/src/data/categoryHelper.tsx` untuk binding static icons & colors.
Write: `/home/ubuntu/wafin-pwa/src/data/categoryHelper.tsx`
```typescript
import { Utensils, Car, Heart, Receipt, Gamepad2, ShoppingBag, BookOpen, MoreHorizontal } from 'lucide-react'

export interface CategoryUiConfig {
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

export const getCategoryUi = (category: string): CategoryUiConfig => {
  switch (category) {
    case 'makanan':
      return { icon: <Utensils className="h-4.5 w-4.5 text-amber-700" />, colorClass: 'bg-amber-500', bgClass: 'bg-amber-50' };
    case 'transportasi':
      return { icon: <Car className="h-4.5 w-4.5 text-blue-700" />, colorClass: 'bg-blue-500', bgClass: 'bg-blue-50' };
    case 'kesehatan':
      return { icon: <Heart className="h-4.5 w-4.5 text-red-700" />, colorClass: 'bg-red-500', bgClass: 'bg-red-50' };
    case 'tagihan':
      return { icon: <Receipt className="h-4.5 w-4.5 text-purple-700" />, colorClass: 'bg-purple-500', bgClass: 'bg-purple-50' };
    case 'hiburan':
      return { icon: <Gamepad2 className="h-4.5 w-4.5 text-pink-700" />, colorClass: 'bg-pink-500', bgClass: 'bg-pink-50' };
    case 'belanja':
      return { icon: <ShoppingBag className="h-4.5 w-4.5 text-orange-700" />, colorClass: 'bg-orange-500', bgClass: 'bg-orange-50' };
    case 'pendidikan':
      return { icon: <BookOpen className="h-4.5 w-4.5 text-cyan-700" />, colorClass: 'bg-cyan-500', bgClass: 'bg-cyan-50' };
    default:
      return { icon: <MoreHorizontal className="h-4.5 w-4.5 text-stone-700" />, colorClass: 'bg-stone-500', bgClass: 'bg-stone-100' };
  }
}
```

- [ ] **Step 4: Tulis Home Page Component**
Write: `/home/ubuntu/wafin-pwa/src/pages/Home.tsx`
```typescript
import { mockTransactions, mockBudgetLimits } from '../data/mock'
import { getCategoryUi } from '../data/categoryHelper'
import TransactionItem from '../components/shared/TransactionItem'
import CategoryBar from '../components/shared/CategoryBar'

export default function Home() {
  const recentTransactions = mockTransactions.slice(0, 3);
  
  // Calculate total expense
  const totalExpense = mockBudgetLimits.reduce((acc, curr) => acc + curr.spent, 0);
  const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpense);

  return (
    <div className="space-y-6">
      {/* Recent Transactions Section */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Transaksi Terakhir</h3>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
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

      {/* Category Breakdown Card */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Pengeluaran Per Kategori</h3>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider leading-none">Total Keluar</p>
            <p className="font-display text-2xl font-bold text-expense tracking-tight mt-1">{formattedTotal.replace('Rp', 'Rp ')}</p>
          </div>
          <div className="border-t border-border pt-2 space-y-1">
            {mockBudgetLimits.map((b) => {
              const ui = getCategoryUi(b.category);
              const percentage = Math.round((b.spent / totalExpense) * 100) || 0;
              return (
                <CategoryBar
                  key={b.category}
                  categoryName={b.category}
                  amount={b.spent}
                  percentage={percentage}
                  colorClass={ui.colorClass}
                  icon={ui.icon}
                />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Integrasikan Home Page ke routing tab App.tsx**
Modify App.tsx to import and display the `Home` page component when `activeTab === 'beranda'`.
Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`
```typescript
import { useState } from 'react'
import Header from './components/layout/Header'
import BottomNav, { TabType } from './components/layout/BottomNav'
import Home from './pages/Home'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('beranda')

  const getHeaderTitle = (tab: TabType): string => {
    switch(tab) {
      case 'beranda': return 'Beranda';
      case 'transaksi': return 'Transaksi';
      case 'hutang': return 'Hutang';
      case 'laporan': return 'Laporan';
      case 'budgeting': return 'Budgeting';
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col border-x border-border bg-bg shadow-lg">
      <Header 
        title={getHeaderTitle(activeTab)} 
        onAddClick={activeTab !== 'laporan' ? () => alert('Tambah item') : undefined} 
      />
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        {activeTab === 'beranda' ? (
          <Home />
        ) : (
          <div className="font-sans text-text">
            <p className="text-text-secondary">Konten aktif: Tab {activeTab}</p>
          </div>
        )}
      </main>
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  )
}
```

- [ ] **Step 6: Commit Page Beranda**
Run: `cd /home/ubuntu/wafin-pwa && git add . && git commit -m "feat: implement home page with transactions list and category breakdown cards"`
Expected: Commit berhasil.

---

### Task 4: Transaksi (Transactions) Halaman & Shared Metric-Card Component

**Files:**
- Create: `/home/ubuntu/wafin-pwa/src/components/shared/MetricCard.tsx`
- Create: `/home/ubuntu/wafin-pwa/src/pages/Transactions.tsx`
- Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`

- [ ] **Step 1: Tulis MetricCard Component**
Write: `/home/ubuntu/wafin-pwa/src/components/shared/MetricCard.tsx`
```typescript
interface MetricCardProps {
  label: string;
  amount: number;
  percentageText: string;
  barColorClass: string;
  typeColorClass: string;
}

export default function MetricCard({ label, amount, percentageText, barColorClass, typeColorClass }: MetricCardProps) {
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider leading-none">{label}</p>
          <p className={`font-display text-lg font-bold tracking-tight mt-1 ${typeColorClass}`}>
            {formattedAmount.replace('Rp', 'Rp ')}
          </p>
        </div>
        <span className="text-xs text-text-muted font-medium">{percentageText}</span>
      </div>
      <div className="mt-2 h-1 w-full rounded-full bg-stone-200">
        <div className={`h-full rounded-full ${barColorClass}`} style={{ width: '100%' }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Tulis Transactions Page Component dengan log grouped by date**
Write: `/home/ubuntu/wafin-pwa/src/pages/Transactions.tsx`
```typescript
import { mockTransactions } from '../data/mock'
import { getCategoryUi } from '../data/categoryHelper'
import TransactionItem from '../components/shared/TransactionItem'
import MetricCard from '../components/shared/MetricCard'

export default function Transactions() {
  // Sum incoming & outgoing
  const totalIncoming = mockTransactions.filter(tx => tx.type === 'masuk').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutgoing = mockTransactions.filter(tx => tx.type === 'keluar').reduce((acc, curr) => acc + curr.amount, 0);
  const neto = totalIncoming - totalOutgoing;

  // Group by date
  const groupedTransactions: { [date: string]: typeof mockTransactions } = {};
  mockTransactions.forEach(tx => {
    if (!groupedTransactions[tx.date]) {
      groupedTransactions[tx.date] = [];
    }
    groupedTransactions[tx.date].push(tx);
  });

  const dates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Actions Row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary font-medium">{mockTransactions.length} entri</span>
        <div className="flex gap-2">
          <button className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:bg-stone-50">Pilih</button>
          <button className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:bg-stone-50">Export CSV</button>
          <button className="rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover">+ Tambah</button>
        </div>
      </div>

      {/* Financial Summary Card */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Ringkasan Keuangan</h3>
        <div className="rounded-2xl border border-border bg-surface px-4 py-2 shadow-card">
          <MetricCard 
            label="Masuk" 
            amount={totalIncoming} 
            percentageText="▲ 100.0% vs Mei 2026" 
            barColorClass="bg-income" 
            typeColorClass="text-income" 
          />
          <MetricCard 
            label="Keluar" 
            amount={totalOutgoing} 
            percentageText="▲ 100.0% vs Mei 2026" 
            barColorClass="bg-expense" 
            typeColorClass="text-expense" 
          />
          <MetricCard 
            label="Neto" 
            amount={neto} 
            percentageText="▲ 100.0% vs Mei 2026" 
            barColorClass="bg-emerald-600" 
            typeColorClass="text-text" 
          />
        </div>
      </section>

      {/* Transaction Log list */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Riwayat Transaksi</h3>
        <div className="space-y-4">
          {dates.map((date) => (
            <div key={date} className="space-y-1">
              <h4 className="text-xs font-semibold text-text-muted tracking-wider uppercase pl-1">{date}</h4>
              <div className="rounded-2xl border border-border bg-surface px-4 py-2 shadow-card">
                {groupedTransactions[date].map((tx) => {
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
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Integrasikan ke routing tab App.tsx**
Modify App.tsx to display `Transactions` component.
Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`
```typescript
import { useState } from 'react'
import Header from './components/layout/Header'
import BottomNav, { TabType } from './components/layout/BottomNav'
import Home from './pages/Home'
import Transactions from './pages/Transactions'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('beranda')

  const getHeaderTitle = (tab: TabType): string => {
    switch(tab) {
      case 'beranda': return 'Beranda';
      case 'transaksi': return 'Transaksi';
      case 'hutang': return 'Hutang';
      case 'laporan': return 'Laporan';
      case 'budgeting': return 'Budgeting';
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col border-x border-border bg-bg shadow-lg">
      <Header 
        title={getHeaderTitle(activeTab)} 
        onAddClick={activeTab !== 'laporan' ? () => alert('Tambah item') : undefined} 
      />
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        {activeTab === 'beranda' && <Home />}
        {activeTab === 'transaksi' && <Transactions />}
        {activeTab !== 'beranda' && activeTab !== 'transaksi' && (
          <div className="font-sans text-text">
            <p className="text-text-secondary">Konten aktif: Tab {activeTab}</p>
          </div>
        )}
      </main>
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  )
}
```

- [ ] **Step 4: Commit Page Transaksi**
Run: `cd /home/ubuntu/wafin-pwa && git add . && git commit -m "feat: implement transactions log page with financial summary metric card metrics"`
Expected: Commit berhasil.

---

### Task 5: Hutang & Cicilan (Debt Tracker) Halaman

**Files:**
- Create: `/home/ubuntu/wafin-pwa/src/pages/Debt.tsx`
- Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`

- [ ] **Step 1: Tulis Debt Page Component**
Write: `/home/ubuntu/wafin-pwa/src/pages/Debt.tsx`
```typescript
import { mockInstallments } from '../data/mock'

export default function Debt() {
  const activeDebts = mockInstallments.filter(inst => inst.status === 'belum');
  const totalRemaining = activeDebts.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider leading-none">Total Hutang Aktif</p>
        <p className="font-display text-2xl font-bold text-expense tracking-tight mt-1">
          {formatCurrency(totalRemaining).replace('Rp', 'Rp ')}
        </p>
        <p className="text-xs text-text-secondary mt-1">{activeDebts.length} cicilan belum lunas</p>
      </section>

      {/* Installment List */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Jadwal Cicilan</h3>
        <div className="space-y-3">
          {mockInstallments.map((inst) => {
            const isPaid = inst.status === 'lunas';
            return (
              <div 
                key={inst.id} 
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-card"
              >
                <div>
                  <h4 className="font-display font-bold text-text">#{inst.number} · {inst.dueDate}</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Sisa: {formatCurrency(inst.remainingAmount)} 
                    <span className="text-text-muted"> (cicilan {formatCurrency(inst.amount)})</span>
                  </p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  isPaid ? 'bg-income/10 text-income' : 'bg-stone-100 text-text-secondary'
                }`}>
                  {isPaid ? 'Lunas' : 'Belum'}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Integrasikan ke routing tab App.tsx**
Modify App.tsx to display `Debt` component.
Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`
```typescript
import { useState } from 'react'
import Header from './components/layout/Header'
import BottomNav, { TabType } from './components/layout/BottomNav'
import Home from './pages/Home'
import Transactions from './pages/Transactions'
import Debt from './pages/Debt'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('beranda')

  const getHeaderTitle = (tab: TabType): string => {
    switch(tab) {
      case 'beranda': return 'Beranda';
      case 'transaksi': return 'Transaksi';
      case 'hutang': return 'Hutang';
      case 'laporan': return 'Laporan';
      case 'budgeting': return 'Budgeting';
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col border-x border-border bg-bg shadow-lg">
      <Header 
        title={getHeaderTitle(activeTab)} 
        onAddClick={activeTab !== 'laporan' ? () => alert('Tambah item') : undefined} 
      />
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        {activeTab === 'beranda' && <Home />}
        {activeTab === 'transaksi' && <Transactions />}
        {activeTab === 'hutang' && <Debt />}
        {activeTab !== 'beranda' && activeTab !== 'transaksi' && activeTab !== 'hutang' && (
          <div className="font-sans text-text">
            <p className="text-text-secondary">Konten aktif: Tab {activeTab}</p>
          </div>
        )}
      </main>
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  )
}
```

- [ ] **Step 3: Commit Page Hutang**
Run: `cd /home/ubuntu/wafin-pwa && git add . && git commit -m "feat: implement debt and installment schedule tracker page"`
Expected: Commit berhasil.

---

### Task 6: Laporan (Reports) Halaman dengan Chart Line Recharts

**Files:**
- Create: `/home/ubuntu/wafin-pwa/src/pages/Reports.tsx`
- Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`

- [ ] **Step 1: Tulis Laporan Page Component menggunakan Recharts LineChart**
Write: `/home/ubuntu/wafin-pwa/src/pages/Reports.tsx`
```typescript
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { mockTransactions, mockBudgetLimits } from '../data/mock'
import { getCategoryUi } from '../data/categoryHelper'
import CategoryBar from '../components/shared/CategoryBar'

// Daily data aggregation mockup
const chartData = [
  { name: '1 Jun', masuk: 0, keluar: 84000 },
  { name: '7 Jun', masuk: 0, keluar: 155000 },
  { name: '14 Jun', masuk: 0, keluar: 596000 },
  { name: '21 Jun', masuk: 24887000, keluar: 248049 },
  { name: '28 Jun', masuk: 0, keluar: 21500 },
  { name: '2 Jul', masuk: 0, keluar: 13000 }
];

export default function Reports() {
  const totalExpense = mockBudgetLimits.reduce((acc, curr) => acc + curr.spent, 0);
  const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpense);

  return (
    <div className="space-y-6">
      {/* Daily Flow Chart Card */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Arus Harian</h3>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-4">
          <div>
            <h4 className="font-display font-semibold text-text">Juni 2026 · per hari</h4>
          </div>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888" tickLine={false} />
                <YAxis stroke="#888" tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="masuk" name="Masuk" stroke="#10B981" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="keluar" name="Keluar" stroke="#EF4444" strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Category Breakdown Card */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Pengeluaran Per Kategori</h3>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider leading-none">Total Keluar</p>
            <p className="font-display text-2xl font-bold text-expense tracking-tight mt-1">{formattedTotal.replace('Rp', 'Rp ')}</p>
          </div>
          <div className="border-t border-border pt-2 space-y-1">
            {mockBudgetLimits.map((b) => {
              const ui = getCategoryUi(b.category);
              const percentage = Math.round((b.spent / totalExpense) * 100) || 0;
              return (
                <CategoryBar
                  key={b.category}
                  categoryName={b.category}
                  amount={b.spent}
                  percentage={percentage}
                  colorClass={ui.colorClass}
                  icon={ui.icon}
                />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Integrasikan ke routing tab App.tsx**
Modify App.tsx to display `Reports` component.
Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`
```typescript
import { useState } from 'react'
import Header from './components/layout/Header'
import BottomNav, { TabType } from './components/layout/BottomNav'
import Home from './pages/Home'
import Transactions from './pages/Transactions'
import Debt from './pages/Debt'
import Reports from './pages/Reports'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('beranda')

  const getHeaderTitle = (tab: TabType): string => {
    switch(tab) {
      case 'beranda': return 'Beranda';
      case 'transaksi': return 'Transaksi';
      case 'hutang': return 'Hutang';
      case 'laporan': return 'Laporan';
      case 'budgeting': return 'Budgeting';
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col border-x border-border bg-bg shadow-lg">
      <Header 
        title={getHeaderTitle(activeTab)} 
        onAddClick={activeTab !== 'laporan' ? () => alert('Tambah item') : undefined} 
      />
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        {activeTab === 'beranda' && <Home />}
        {activeTab === 'transaksi' && <Transactions />}
        {activeTab === 'hutang' && <Debt />}
        {activeTab === 'laporan' && <Reports />}
        {activeTab !== 'beranda' && activeTab !== 'transaksi' && activeTab !== 'hutang' && activeTab !== 'laporan' && (
          <div className="font-sans text-text">
            <p className="text-text-secondary">Konten aktif: Tab {activeTab}</p>
          </div>
        )}
      </main>
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  )
}
```

- [ ] **Step 3: Commit Page Laporan**
Run: `cd /home/ubuntu/wafin-pwa && git add . && git commit -m "feat: implement daily cash flow chart and full breakdown reports page"`
Expected: Commit berhasil.

---

### Task 7: Budgeting Halaman & Sinking Funds Component

**Files:**
- Create: `/home/ubuntu/wafin-pwa/src/pages/Budgeting.tsx`
- Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`

- [ ] **Step 1: Tulis Budgeting Page Component dengan status warna, daily safe budget, dan sinking funds**
Write: `/home/ubuntu/wafin-pwa/src/pages/Budgeting.tsx`
```typescript
import { mockBudgetLimits, mockSinkingFunds } from '../data/mock'
import { getCategoryUi } from '../data/categoryHelper'

export default function Budgeting() {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }

  // Daily Safe Budget calculation
  const totalLimit = mockBudgetLimits.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpent = mockBudgetLimits.reduce((acc, curr) => acc + curr.spent, 0);
  const remainingBudget = totalLimit - totalSpent;
  const remainingDays = 12; // Static remaining days mock
  const dailySafeBudget = remainingDays > 0 ? Math.max(0, remainingBudget / remainingDays) : 0;

  return (
    <div className="space-y-6">
      {/* Daily Safe Budget Card */}
      <section className="rounded-2xl bg-accent text-white p-4 shadow-float">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100/90 leading-none">💰 Batas aman belanja hari ini</p>
        <p className="font-display text-2xl font-bold tracking-tight mt-1.5">
          {formatCurrency(dailySafeBudget).replace('Rp', 'Rp ')} <span className="text-sm font-normal text-emerald-100">/ hari</span>
        </p>
        <div className="mt-3 border-t border-emerald-700/50 pt-2 flex items-center justify-between text-xs text-emerald-100">
          <span>Sisa {remainingDays} hari lagi</span>
          <span className="font-semibold">Total sisa: {formatCurrency(remainingBudget)}</span>
        </div>
      </section>

      {/* Limit per Kategori */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Limit per Kategori</h3>
        <div className="space-y-3">
          {mockBudgetLimits.map((b) => {
            const ui = getCategoryUi(b.category);
            const ratio = b.spent / b.limit;
            const percentage = Math.min(100, Math.round(ratio * 100));
            
            // Define warning state & bar colors
            let barColor = 'bg-income';
            let warningText = 'Aman';
            let isWarning = false;
            
            if (ratio >= 0.9) {
              barColor = 'bg-expense';
              warningText = `⚠️ Overbudget / Hampir habis (Sisa ${formatCurrency(b.limit - b.spent)})`;
              isWarning = true;
            } else if (ratio >= 0.7) {
              barColor = 'bg-warning';
              warningText = `⚠️ Waspada (Sisa ${formatCurrency(b.limit - b.spent)})`;
              isWarning = true;
            }

            const dailyLimit = Math.max(0, (b.limit - b.spent) / remainingDays);

            return (
              <div key={b.category} className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${ui.bgClass}`}>
                      {ui.icon}
                    </span>
                    <span className="font-medium text-text capitalize">{b.category}</span>
                  </div>
                  <span className="font-display font-semibold text-text">
                    {formatCurrency(b.spent)} <span className="text-xs text-text-muted">/ {formatCurrency(b.limit)}</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-stone-200">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percentage}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted font-medium pt-1 border-t border-border/50">
                  <span className={isWarning ? 'text-expense font-semibold' : 'text-income'}>{warningText}</span>
                  <span>Aman: {formatCurrency(dailyLimit)}/hari</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sinking Funds (Target Tabungan) */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">Target Tabungan (Sinking Funds)</h3>
        <div className="space-y-3">
          {mockSinkingFunds.map((sf) => {
            const percentage = Math.min(100, Math.round((sf.savedAmount / sf.targetAmount) * 100));
            return (
              <div key={sf.id} className="rounded-2xl border border-border bg-surface p-4 shadow-card space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <h4 className="font-display font-bold text-text">🎯 {sf.targetName}</h4>
                  <span className="font-display font-semibold text-accent">{percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-stone-200">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted mt-1">
                  <span>Target: {sf.deadline}</span>
                  <span>{formatCurrency(sf.savedAmount)} / {formatCurrency(sf.targetAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Integrasikan ke routing tab App.tsx**
Modify App.tsx to display `Budgeting` component.
Modify: `/home/ubuntu/wafin-pwa/src/App.tsx`
```typescript
import { useState } from 'react'
import Header from './components/layout/Header'
import BottomNav, { TabType } from './components/layout/BottomNav'
import Home from './pages/Home'
import Transactions from './pages/Transactions'
import Debt from './pages/Debt'
import Reports from './pages/Reports'
import Budgeting from './pages/Budgeting'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('beranda')

  const getHeaderTitle = (tab: TabType): string => {
    switch(tab) {
      case 'beranda': return 'Beranda';
      case 'transaksi': return 'Transaksi';
      case 'hutang': return 'Hutang';
      case 'laporan': return 'Laporan';
      case 'budgeting': return 'Budgeting';
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col border-x border-border bg-bg shadow-lg">
      <Header 
        title={getHeaderTitle(activeTab)} 
        onAddClick={activeTab !== 'laporan' ? () => alert('Tambah item') : undefined} 
      />
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        {activeTab === 'beranda' && <Home />}
        {activeTab === 'transaksi' && <Transactions />}
        {activeTab === 'hutang' && <Debt />}
        {activeTab === 'laporan' && <Reports />}
        {activeTab === 'budgeting' && <Budgeting />}
      </main>
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  )
}
```

- [ ] **Step 3: Commit Page Budgeting**
Run: `cd /home/ubuntu/wafin-pwa && git add . && git commit -m "feat: implement budgeting manager page with daily safe limits and sinking funds"`
Expected: Commit berhasil.

---

### Task 8: Progressive Web App (PWA) Configuration Setup

**Files:**
- Create: `/home/ubuntu/wafin-pwa/public/manifest.json`
- Create: `/home/ubuntu/wafin-pwa/public/sw.js`
- Modify: `/home/ubuntu/wafin-pwa/index.html`
- Modify: `/home/ubuntu/wafin-pwa/vite.config.ts`

- [ ] **Step 1: Tulis manifest.json di folder public**
Write: `/home/ubuntu/wafin-pwa/public/manifest.json`
```json
{
  "name": "Wafin — Catat Keuangan",
  "short_name": "Wafin",
  "description": "Catat keuangan rumah tangga lewat WhatsApp dan Dashboard PWA otomatis",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F5F5F4",
  "theme_color": "#059669",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Tulis Service Worker script sw.js untuk support offline caching**
Write: `/home/ubuntu/wafin-pwa/public/sw.js`
```javascript
const CACHE_NAME = 'wafin-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/styles/tokens.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
```

- [ ] **Step 3: Pasang manifest.json link dan service worker register script di index.html**
Modify: `/home/ubuntu/wafin-pwa/index.html`
```html
<!doctype html>
<html lang="id" class="h-full bg-stone-100">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="theme-color" content="#059669" />
    <title>Wafin — Catat Keuangan</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="h-full overflow-hidden text-stone-900 antialiased">
    <div id="root" class="h-full"></div>
    <script type="module" src="/src/main.tsx"></script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service worker registered!', reg))
            .catch(err => console.log('Service worker registration failed: ', err));
        });
      }
    </script>
  </body>
</html>
```

- [ ] **Step 4: Buat dummy icons untuk validasi PWA (pwa-192x192.png, pwa-512x512.png, favicon.svg)**
Write a helper SVG favicon.svg to `/home/ubuntu/wafin-pwa/public/favicon.svg`.
Write: `/home/ubuntu/wafin-pwa/public/favicon.svg`
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 7v14"/>
  <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>
</svg>
```
Write: `/home/ubuntu/wafin-pwa/public/pwa-192x192.png` and `pwa-512x512.png` (using python script mock or download small pixel size). Let's write simple empty PNG binary via python helper.

- [ ] **Step 5: Write empty PNG icons using python**
Run: `python3 -c "import base64; d = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABl/iY1AAAAA1BMVEUAlmCpe0a1AAAANElEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgDcARAAGe5517AAAAAElFTkSuQmCC'); open('/home/ubuntu/wafin-pwa/public/pwa-192x192.png', 'wb').write(d); open('/home/ubuntu/wafin-pwa/public/pwa-512x512.png', 'wb').write(d)"`
Expected: file icons PNG terbuat sukses.

- [ ] **Step 6: Build project to test Vite build compilation output**
Run: `cd /home/ubuntu/wafin-pwa && npm run build`
Expected: Build sukses, folder `dist/` terbuat dengan index.html dan assets bundles.

- [ ] **Step 7: Commit setup PWA**
Run: `cd /home/ubuntu/wafin-pwa && git add . && git commit -m "feat: configure manifest.json, sw.js service worker, icons, and test build compilation"`
Expected: Commit berhasil.

---

### Task 9: Production Hosting Setup (Caddy Server Integration)

**Files:**
- Modify: `/etc/caddy/Caddyfile`

- [ ] **Step 1: Deploy built frontend dist to public web root**
Run: `sudo mkdir -p /var/www/wafin-pwa && sudo cp -r /home/ubuntu/wafin-pwa/dist/* /var/www/wafin-pwa/`
Expected: Copy sukses.

- [ ] **Step 2: Backup and update Caddyfile to host on port 8077**
Modify `/etc/caddy/Caddyfile` to serve `wafin-pwa` on a specific port or location. Let's make it host on port `:8077` so it doesn't conflict with current default port 80 web root.
Write: `/etc/caddy/Caddyfile` (overwriting or appending block for port 8077). Let's read `/etc/caddy/Caddyfile` and modify it.

- [ ] **Step 3: Read current Caddyfile and write combined version with port 8077**
We know current Caddyfile serves `:80`. Let's append `:8077` block to serve `/var/www/wafin-pwa`.
Write: `/etc/caddy/Caddyfile`
```caddy
# Original :80 site config
:80 {
	root * /usr/share/caddy
	file_server
}

# Wafin PWA site config on port 8077
:8077 {
	root * /var/www/wafin-pwa
	file_server
	try_files {path} /index.html
}
```

- [ ] **Step 4: Reload Caddy server to apply changes**
Run: `sudo systemctl reload caddy`
Expected: Caddy reload sukses.

- [ ] **Step 5: Verify site via local curl**
Run: `curl -I http://localhost:8077`
Expected: HTTP/1.1 200 OK
