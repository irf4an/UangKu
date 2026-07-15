import React from 'react'

interface TransactionItemProps {
  id: number;
  title: string;
  amount: number;
  type: 'masuk' | 'keluar';
  category: string;
  dateText: string;
  timeText: string;
  icon: React.ReactNode;
  colorClass: string;
  onTap?: (tx: { id: number; title: string; amount: number; type: 'masuk' | 'keluar'; category: string; dateText: string }) => void;
}

export default function TransactionItem({ id, title, amount, type, category, dateText, timeText, icon, colorClass, onTap }: TransactionItemProps) {
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  const isExpense = type === 'keluar';

  return (
    <div 
      onClick={() => onTap?.({ id, title, amount, type, category, dateText })}
      className="flex items-center justify-between py-3.5 border-b border-stone-100 last:border-0 hover:bg-stone-50/50 active:bg-stone-100/60 transition-colors cursor-pointer select-none"
    >
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
