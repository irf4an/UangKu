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
