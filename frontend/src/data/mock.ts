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
  { id: '3', title: 'domain uangku.id', amount: 248049, type: 'keluar', category: 'tagihan', date: '2026-06-30', time: '10:00' },
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
