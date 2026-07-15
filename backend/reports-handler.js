import { parseMessage, formatTransactionResponse, formatRupiah, formatSummaryResponse, formatHelpMessage } from './parser.js';
import * as formatter from './formatter.js';

// Fallback to formatter functions if not imported from parser yet
// (because of previous task transitions)
function safeFormatDailyReport(transactions) {
  if (formatter && typeof formatter.formatDailyReport === 'function') {
    return formatter.formatDailyReport(transactions);
  }
  
  let totalMasuk = 0;
  let totalKeluar = 0;
  
  for (const t of transactions) {
    if (t.type === 'masuk') totalMasuk += t.amount;
    if (t.type === 'keluar') totalKeluar += t.amount;
  }
  
  let msg = `📊 *Laporan Hari Ini*\n`;
  msg += `─────────────────\n`;
  msg += `🟢 Masuk  : ${formatRupiah(totalMasuk)}\n`;
  msg += `🔴 Keluar : ${formatRupiah(totalKeluar)}\n`;
  msg += `─────────────────\n`;
  
  if (transactions.length > 0) {
    msg += `*Detail Transaksi:*\n`;
    transactions.slice(0, 5).forEach((t) => {
      const emoji = t.type === 'keluar' ? '🔴' : '🟢';
      msg += `${emoji} ${formatRupiah(t.amount)} - ${t.title || t.category} ${t.accountName ? '(@'+t.accountName+')' : ''}\n`;
    });
    if (transactions.length > 5) {
      msg += `\n...dan ${transactions.length - 5} lainnya\n`;
    }
  } else {
    msg += `Belum ada transaksi hari ini.\n`;
  }
  
  return msg;
}

function safeFormatWeeklyReport(transactions) {
  if (formatter && typeof formatter.formatWeeklyReport === 'function') {
    return formatter.formatWeeklyReport(transactions);
  }
  return safeFormatDailyReport(transactions).replace('Hari Ini', 'Minggu Ini');
}

function safeFormatMonthlyReport(transactions) {
  if (formatter && typeof formatter.formatMonthlyReport === 'function') {
    return formatter.formatMonthlyReport(transactions);
  }
  return safeFormatDailyReport(transactions).replace('Hari Ini', 'Bulan Ini');
}

function safeFormatHistory(transactions) {
  if (formatter && typeof formatter.formatHistory === 'function') {
    return formatter.formatHistory(transactions);
  }
  
  let msg = `🕒 *Riwayat Terakhir*\n─────────────────\n`;
  
  if (!transactions || transactions.length === 0) {
    return msg + "Belum ada transaksi tercatat.";
  }
  
  transactions.forEach((t, i) => {
    const emoji = t.type === 'keluar' ? '🔴' : '🟢';
    msg += `${i+1}. ${emoji} ${formatRupiah(t.amount)} - ${t.title || t.category} (${t.date})\n`;
  });
  
  msg += `─────────────────\n💡 Ketik *hapus [nomor]* untuk menghapus.`;
  return msg;
}

// Ensure exports are available if we need to require this file
export {
  safeFormatDailyReport,
  safeFormatWeeklyReport,
  safeFormatMonthlyReport,
  safeFormatHistory
};
