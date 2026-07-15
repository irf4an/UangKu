import { useState, useEffect, useRef } from 'react'
import Header from './components/layout/Header'
import BottomNav, { TabType } from './components/layout/BottomNav'
import Home from './pages/Home'
import Transactions from './pages/Transactions'
import Debt from './pages/Debt'
import Reports from './pages/Reports'
import Budgeting from './pages/Budgeting'
import PhoneSetup from './pages/PhoneSetup'
import { usePhone } from './hooks/useApi'

const TABS: TabType[] = ['beranda', 'transaksi', 'dompet', 'laporan', 'budgeting']

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('beranda')
  const { hasPhone } = usePhone()
  const [isLoggedIn, setIsLoggedIn] = useState(hasPhone)
  
  // Touch tracking refs for swipe gestures
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    setIsLoggedIn(hasPhone)
  }, [hasPhone])

  const getHeaderTitle = (tab: TabType): string => {
    switch (tab) {
      case 'beranda': return 'Beranda'
      case 'transaksi': return 'Transaksi'
      case 'dompet': return 'Dompet'
      case 'laporan': return 'Laporan'
      case 'budgeting': return 'Budgeting'
    }
  }

  const activeIndex = TABS.indexOf(activeTab)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const diffX = e.changedTouches[0].clientX - touchStartX.current
    const diffY = e.changedTouches[0].clientY - touchStartY.current

    // Reset touch coordinates
    touchStartX.current = null
    touchStartY.current = null

    // Thresholds: horizontal swipe must be significant (> 60px)
    // and vertical movement must be minimal (< 50px) to avoid conflict with vertical scrolling
    if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
      if (diffX < 0) {
        // Swipe Left -> next page
        if (activeIndex < TABS.length - 1) {
          setActiveTab(TABS[activeIndex + 1])
        }
      } else {
        // Swipe Right -> previous page
        if (activeIndex > 0) {
          setActiveTab(TABS[activeIndex - 1])
        }
      }
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto flex h-full max-w-[480px] flex-col border-x border-border bg-bg">
        <PhoneSetup onLogin={() => setIsLoggedIn(true)} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col border-x border-border bg-bg shadow-lg overflow-hidden">
      <Header
        title={getHeaderTitle(activeTab)}
      />
      {/* Container wrapper for touch tracking */}
      <div 
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Horizontal sliding viewport */}
        <div 
          className="h-full flex w-[500%] transition-transform duration-300 ease-[var(--ease-drawer)]"
          style={{ transform: `translateX(-${activeIndex * 20}%)` }}
        >
          {/* Each page occupies 20% of the 500% container width */}
          {/* We set touch-action: pan-y on each page container to allow native vertical scrolling */}
          <div className="w-1/5 h-full overflow-y-auto pb-24 pt-2" style={{ touchAction: 'pan-y' }}>
            <Home onNavigate={setActiveTab} />
          </div>
          <div className="w-1/5 h-full overflow-y-auto pb-24 pt-2" style={{ touchAction: 'pan-y' }}>
            <Transactions />
          </div>
          <div className="w-1/5 h-full overflow-y-auto pb-24 pt-2" style={{ touchAction: 'pan-y' }}>
            <Debt />
          </div>
          <div className="w-1/5 h-full overflow-y-auto pb-24 pt-2" style={{ touchAction: 'pan-y' }}>
            <Reports />
          </div>
          <div className="w-1/5 h-full overflow-y-auto pb-24 pt-2" style={{ touchAction: 'pan-y' }}>
            <Budgeting />
          </div>
        </div>
      </div>
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  )
}
