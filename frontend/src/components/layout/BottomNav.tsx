import { Home, ClipboardList, Wallet, BarChart3, Settings } from 'lucide-react'

export type TabType = 'beranda' | 'transaksi' | 'dompet' | 'laporan' | 'budgeting';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'transaksi', label: 'Transaksi', icon: ClipboardList },
    { id: 'dompet', label: 'Dompet', icon: Wallet },
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
