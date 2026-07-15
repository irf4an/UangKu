// NLP Parser for Indonesian financial chat messages
// Parses natural language like "keluar 50rb makan siang" into structured data

const CATEGORY_KEYWORDS = {
  // Food & Drinks
  makanan: ['makan', 'minum', 'jajan', 'snack', 'kopi', 'teh', 'susu', 'roti', 'nasi', 'ayam', 'ikan', 'sayur', 'buah', 'bakso', 'soto', 'mie', 'pizza', 'burger', 'sate', 'rendang', 'gado', 'es', 'jus', 'yakult', 'coklat', 'kue', 'donat', 'martabak', 'sosis', 'kerupuk'],
  
  // Transportation
  transportasi: ['grab', 'gojek', 'uber', 'taksi', 'taxi', 'bus', 'kereta', 'mrt', 'transjakarta', 'ojek', 'bensin', 'parkir', 'tol', 'motor', 'mobil', 'angkot', 'bajaj', 'ojol', 'ride', 'ojek', 'ojek online'],
  
  // Health
  kesehatan: ['dokter', 'obat', 'rumah sakit', 'rs', 'apotek', 'klinik', 'vitamin', 'bpjs', 'gigi', 'mata', 'kulit', 'rambut', 'terapi', 'fisioterapi', 'lab', 'tes', 'vaksin', 'medical', 'checkup'],
  
  // Bills & Utilities
  tagihan: ['listrik', 'pln', 'air', 'pdam', 'internet', 'wifi', 'indihome', 'telkomsel', 'xl', 'axis', 'tri', 'smartfren', 'pulsa', 'token', 'token listrik', 'bpjs', 'asuransi', 'cicilan', 'angsuran', 'sewa', 'kos', 'kontrakan', 'domain', 'hosting', 'langganan', 'netflix', 'spotify', 'youtube', 'premium'],
  
  // Entertainment
  hiburan: ['nonton', 'bioskop', 'cinema', 'xxi', 'cgv', 'game', 'steam', 'playstation', 'ps', 'nintendo', 'konser', 'tiket', 'liburan', 'travel', 'hotel', 'tiket pesawat', 'tiket kereta', 'karaoke', 'billiard', 'bowling', 'arcade'],
  
  // Shopping
  belanja: ['beli', 'belanja', 'shopping', 'mall', 'supermarket', 'indomaret', 'alfamart', 'tokopedia', 'shopee', 'lazada', 'bukalapak', 'blibli', 'toko', 'pasar', 'warung', 'minimarket'],
  
  // Education
  pendidikan: ['buku', 'sekolah', 'kuliah', 'kursus', 'les', 'bimbel', 'ujian', 'spp', 'daftar', 'formulir', 'alat tulis', 'pulpen', 'pensil', 'notebook', 'laptop', 'komputer'],
};

// Parse nominal from various Indonesian formats
function parseNominal(text, suffix) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  text = text.trim();
  
  if (!suffix) {
    // Try to extract suffix from the text itself
    const match = text.match(/^([\d.,]+)\s*(rb|ribu|jt|juta|k|m)?$/i);
    if (match) {
      text = match[1];
      suffix = match[2];
    }
  }
  
  if (suffix) {
    const cleanNumStr = text.replace(/,/g, '.');
    const dotCount = (cleanNumStr.match(/\./g) || []).length;
    let val;
    if (dotCount === 1) {
      val = parseFloat(cleanNumStr);
    } else {
      val = parseFloat(cleanNumStr.replace(/\./g, ''));
    }
    
    if (isNaN(val)) return null;
    
    let multiplier = 1;
    switch (suffix.toLowerCase()) {
      case 'rb': case 'ribu': case 'k':
        multiplier = 1000;
        break;
      case 'jt': case 'juta': case 'm':
        multiplier = 1000000;
        break;
    }
    return Math.round(val * multiplier);
  } else {
    const cleanNumStr = text.replace(/[.,]/g, '');
    const val = parseInt(cleanNumStr, 10);
    return isNaN(val) ? null : val;
  }
}

// Detect category from text
export function detectCategory(text) {
  const lower = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  return 'lainnya';
}

