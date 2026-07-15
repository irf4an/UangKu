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
