// Format responses to look exactly like the target design in the image
import { formatRupiah } from './parser.js';

export function formatTransactionResponse(tx, summary = { masuk: 0, keluar: 0 }) {
  const emoji = tx.type === 'masuk' ? '🟢' : '🔴';
  const typeLabel = tx.type === 'masuk' ? 'Masuk' : 'Keluar';
  const sign = tx.type === 'masuk' ? '' : '–';
  const amountStr = `${sign}Rp ${tx.amount.toLocaleString('id-ID')}`;
  const sisa = summary.masuk - summary.keluar;

  return `${emoji} *Oke, ${tx.type === 'masuk' ? 'pemasukan' : 'pengeluaran'} sudah dicatat!*

─────────────────
*Detail transaksi*
${typeLabel}     ${amountStr}
Kategori   ${tx.categoryName || tx.category}
Keterangan ${tx.title}

─────────────────
*Ringkasan hari ini*
─────────────────
Masuk      Rp ${summary.masuk.toLocaleString('id-ID')}
Keluar     Rp ${summary.keluar.toLocaleString('id-ID')}
Sisa       *${sisa < 0 ? '–' : ''}Rp ${Math.abs(sisa).toLocaleString('id-ID')}*

Salah? Ketik *batal* atau *hapus 1*.`;
}

export function formatSummaryResponse(month, summary, categories) {
  let catLines = '';
  if (categories && categories.length > 0) {
    for (const cat of categories) {
      const pct = summary.keluar > 0 ? Math.round((cat.total / summary.keluar) * 100) : 0;
      const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
      catLines += `${cat.category.padEnd(12)} ${formatRupiah(cat.total).padStart(12)}  ${pct}%\n`;
    }
  }

  return `📊 *Ringkasan ${month}*

─────────────────
*Total*
Masuk       ${formatRupiah(summary.masuk)}
Keluar      ${formatRupiah(summary.keluar)}
Selisih     *${formatRupiah(summary.masuk - summary.keluar)}*

${catLines ? `*Per Kategori:*\n${catLines}` : ''}

Lihat semua di dashboard: http://119.28.110.163:8077`;
}

export function formatBudgetResponse(month, budgetData) {
  if (!budgetData || !budgetData.budgets || budgetData.budgets.length === 0) {
    return `💰 *Budget ${month}*

Belum ada budget yang diatur.

Contoh input:
• budget makan 300rb/bulan
• budget transport 200rb/bulan`;
  }

  const { dailySafeBudget, remainingDays, remainingBudget, budgets } = budgetData;

  let budgetLines = '';
  for (const b of budgets) {
    const pct = b.percentage;
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    const status = b.status === 'danger' ? '⚠️ Waspada' : b.status === 'warning' ? '⚠️ Hati-hati' : '✅ Aman';
    budgetLines += `\n*${b.category}*\n${bar} ${pct}%\n${formatRupiah(b.spent)} / ${formatRupiah(b.limit)}  ${status}\nDaily: ${formatRupiah(b.dailyLimit)}/hari\n`;
  }

  return `💰 *Budget ${month}*

─────────────────
*Batas aman hari ini*
${formatRupiah(dailySafeBudget)}/hari
Sisa ${remainingDays} hari | Total sisa: ${formatRupiah(remainingBudget)}
${budgetLines}`;
}

// Get Indonesian date string helper
function getIndonesianDateStr(date) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export function formatDailyReport(transactions) {
  let masuk = 0, keluar = 0;
  let countMasuk = 0, countKeluar = 0;
  const expenses = [];
  const categoryTotals = {};

  for (const tx of transactions) {
    if (tx.type === 'masuk') {
      masuk += tx.amount;
      countMasuk++;
    } else if (tx.type === 'keluar') {
      keluar += tx.amount;
      countKeluar++;
      expenses.push(tx);
      
      const cat = tx.category || 'lainnya';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
    }
  }

  // Indonesian Date
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const dateStr = getIndonesianDateStr(wib);

  // Category breakdown string
  let categoryLines = '';
  if (keluar > 0) {
    const catMap = {
      makanan: 'Makanan & Minuman',
      transportasi: 'Transportasi',
      kesehatan: 'Kesehatan',
      tagihan: 'Tagihan & Utilitas',
      hiburan: 'Hiburan',
      belanja: 'Belanja',
      pendidikan: 'Pendidikan',
      lainnya: 'Lainnya'
    };
    
    Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, amt]) => {
        const pct = Math.round((amt / keluar) * 100);
        const name = catMap[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
        categoryLines += `▪ ${name}: ${formatRupiah(amt)} (${pct}%)\n`;
      });
  }

  // Top expenses sorted
  expenses.sort((a, b) => b.amount - a.amount);
  let topLines = '';
  expenses.slice(0, 5).forEach((t, idx) => {
    topLines += `▪ ${idx + 1}. ${formatRupiah(t.amount)} · ${t.title || t.category}\n`;
  });

  const sisa = masuk - keluar;
  let insight = '';
  if (sisa < 0) {
    insight = `Hati-hati ya — di hari ini pengeluaran lebih besar ${formatRupiah(Math.abs(sisa))} dari pemasukan.`;
  } else if (sisa > 0) {
    insight = `Keren banget! — di hari ini pemasukan lebih besar ${formatRupiah(sisa)} dari pengeluaran.`;
  } else {
    insight = `Seimbang — hari ini pemasukan dan pengeluaran sama besar.`;
  }

  return `*Laporan hari ini*
${dateStr}
─────────────────
Ini rangkuman uang masuk-keluarmu hari ini:
|
*Uang masuk & keluar*
Masuk      ${formatRupiah(masuk)} (${countMasuk} transaksi)
Keluar     ${formatRupiah(keluar)} (${countKeluar} transaksi)
Sisa       ${sisa < 0 ? '–' : ''}${formatRupiah(Math.abs(sisa))}

${categoryLines ? `*Keluar per kategori*\n${categoryLines}` : ''}
${topLines ? `*Terbesar keluar*\n${topLines}` : ''}
${insight}`;
}