// Known bank/e-wallet names (case-insensitive) — for @-less detection
const KNOWN_ACCOUNTS = [
  'bca', 'mandiri', 'bri', 'bni', 'cimb', 'cimb niaga', 'danamon', 'permata',
  'gopay', 'ovo', 'dana', 'shopeepay', 'linkaja', 'jenius',
  'tunai', 'cash', 'kartu kredit', 'cc', 'kredivo', 'akulaku',
  'bca yuni', 'mandiri yuni',
];

// Extract @accountName from text, returns { cleanText, accountName }
function extractAccount(text) {
  // 1) Try @-prefixed first (explicit)
  const atMatch = text.match(/@([A-Za-z0-9][A-Za-z0-9\s\-]*)/);
  if (atMatch) {
    const accountName = atMatch[1].trim();
    const cleanText = text.replace(atMatch[0], '').trim();
    return { cleanText, accountName };
  }

  // 2) Try matching known bank/e-wallet name anywhere in text
  const lower = text.toLowerCase().trim();
  const sorted = [...KNOWN_ACCOUNTS].sort((a, b) => b.length - a.length);

  for (const name of sorted) {
    // Match known name at end: "50rb makan tunai"
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const endRegex = new RegExp(`(^|\\s)(${escaped})\\s*$`, 'i');
    const endMatch = lower.match(endRegex);
    if (endMatch) {
      const accountName = endMatch[2];
      const cleanText = text.slice(0, endMatch.index).trim();
      return { cleanText, accountName };
    }
  }

  for (const name of sorted) {
    // Match known name at start: "bca buat beli bakso", "dana terima 1jt"
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startRegex = new RegExp(`^(${escaped})\\s+`, 'i');
    const startMatch = lower.match(startRegex);
    if (startMatch) {
      const accountName = startMatch[1];
      const cleanText = text.slice(startMatch[0].length).trim();
      return { cleanText, accountName };
    }
  }

  for (const name of sorted) {
    // Match known name in middle: "tunai dari ngojek", "+150k tunai dari ngojek"
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const midRegex = new RegExp(`(^|\\s)(${escaped})(?=\\s+)`, 'i');
    const midMatch = lower.match(midRegex);
    if (midMatch) {
      const accountName = midMatch[2];
      const idx = midMatch.index + (midMatch[1] ? midMatch[1].length : 0);
      const before = text.slice(0, midMatch.index).trim();
      const after = text.slice(idx + accountName.length).trim();
      const cleanText = [before, after].filter(Boolean).join(' ');
      return { cleanText, accountName };
    }
  }

  return { cleanText: text, accountName: null };
}

// Extract #category from end of text, returns { cleanText, forcedCategory }
function extractCategory(text) {
  const match = text.match(/#([A-Za-z0-9]+)\s*$/);
  if (match) {
    const forcedCategory = match[1].toLowerCase();
    const cleanText = text.replace(match[0], '').trim();
    return { cleanText, forcedCategory };
  }
  return { cleanText: text, forcedCategory: null };
}

// Main parser function
export function parseMessage(text) {
  const original = text.trim();
  const lower = original.toLowerCase();
  
  // --- Multi-line batch detection ---
  const lines = original.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 1) {
    // Check if lines contain multiple independent commands/transactions
    // A batch is valid if it has at least one number/nominal OR multiple distinct command words
    const hasNominal = /\d+\s*(rb|ribu|jt|juta|k)?\b/i;
    const isCommand = /^([+-]|keluar|masuk|bayar|beli|terima|gaji|sumber|aktifkan|pindah|saldo|budget|cek|hutang|piutang|riwayat|hari ini|bulan ini)/i;
    
    // We consider it a batch if all lines look like valid inputs (either commands or transactions)
    const isValidBatch = lines.every(line => {
      const trimmed = line.trim();
      return hasNominal.test(trimmed) || isCommand.test(trimmed);
    });
    
    if (isValidBatch) {
      return { command: 'batch_transactions', raw: original, lines };
    }
  }

  // --- Single-line multi-item detection ---
  // e.g. "Cabut gigi 250k Obat 81k Es cream 23k"
  // Split on boundaries where a nominal+unit is followed by text (next item starts)
  // Strategy: find all nominal positions and split the line into segments
  if (!/^([+-]|keluar|masuk|bayar|beli|terima|gaji|bonus|refund|topup|sumber|aktifkan|pindah|transfer|saldo|budget|cek|hutang|piutang|profil|kategori|dashboard|hari|minggu|bulan|riwayat|terakhir|hapus|batal|pengingat|ingatkan|lihat|export|bantuan|ringkasan)/i.test(lower)) {
    // Not starting with a known command word — might be multi-item like "Cabut gigi 250k Obat 81k"
    const nominalPattern = /(\d[\d.,]*)\s*(rb|ribu|jt|juta|k|m)?\b/gi;
    const nominalMatches = [...lower.matchAll(nominalPattern)];
    
    if (nominalMatches.length >= 2) {
      // Split original text at positions where a new item begins
      // Each item = "description nominal" — split right after each nominal
      const segments = [];
      let lastSplit = 0;
      
      for (let i = 0; i < nominalMatches.length - 1; i++) {
        const matchEnd = nominalMatches[i].index + nominalMatches[i][0].length;
        // Look for the next text segment after this nominal (skip whitespace)
        const afterNominal = original.slice(matchEnd);
        const nextWordMatch = afterNominal.match(/^\s+/);
        const splitAt = matchEnd + (nextWordMatch ? nextWordMatch[0].length : 0);
        
        const segment = original.slice(lastSplit, matchEnd).trim();
        if (segment) segments.push(segment);
        lastSplit = matchEnd;
      }
      // Last segment
      const lastSegment = original.slice(lastSplit).trim();
      if (lastSegment) segments.push(lastSegment);
      
      if (segments.length >= 2) {
        return { command: 'batch_transactions', raw: original, lines: segments };
      }
    }
  }

  // --- Command detection ---

  // "hutang" / "lihat hutang" - summary of debts
  if (/^(hutang|lihat\s+hutang)$/i.test(lower)) {
    return { command: 'list_debts' };
  }

  // "hutang baru [name] [total] [installment] [x] [due day]"
  // e.g. "hutang baru Kredivo 12jt 1.2jt 10x" or "hutang baru Kredivo 12jt 1.2jt 10x tgl 5"
  const debtNewMatch = lower.match(/^hutang\s+baru\s+(.+?)\s+([\d.,]+\s*(?:rb|ribu|jt|juta|k)?)\s+([\d.,]+\s*(?:rb|ribu|jt|juta|k)?)(?:\s+(\d+)x)?(?:\s+tgl\s+(\d+))?$/i);
  if (debtNewMatch) {
    const rawTotal = debtNewMatch[2].trim();
    const rawInst = debtNewMatch[3].trim();
    
    // Parse total
    const totalMatch = rawTotal.match(/([\d.,]+)\s*(rb|ribu|jt|juta|k)?/i);
    const total = parseNominal(totalMatch[1], totalMatch[2]);
    
    // Parse installment
    const instMatch = rawInst.match(/([\d.,]+)\s*(rb|ribu|jt|juta|k)?/i);
    const installment = parseNominal(instMatch[1], instMatch[2]);

    return {
      command: 'add_debt',
      name: debtNewMatch[1].trim(),
      total,
      installment,
      tenor: parseInt(debtNewMatch[4] || '1'),
      dueDay: parseInt(debtNewMatch[5] || '0')
    };
  }

  // "utang [name] [amount]" (one-time debt)
  const debtOnceMatch = lower.match(/^utang\s+(.+?)\s+([\d.,]+\s*(?:rb|ribu|jt|juta|k)?)$/i);
  if (debtOnceMatch) {
    const rawAmt = debtOnceMatch[2].trim();
    const amtMatch = rawAmt.match(/([\d.,]+)\s*(rb|ribu|jt|juta|k)?/i);
    const amount = parseNominal(amtMatch[1], amtMatch[2]);
    return {
      command: 'add_single_debt',
      name: debtOnceMatch[1].trim(),
      amount,
      type: 'debt'
    };
  }

  // "piutang [name] [amount]" (receivable)
  const piutangMatch = lower.match(/^piutang\s+(.+?)\s+([\d.,]+\s*(?:rb|ribu|jt|juta|k)?)$/i);
  if (piutangMatch) {
    const rawAmt = piutangMatch[2].trim();
    const amtMatch = rawAmt.match(/([\d.,]+)\s*(rb|ribu|jt|juta|k)?/i);
    const amount = parseNominal(amtMatch[1], amtMatch[2]);
    return {
      command: 'add_single_debt',
      name: piutangMatch[1].trim(),
      amount,
      type: 'receivable'
    };
  }

  // "bayar hutang [name] [amount]"
  const payDebtMatch = lower.match(/^bayar\s+hutang\s+(.+?)\s+([\d.,]+\s*(?:rb|ribu|jt|juta|k)?)(?:\s+@(.+))?$/i);
  if (payDebtMatch) {
    const rawAmt = payDebtMatch[2].trim();
    const amtMatch = rawAmt.match(/([\d.,]+)\s*(rb|ribu|jt|juta|k)?/i);
    const amount = parseNominal(amtMatch[1], amtMatch[2]);
    return {
      command: 'pay_debt',
      name: payDebtMatch[1].trim(),
      amount,
      accountName: payDebtMatch[3] ? payDebtMatch[3].trim() : null
    };
  }

  // "batal" / "hapus" / "undo"
  if (/^(batal|hapus|undo|delete)$/i.test(lower)) {
    return { command: 'delete_last' };
  }

  // "hapus N dari [rekening]" or "hapus N [rekening]" (e.g. hapus 2 dari dana, hapus 2 dana)
  const hapusAccMatch = lower.match(/^hapus\s+(\d+)\s+(?:dari\s+)?@?(.+)$/i);
  if (hapusAccMatch) {
    return { 
      command: 'delete_by_number_account', 
      number: parseInt(hapusAccMatch[1]), 
      accountName: hapusAccMatch[2].trim() 
    };
  }

  // "hapus N" (e.g. hapus 2)
  const hapusMatch = lower.match(/^hapus\s+(\d+)$/i);
  if (hapusMatch) {
    return { command: 'delete_by_number', number: parseInt(hapusMatch[1]) };
  }

  // "saldo [nama_rekening]" (e.g. "saldo dana", "saldo @BCA")
  const saldoAccMatch = lower.match(/^(?:saldo|balance|cek\s+saldo)\s+@?(.+?)$/i);
  if (saldoAccMatch && !/^(awal|dan\s|hari\s|minggu\s|bulan\s)/i.test(saldoAccMatch[1])) {
    return { command: 'check_account_balance', accountName: saldoAccMatch[1].trim() };
  }

  // "saldo" / "balance" (global)
  if (/^(saldo|balance|cek\s+saldo)$/i.test(lower)) {
    return { command: 'check_balance' };
  }

  // "ringkasan" / "summary"
  if (/^(ringkasan|summary|rekap)$/i.test(lower)) {
    return { command: 'summary' };
  }

  // "hari ini" - today's report
  if (/^hari\s+ini$/i.test(lower)) {
    return { command: 'today_report' };
  }

  // "minggu ini" - this week's report
  if (/^minggu\s+ini$/i.test(lower)) {
    return { command: 'week_report' };
  }

  // "bulan ini" - this month's report
  if (/^bulan\s+ini$/i.test(lower)) {
    return { command: 'month_report' };
  }

  // "riwayat" / "terakhir" - recent history
  if (/^(riwayat|terakhir|history)$/i.test(lower)) {
    return { command: 'history' };
  }

  // "budget"
  if (/^(budget|cek budget)$/i.test(lower)) {
    return { command: 'check_budget' };
  }

  // "bantuan" / "help"
  if (/^(bantuan|help|menu|\?)$/i.test(lower)) {
    return { command: 'help' };
  }

  // "/id" - get user's bot ID
  if (/^(\/id|id saya|bot id)$/i.test(lower)) {
    return { command: 'get_id' };
  }

  // "export"
  if (/^(export|csv|download)$/i.test(lower)) {
    return { command: 'export' };
  }

  // "sumber dana" / "list accounts"
  if (/^(sumber\s+dana|list\s*accounts?)$/i.test(lower)) {
    return { command: 'list_accounts' };
  }

  // "kategori" / "list categories"
  if (/^kategori$/i.test(lower)) {
    return { command: 'list_categories' };
  }

  // "profil" / "profile"
  if (/^profil(e)?$/i.test(lower)) {
    return { command: 'profile' };
  }

  // "dashboard"
  if (/^dashboard$/i.test(lower)) {
    return { command: 'dashboard_info' };
  }

  // "pengingat" / list reminders
  if (/^pengingat$/i.test(lower)) {
    return { command: 'list_reminders' };
  }

  // "hapus pengingat [number]"
  const hapusPengingat = lower.match(/^hapus\s+pengingat\s+(\d+)$/);
  if (hapusPengingat) {
    return { command: 'delete_reminder', reminderNumber: parseInt(hapusPengingat[1]) };
  }

  // "ingatkan [title] tiap tgl [day]"
  const ingatkanMatch = original.match(/^ingatkan\s+(.+?)\s+tiap\s+tgl\s+(\d+)/i);
  if (ingatkanMatch) {
    return { command: 'add_reminder', title: ingatkanMatch[1].trim(), dueDay: parseInt(ingatkanMatch[2]) };
  }

  // "aktifkan [nama] [optional balance]"
  const aktifkanMatch = original.match(/^aktifkan\s+(.+?)(?:\s+((?:rp\.?\s*)?\d[\d.,]*(?:rb|ribu|jt|juta|k|m)?(?![a-zA-Z])))?\s*$/i);
  if (aktifkanMatch) {
    const accountName = aktifkanMatch[1].trim();
    const balance = aktifkanMatch[2] ? parseNominal(aktifkanMatch[2]) : 0;
    return { command: 'activate_account', accountName, balance: balance || 0 };
  }

  // "saldo awal [nominal] @[nama]" — @ is optional
  const saldoAwalMatch = original.match(/^saldo\s+awal\s+((?:rp\.?\s*)?[\d.,]+\s*(?:rb|ribu|jt|juta|k|m)?(?![a-zA-Z]))\s+@?(.+?)$/i);
  if (saldoAwalMatch) {
    const amount = parseNominal(saldoAwalMatch[1].trim());
    const accountName = saldoAwalMatch[2].trim();
    return { command: 'update_balance', amount, accountName };
  }

  // "pindah [nominal] dari @[asal] ke @[tujuan]" or "transfer dana [nominal] dari [asal] ke [tujuan]"
  // @ is optional on both accounts
  const pindahMatch = original.match(/^(?:pindah|transfer\s+dana)\s+((?:rp\.?\s*)?[\d.,]+\s*(?:rb|ribu|jt|juta|k|m)?(?![a-zA-Z]))\s+dari\s+@?(.+?)\s+ke\s+@?(.+?)$/i);
  if (pindahMatch) {
    const amount = parseNominal(pindahMatch[1].trim());
    const fromAccount = pindahMatch[2].trim();
    const toAccount = pindahMatch[3].trim();
    return { command: 'transfer_funds', amount, fromAccount, toAccount };
  }

  // "tambah rekening BCA 1jt" / "tabungan Mandiri 500k"
  const rekMatch = original.match(/^(tambah\s+rekening|tabungan|rekening|account)\s+(.+?)\s+((?:rp\.?\s*)?\d[\d.,]*(?:rb|jt|k|m)?(?![a-zA-Z]))\s*$/i);
  if (rekMatch) {
    return {
      command: 'add_account',
      accountName: rekMatch[2].trim(),
      balance: parseNominal(rekMatch[3]),
    };
  }

  // "rekening" / "account"
  if (/^(rekening|account|akun|saldo detail)$/i.test(lower)) {
    return { command: 'accounts' };
  }

  // --- Transaction parsing ---

  // Pattern 1: "keluar 50rb makan siang"
  // Pattern 2: "masuk 5jt gaji bulanan"
  // Pattern 3: "makan siang 50rb" (auto-detect type)
  // Pattern 4: "50rb makan siang" (auto-detect type)

  let type = null;
  let amount = null;
  let description = '';
  let accountName = null;
  let forcedCategory = null;

  let remaining = original;

  // Extract @accountName FIRST so "dana terima 1jt" works
  const accountResult = extractAccount(remaining);
  accountName = accountResult.accountName;
  remaining = accountResult.cleanText;

  // Detect type keywords including + and - (AFTER account extraction)
  const typePatterns = {
    keluar: /^(keluar|kluar|klr|out|spent|bayar|beli|belanja|for|buat|-)\s*/i,
    masuk: /^(masuk|msk|masu|in|income|gaji|terima|dapat|dpt|bonus|hadiah|refund|topup|top up|\+)\s*/i,
  };

  // Check if starts with type keyword
  for (const [t, pattern] of Object.entries(typePatterns)) {
    const match = remaining.match(pattern);
    if (match) {
      type = t;
      remaining = remaining.slice(match[0].length).trim();
      break;
    }
  }

  // Extract @accountName from remaining text (if not already found above)
  if (!accountName) {
    const accountResult2 = extractAccount(remaining);
    accountName = accountResult2.accountName;
    remaining = accountResult2.cleanText;
  }

  // Extract #category from end of remaining text
  const categoryResult = extractCategory(remaining);
  forcedCategory = categoryResult.forcedCategory;
  remaining = categoryResult.cleanText;

  // Extract amount - try multiple patterns
  const amountMatch = remaining.match(/^(?:rp\.?\s*)?(\d+(?:[.,]\d+)*)\s*(rb|ribu|jt|juta|k|m)?(?![a-zA-Z])/i);
  if (amountMatch) {
    amount = parseNominal(amountMatch[1], amountMatch[2]);
    remaining = remaining.slice(amountMatch[0].length).trim();
  }
  
  // If amount not found at start, try finding it anywhere
  if (!amount) {
    const anyAmount = remaining.match(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)*)\s*(rb|ribu|jt|juta|k|m)?(?![a-zA-Z])/i);
    if (anyAmount) {
      amount = parseNominal(anyAmount[1], anyAmount[2]);
      remaining = remaining.replace(anyAmount[0], '').trim();
    }
  }

  if (!amount || amount <= 0) {
    return { command: 'unknown', raw: original };
  }

  // Remaining text is description
  description = remaining.replace(/[,.–—]+$/, '').trim();

  // If description is empty, make a smart fallback title
  if (!description) {
    if (forcedCategory) {
      // Use the forced category as the title (capitalized)
      description = forcedCategory.charAt(0).toUpperCase() + forcedCategory.slice(1);
    } else if (type) {
      // Find the original keyword that matched (e.g. "hadiah", "bonus", "gaji")
      for (const pattern of Object.values(typePatterns)) {
        const m = original.match(pattern);
        if (m) {
          description = m[0].trim();
          description = description.charAt(0).toUpperCase() + description.slice(1);
          break;
        }
      }
    }
  }
  if (!description) description = 'Tanpa keterangan';

  // Auto-detect category from description (or use forced category)
  const category = forcedCategory || detectCategory(description);

  // If type not specified, default to 'keluar'
  if (!type) {
    type = 'keluar';
  }

  // Get current date/time in WIB (UTC+7)
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const date = wib.toISOString().split('T')[0];
  const time = wib.toISOString().split('T')[1].slice(0, 5);

  const result = {
    command: 'add_transaction',
    type,
    amount,
    title: description,
    category,
    date,
    time,
  };

  // Include account if specified
  if (accountName) {
    result.accountName = accountName;
  }

  return result;
}