export function formatWeeklyReport(transactions, rangeStr) {
  let masuk = 0, keluar = 0;
  let countMasuk = 0, countKeluar = 0;
  const expenses = [];
  const categoryTotals = {};

  for (const tx of transactions) {
    if (tx.type === 'masuk') {
      masuk += tx.amount;
      countMasuk++;
    } else if (tx.type === 'keluar') {
      keluar += tx.amount;
      countKeluar++;
      expenses.push(tx);
      const cat = tx.category || 'lainnya';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
    }
  }

  const catMap = {
    makanan: 'Makanan & Minuman', transportasi: 'Transportasi', kesehatan: 'Kesehatan',
    tagihan: 'Tagihan & Utilitas', hiburan: 'Hiburan', belanja: 'Belanja',
    pendidikan: 'Pendidikan', lainnya: 'Lainnya'
  };

  let categoryLines = '';
  if (keluar > 0) {
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
      const pct = Math.round((amt / keluar) * 100);
      const name = catMap[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
      categoryLines += `▪ ${name}: ${formatRupiah(amt)} (${pct}%)\n`;
    });
  }

  expenses.sort((a, b) => b.amount - a.amount);
  let topLines = '';
  expenses.slice(0, 5).forEach((t, idx) => {
    topLines += `▪ ${idx + 1}. ${formatRupiah(t.amount)} · ${t.title || t.category}\n`;
  });

  const sisa = masuk - keluar;
  let insight = '';
  if (sisa < 0) insight = `Hati-hati ya — pengeluaran minggu ini lebih besar ${formatRupiah(Math.abs(sisa))} dari pemasukan.`;
  else if (sisa > 0) insight = `Keren banget! — pemasukan minggu ini lebih besar ${formatRupiah(sisa)} dari pengeluaran.`;
  else insight = `Seimbang — pemasukan dan pengeluaran minggu ini sama besar.`;

  return `*Laporan minggu ini*
${rangeStr}
─────────────────
Ini rangkuman uang masuk-keluarmu minggu ini:
|
*Uang masuk & keluar*
Masuk      ${formatRupiah(masuk)} (${countMasuk} transaksi)
Keluar     ${formatRupiah(keluar)} (${countKeluar} transaksi)
Sisa       ${sisa < 0 ? '–' : ''}${formatRupiah(Math.abs(sisa))}

${categoryLines ? `*Keluar per kategori*\n${categoryLines}` : ''}
${topLines ? `*Terbesar keluar*\n${topLines}` : ''}
${insight}`;
}

export function formatMonthlyReport(transactions, rangeStr) {
  let masuk = 0, keluar = 0;
  let countMasuk = 0, countKeluar = 0;
  const expenses = [];
  const categoryTotals = {};

  for (const tx of transactions) {
    if (tx.type === 'masuk') {
      masuk += tx.amount;
      countMasuk++;
    } else if (tx.type === 'keluar') {
      keluar += tx.amount;
      countKeluar++;
      expenses.push(tx);
      const cat = tx.category || 'lainnya';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
    }
  }

  const catMap = {
    makanan: 'Makanan & Minuman', transportasi: 'Transportasi', kesehatan: 'Kesehatan',
    tagihan: 'Tagihan & Utilitas', hiburan: 'Hiburan', belanja: 'Belanja',
    pendidikan: 'Pendidikan', lainnya: 'Lainnya'
  };

  let categoryLines = '';
  if (keluar > 0) {
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
      const pct = Math.round((amt / keluar) * 100);
      const name = catMap[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
      categoryLines += `▪ ${name}: ${formatRupiah(amt)} (${pct}%)\n`;
    });
  }

  expenses.sort((a, b) => b.amount - a.amount);
  let topLines = '';
  expenses.slice(0, 5).forEach((t, idx) => {
    topLines += `▪ ${idx + 1}. ${formatRupiah(t.amount)} · ${t.title || t.category}\n`;
  });

  const sisa = masuk - keluar;
  let insight = '';
  if (sisa < 0) insight = `Hati-hati ya — pengeluaran bulan ini lebih besar ${formatRupiah(Math.abs(sisa))} dari pemasukan.`;
  else if (sisa > 0) insight = `Keren banget! — pemasukan bulan ini lebih besar ${formatRupiah(sisa)} dari pengeluaran.`;
  else insight = `Seimbang — pemasukan dan pengeluaran bulan ini sama besar.`;

  return `*Laporan bulan ini*
${rangeStr}
─────────────────
Ini rangkuman uang masuk-keluarmu bulan ini:
|
*Uang masuk & keluar*
Masuk      ${formatRupiah(masuk)} (${countMasuk} transaksi)
Keluar     ${formatRupiah(keluar)} (${countKeluar} transaksi)
Sisa       ${sisa < 0 ? '–' : ''}${formatRupiah(Math.abs(sisa))}

${categoryLines ? `*Keluar per kategori*\n${categoryLines}` : ''}
${topLines ? `*Terbesar keluar*\n${topLines}` : ''}
${insight}`;
}