// Format currency to Indonesian Rupiah
export function formatRupiah(num) {
  return 'Rp' + num.toLocaleString('id-ID');
}

// Format transaction response
export function formatTransactionResponse(parsed) {
  const emoji = parsed.type === 'keluar' ? '🔴' : '🟢';
  const typeLabel = parsed.type === 'keluar' ? 'Keluar' : 'Masuk';
  
  return `${emoji} *Tercatat: ${typeLabel}*\n💰 ${formatRupiah(parsed.amount)}\n📝 ${parsed.title}\n📂 ${parsed.category.charAt(0).toUpperCase() + parsed.category.slice(1)}\n🕐 ${parsed.date} ${parsed.time}`;
}

// Format summary response
export function formatSummaryResponse(summary, categoryBreakdown, month) {
  let text = `📊 *Ringkasan ${month}*\n\n`;
  
  const masuk = summary.find(s => s.type === 'masuk');
  const keluar = summary.find(s => s.type === 'keluar');
  
  text += `🟢 Masuk: ${formatRupiah(masuk?.total || 0)} (${masuk?.count || 0} transaksi)\n`;
  text += `🔴 Keluar: ${formatRupiah(keluar?.total || 0)} (${keluar?.count || 0} transaksi)\n`;
  text += `💰 Neto: ${formatRupiah((masuk?.total || 0) - (keluar?.total || 0))}\n\n`;
  
  if (categoryBreakdown.length > 0) {
    text += `📂 *Pengeluaran per Kategori:*\n`;
    const total = categoryBreakdown.reduce((acc, c) => acc + c.total, 0);
    for (const cat of categoryBreakdown) {
      const pct = Math.round((cat.total / total) * 100);
      const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
      text += `${cat.category}: ${formatRupiah(cat.total)} (${pct}%)\n${bar}\n`;
    }
  }
  
  return text;
}

// Format help message
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