export function formatHistory(transactions) {
  if (transactions.length === 0) {
    return 'Belum ada transaksi.';
  }
  
  let list = '';
  transactions.forEach((tx, i) => {
    const emoji = tx.type === 'keluar' ? '🔴' : '🟢';
    list += `${i + 1}. ${emoji} ${formatRupiah(tx.amount)} ${tx.title}\n   _(${tx.date} ${tx.time})_\n\n`;
  });
  
  return `🕰️ *5 Transaksi Terakhir*

─────────────────
${list.trim()}
─────────────────

💡 Ketik *hapus [nomor]* untuk menghapus.`;
}

export function formatHelpMessage() {
  return `📖 *UangKu — Panduan Lengkap*

─────────────────
💸 *CATAT TRANSAKSI*

Pengeluaran:
  \`keluar 50rb makan siang\`
  \`bayar 100rb grab\`
  \`beli 25k kopi\`

Pemasukan:
  \`masuk 5jt gaji\`
  \`hadiah 30rb #hiburan\`

Tanda + (pemasukan) atau - (pengeluaran):
  \`+200rb tunai dari nguli\`
  \`-50rb makan siang\`

Tanpa awalan (otomatis keluar):
  \`bensin 50rb\`
  \`100rb belanja\`

Pakai rekening (tanpa \`@\`):
  \`keluar 50rb makan BCA\`
  \`masuk 5jt gaji Dana\`

Ketik banyak sekaligus:
  \`Cabut gigi 250k\`
  \`Obat 81k\`
  _(enter tiap transaksi)_

─────────────────
🏦 *REKENING & SALDO*

  \`saldo\` → ringkasan semua rekening
  \`saldo Dana\` → detail rekening Dana
  \`sumber dana\` → daftar rekening aktif
  \`aktifkan GoPay\` → tambah rekening baru
  \`saldo awal 1jt BCA\` → set saldo awal
  \`transfer dana 1jt dari BCA ke Dana\`

─────────────────
📊 *LAPORAN & RINGKASAN*

  \`hari ini\` → laporan hari ini
  \`minggu ini\` → laporan minggu ini
  \`bulan ini\` → laporan bulan ini
  \`riwayat\` → 5 transaksi terakhir
  \`ringkasan\` → rekap bulanan
  \`budget\` → cek budget per kategori
  \`budget makan 300rb/bulan\` → set budget

─────────────────
🏷️ *HUTANG & PIUTANG*

  \`hutang\` → daftar semua hutang
  \`hutang baru Kredivo 12jt 1.2jt 10x\`
  \`utang Andi 500rb\` → catat utang sosial
  \`piutang Budi 300rb\` → catat piutang
  \`bayar hutang Kredivo 1.2jt\`
  \`bayar hutang Kredivo 1.2jt BCA\`

─────────────────
🗑️ *HAPUS & BATAL*

  \`batal\` → hapus transaksi terakhir
  \`hapus 2\` → hapus dari riwayat global
  \`hapus 2 Dana\` → hapus dari rekening Dana

─────────────────
⏰ *PENGINGAT*

  \`pengingat\` → lihat daftar pengingat
  \`ingatkan tagihan listrik tiap tgl 1\`

─────────────────
⚙️ *LAINNYA*

  \`profil\` → info akun
  \`kategori\` → daftar kategori
  \`dashboard\` → link dashboard PWA
  \`/id\` → ID WhatsApp untuk login
  \`export\` → download CSV
  \`bantuan\` → menu ini

─────────────────
💡 *Tips:*
• Ketik nominal fleksibel:
  50rb = 50.000 | 5jt = 5jt | 25k = 25.000
• Tag kategori: \`#makan\` \`#hiburan\`
• Tanpa \`@\` juga bisa: \`BCA\` \`Dana\` \`GoPay\``;
}
