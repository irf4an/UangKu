import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import QRCode from 'qrcode';
import { stmts } from './db.js';
import { parseMessage, formatRupiah } from './parser.js';
import { formatTransactionResponse, formatSummaryResponse, formatHelpMessage, formatBudgetResponse } from './formatter.js';
import { safeFormatDailyReport, safeFormatWeeklyReport, safeFormatMonthlyReport, safeFormatHistory } from './reports-handler.js';
import { extractReceiptInfo } from './ocr.js';
import { createApiRoutes } from './api.js';
import { startReminderCron } from './reminder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = pino({ level: 'warn' });

// Global state for QR web display
let currentQR = null;
let isConnected = false;
let connectedPhone = null;
const sseClients = new Set();

const apiHandler = createApiRoutes();

// In-memory cache for pending OCR confirmations
// key: senderPhone, value: { parsed data from OCR }
const pendingOcrCache = new Map();

// In-memory cache for transactions waiting for account assignment
// key: senderPhone, value: { transactionId, type, amount, timestamp }
const pendingMissingAccount = new Map();
const ACCOUNT_ASSIGN_TIMEOUT = 60000; // 60 seconds

// HTTP server for QR display + API
const server = http.createServer(async (req, res) => {
  // Route API requests
  if (req.url?.startsWith('/api/')) {
    return apiHandler(req, res);
  }
  
  // QR display page
  if (req.url === '/qr' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    
    if (isConnected) {
      res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>UangKu - Connected</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0fdf4}
.box{text-align:center;padding:2rem;background:white;border-radius:1rem;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
h1{color:#059669}p{color:#666}</style></head>
<body><div class="box"><h1>✅ Connected!</h1><p>Bot terkoneksi ke WhatsApp: <b>${connectedPhone}</b></p><p>Bot sudah aktif dan siap menerima chat.</p></div></body></html>`);
    } else if (currentQR) {
      const qrDataUrl = await QRCode.toDataURL(currentQR, { width: 300, margin: 2 });
      res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>UangKu - Scan QR</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0f9ff}
.box{text-align:center;padding:2rem;background:white;border-radius:1rem;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
h2{color:#1e40af;margin-bottom:0.5rem}p{color:#666;font-size:14px}img{border:2px solid #e5e7eb;border-radius:8px;margin:1rem 0}
.steps{text-align:left;font-size:13px;color:#555;margin-top:1rem;padding:1rem;background:#f9fafb;border-radius:8px}
</style></head>
<body><div class="box"><h2>📱 Scan QR Code</h2><p>Buka WhatsApp → Linked Devices → Link a Device</p>
<img src="${qrDataUrl}" alt="QR Code" id="qr">
<div class="steps"><b>Langkah:</b><br>1. Buka WhatsApp di HP<br>2. Settings → Linked Devices<br>3. Klik "Link a Device"<br>4. Scan QR code di atas</div>
<p style="margin-top:1rem;font-size:12px;color:#999">QR auto-refresh · Halaman ini otomatis update</p>
</div>
<script>setTimeout(()=>location.reload(),15000)</script></body></html>`);
    } else {
      res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>UangKu - Waiting</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fef3c7}
.box{text-align:center;padding:2rem;background:white;border-radius:1rem;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
h2{color:#d97706}p{color:#666}</style></head>
<body><div class="box"><h2>⏳ Menunggu QR Code...</h2><p>Bot sedang memulai koneksi. Tunggu beberapa detik.</p>
<script>setTimeout(()=>location.reload(),3000)</script></div></body></html>`);
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3000, '0.0.0.0', () => {
  console.log('🌐 QR display web: http://localhost:3000/qr');
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info'));
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: ['UangKu', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      currentQR = qr;
      isConnected = false;
      connectedPhone = null;
      console.log('📱 QR updated — scan dari browser: http://119.28.110.163:3000/qr');
    }
    
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(`Connection closed. Reason: ${reason}`);
      isConnected = false;
      connectedPhone = null;
      
      if (reason === DisconnectReason.loggedOut) {
        console.log('Logged out! Delete auth_info folder and restart.');
        currentQR = null;
        process.exit(1);
      } else {
        console.log('Reconnecting...');
        setTimeout(() => startBot(), 3000);
      }
    }
    
    if (connection === 'open') {
      currentQR = null;
      isConnected = true;
      connectedPhone = sock.user?.id?.split(':')[0] || 'unknown';
      console.log(`✅ WhatsApp Bot connected! Phone: ${connectedPhone}`);
      startReminderCron(sock);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    
    const text = msg.message.conversation 
      || msg.message.extendedTextMessage?.text 
      || msg.message.imageMessage?.caption
      || '';
    
    const isImage = !!msg.message.imageMessage;
    
    if (!text.trim() && !isImage) return;
    
    const sender = msg.key.remoteJid;
    
    if (sender.endsWith('@g.us')) return;
    
    // Handle phone number extraction (support @lid and @s.whatsapp.net)
    let senderPhone;
    if (sender.endsWith('@s.whatsapp.net')) {
      senderPhone = sender.replace('@s.whatsapp.net', '');
    } else if (sender.endsWith('@lid')) {
      // LID format - try to get actual phone from pushName or participant
      const pushName = msg.pushName || '';
      senderPhone = sender.replace('@lid', '');
      console.log(`[LID detected: ${senderPhone}, pushName: ${pushName}]`);
    } else {
      senderPhone = sender.split('@')[0];
    }
    
    console.log(`[${senderPhone}] ${isImage ? '[IMAGE] ' : ''}${text}`);
    
    // Owner-only whitelist: only respond to the owner
    const OWNER_PHONE = '16948159053996';
    if (senderPhone !== OWNER_PHONE) {
      console.log(`[BLOCKED] ${senderPhone} is not owner, ignoring.`);
      return;
    }
    
    let user = stmts.getUserByPhone.get(senderPhone);
    if (!user) {
      stmts.createUser.run(senderPhone, senderPhone);
      user = stmts.getUserByPhone.get(senderPhone);
    }
    
    // Handle pending missing account assignment (user types account name after transaksi)
    const lowerText = text.trim().toLowerCase();
    if (pendingMissingAccount.has(senderPhone)) {
      const pending = pendingMissingAccount.get(senderPhone);
      // Check if expired
      if (Date.now() - pending.timestamp > ACCOUNT_ASSIGN_TIMEOUT) {
        pendingMissingAccount.delete(senderPhone);
      } else {
        // Check if the text is just a simple account name (no numbers, no keywords)
        const simpleAccountMatch = text.trim().replace(/^@/, '');
        const acc = stmts.getAccountByName.get(user.id, simpleAccountMatch);
        if (acc) {
          // Update the transaction to this account
          stmts.updateTransactionAccount.run(acc.id, pending.transactionId, user.id);
          // Update the account balance
          const delta = pending.type === 'keluar' ? -pending.amount : pending.amount;
          stmts.updateAccountBalance.run(delta, acc.id);
          pendingMissingAccount.delete(senderPhone);
          
          const refreshed = stmts.getAccountByName.get(user.id, simpleAccountMatch);
          await sock.sendMessage(sender, { text: `🏦 Transaksi dipindahkan ke rekening *${acc.name}*!\n💰 Saldo: ${formatRupiah(refreshed.balance)}` });
          return;
        }
      }
    }
    
    // Handle OCR confirmation (ya/batal/ya rekening) if there's a pending OCR
    if (pendingOcrCache.has(senderPhone)) {
      const pending = pendingOcrCache.get(senderPhone);
      
      const yaMatch = lowerText.match(/^(?:ya|iya|ok|konfirmasi|yes)(?:\s+(?:ke\s+|pakai\s+|dari\s+)?(.+))?$/i);
      if (yaMatch) {
        let accId = null;
        
        // Override accountName if specified by user (e.g. "ya dana")
        const specifiedAcc = yaMatch[1];
        if (specifiedAcc) {
          pending.accountName = specifiedAcc.replace(/^@/, '').trim();
        }
        
        // Update account balance if applicable
        if (pending.accountName) {
          const acc = stmts.getAccountByName.get(user.id, pending.accountName);
          if (acc) {
            accId = acc.id;
            const delta = pending.type === 'keluar' ? -pending.amount : pending.amount;
            stmts.updateAccountBalance.run(delta, acc.id);
            pending.accountName = acc.name; // Use proper casing from DB
          } else {
            // Warn if account not found but user specified it
            if (specifiedAcc) {
              await sock.sendMessage(sender, { text: `❌ Rekening "${pending.accountName}" tidak ditemukan.\nKetik *sumber dana* untuk melihat daftar rekening.\nSilakan ulangi konfirmasi (ketik *ya [rekening]* atau *batal*).` });
              return;
            }
            // If it was auto-detected from OCR and not found, just ignore and save without account
            pending.accountName = null;
          }
        }
        
        // Insert the transaction
        stmts.addTransaction.run(
          user.id, pending.type, pending.amount,
          pending.title, pending.category, pending.date, pending.time, accId
        );
        
        const emoji = pending.type === 'keluar' ? '🔴' : '🟢';
        const typeLabel = pending.type === 'keluar' ? 'Keluar' : 'Masuk';
        let reply = `${emoji} *Tercatat: ${typeLabel}*\n💰 ${formatRupiah(pending.amount)}\n📝 ${pending.title}\n📂 ${pending.category}`;
        
        if (pending.accountName) {
          reply += `\n🏦 Rekening: ${pending.accountName}`;
        }
        
        pendingOcrCache.delete(senderPhone);
        await sock.sendMessage(sender, { text: reply });
        return;
      }
      
      if (/^(batal|cancel|tidak|tdk|gak|nggak)$/i.test(lowerText)) {
        pendingOcrCache.delete(senderPhone);
        await sock.sendMessage(sender, { text: '❌ Pencatatan dari foto dibatalkan.' });
        return;
      }
    }
    
    // Handle image message - OCR
    if (isImage) {
      // Don't process if already processing
      if (pendingOcrCache.has(senderPhone)) {
        await sock.sendMessage(sender, { text: '⚠️ Masih ada foto yang belum dikonfirmasi. Ketik *ya* untuk simpan atau *batal* untuk batalkan.' });
        return;
      }
      
      try {
        await sock.sendMessage(sender, { text: '🔍 Membaca struk/nota...' });
        
        // Download the image
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const tmpPath = path.join(__dirname, `tmp_ocr_${Date.now()}.jpg`);
        fs.writeFileSync(tmpPath, buffer);
        
        // Extract info via Gemini Vision
        const ocrResult = await extractReceiptInfo(tmpPath);
        
        // Clean up temp file
        try { fs.unlinkSync(tmpPath); } catch {}
        
        if (!ocrResult || !ocrResult.amount || ocrResult.amount <= 0) {
          await sock.sendMessage(sender, { text: '❌ Gagal membaca nominal dari foto. Coba ketik manual:\n`keluar 50000 belanja`\natau `masuk 5000000 gaji`' });
          return;
        }
        
        const now = new Date();
        const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const dateStr = wib.toISOString().slice(0, 10);
        const timeStr = wib.toISOString().slice(11, 16);
        
        // Determine category from title
        const { detectCategory } = await import('./parser.js');
        const category = detectCategory(ocrResult.title || 'Lainnya');
        
        // Cache the OCR result
        pendingOcrCache.set(senderPhone, {
          type: ocrResult.type || 'keluar',
          amount: ocrResult.amount,
          title: ocrResult.title || 'Dari foto',
          category,
          date: dateStr,
          time: timeStr,
          accountName: ocrResult.accountName || null
        });
        
        const emoji = ocrResult.type === 'masuk' ? '🟢' : '🔴';
        const typeLabel = ocrResult.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran';
        let confirmMsg = `📋 *Hasil Baca Struk:*\n\n─────────────────\nJenis     ${typeLabel}\n`;
        
        // Show itemized list if available
        const items = ocrResult.items || [];
        if (items.length > 0) {
          confirmMsg += `\n📝 *Barang:*\n`;
          items.forEach((item, i) => {
            const name = item.name || '-';
            const price = item.price ? formatRupiah(item.price) : '-';
            confirmMsg += `${i + 1}. ${name}  ${price}\n`;
          });
          confirmMsg += `\n`;
        }
        
        confirmMsg += `Nominal   ${formatRupiah(ocrResult.amount)}\nKeterangan ${ocrResult.title || '-'}\n`;
        if (ocrResult.accountName) confirmMsg += `Rekening  ${ocrResult.accountName}\n`;
        confirmMsg += `─────────────────\n\n${emoji} Ketik:\n• *ya* untuk simpan\n• *ya [rekening]* (contoh: \`ya bca\` / \`ya dana\`) untuk pilih rekening\n• *batal* untuk batalkan.`;
        
        await sock.sendMessage(sender, { text: confirmMsg });
        return;
      } catch (err) {
        console.error('OCR processing error:', err);
        await sock.sendMessage(sender, { text: '❌ Terjadi kesalahan saat membaca foto. Coba ketik manual.' });
        return;
      }
    }
    
    const parsed = parseMessage(text);
    
    try {
      let reply = '';
      
      switch (parsed.command) {
        case 'add_transaction': {
          // Update account balance if @accountName was specified
          let accountUsed = null;
          let accId = null;
          if (parsed.accountName) {
            accountUsed = stmts.getAccountByName.get(user.id, parsed.accountName);
            if (accountUsed) {
              accId = accountUsed.id;
              const delta = parsed.type === 'keluar' ? -parsed.amount : parsed.amount;
              stmts.updateAccountBalance.run(delta, accountUsed.id);
            }
          }
          
          const info = stmts.addTransaction.run(
            user.id, parsed.type, parsed.amount,
            parsed.title, parsed.category, parsed.date, parsed.time, accId
          );
          
          if (!accId) {
            pendingMissingAccount.set(senderPhone, {
              transactionId: info.lastInsertRowid,
              type: parsed.type,
              amount: parsed.amount,
              timestamp: Date.now()
            });
          }
          
          const now = new Date();
          const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
          const currentMonthDay = wib.toISOString().slice(0, 10); // YYYY-MM-DD
          
          // Calculate today's summary
          const dailyTxns = stmts.getTransactions.all(user.id, 100).filter(t => t.date === currentMonthDay);
          const dailySummary = { masuk: 0, keluar: 0 };
          for (const t of dailyTxns) {
            dailySummary[t.type] += t.amount;
          }
          
          // Map category to nice name
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
          parsed.categoryName = catMap[parsed.category] || parsed.category;
          
          reply = formatTransactionResponse(parsed, dailySummary);
          
          // Append account info if used
          if (parsed.accountName && accountUsed) {
            reply += `\n🏦 Rekening: ${accountUsed.name} (Saldo: ${formatRupiah(accountUsed.balance)})`;
          } else if (parsed.accountName && !accountUsed) {
            reply += `\n⚠️ Rekening "${parsed.accountName}" tidak ditemukan.`;
          } else if (!accId) {
            // No account specified — suggest quick assignment
            const userAccounts = stmts.getAccounts.all(user.id);
            if (userAccounts.length > 0) {
              const accList = userAccounts.map(a => `*${a.name}*`).join(' / ');
              reply += `\n💡 Ketik nama rekening dalam 60 detik untuk mengaitkan:\n${accList}`;
            }
          }
          
          const currentMonth = parsed.date.slice(0, 7);
          const budget = stmts.getBudgetByCategory.get(user.id, parsed.category, currentMonth);
          if (budget && parsed.type === 'keluar') {
            const monthTrans = stmts.getCategoryBreakdown.all(user.id, currentMonth + '%');
            const spent = monthTrans.find(c => c.category === parsed.category)?.total || 0;
            const ratio = spent / budget.limit_amount;
            
            if (ratio >= 0.9) {
              reply += `\n\n⚠️ *Budget ${parsed.category} sudah ${Math.round(ratio * 100)}%!*\nSisa: ${formatRupiah(budget.limit_amount - spent)}`;
            } else if (ratio >= 0.7) {
              reply += `\n\n⚠️ Budget ${parsed.category} sudah ${Math.round(ratio * 100)}%`;
            }
          }
          break;
        }
        
        case 'delete_last': {
          const deleted = stmts.deleteLastTransaction.run(user.id);
          reply = deleted.changes > 0 
            ? '✅ Transaksi terakhir berhasil dihapus.'
            : '❌ Tidak ada transaksi untuk dihapus.';
          break;
        }

        case 'delete_by_number': {
          const number = parsed.number;
          // Get the transaction details first to show what we deleted
          const txn = stmts.getTransactionByNumber.get(user.id, number - 1);
          if (!txn) {
            reply = `❌ Transaksi nomor ${number} tidak ditemukan.\nKetik \`riwayat\` untuk melihat daftar transaksi terbaru.`;
          } else {
            stmts.deleteTransactionById.run(txn.id, user.id);
            reply = `✅ Transaksi *"${txn.title}"* (${formatRupiah(txn.amount)}) berhasil dihapus.`;
          }
          break;
        }
        
        case 'summary': {
          const now = new Date();
          const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
          const currentMonth = wib.toISOString().slice(0, 7);
          
          const rawSummary = stmts.getMonthlySummary.all(user.id, currentMonth + '%');
          const summaryObj = { masuk: 0, keluar: 0 };
          for (const s of rawSummary) summaryObj[s.type] = s.total;
          
          const categories = stmts.getCategoryBreakdown.all(user.id, currentMonth + '%');
          
          reply = formatSummaryResponse(currentMonth, summaryObj, categories);
          break;
        }
        
        case 'check_balance': {
          const accounts = stmts.getAccounts.all(user.id);
          if (accounts.length === 0) {
            reply = '💰 Belum ada rekening terdaftar.\nAtur dari dashboard PWA.';
          } else {
            reply = '💰 *Saldo per Rekening:*\n\n';
            let total = 0;
            for (const acc of accounts) {
              reply += `${acc.name}: ${formatRupiah(acc.balance)}\n`;
              total += acc.balance;
            }
            reply += `\n📊 Total: ${formatRupiah(total)}`;
          }
          break;
        }

        case 'check_account_balance': {
          const account = stmts.getAccountByName.get(user.id, parsed.accountName);
          if (!account) {
            reply = `❌ Rekening *"${parsed.accountName}"* tidak ditemukan.\nKetik \`sumber dana\` untuk melihat daftar rekening aktif.`;
            break;
          }

          // Get all transactions for this account
          const accTxns = stmts.getTransactionsByAccount.all(user.id, account.id, 100);
          const totalAllTxns = accTxns.length;

          // Calculate masuk & keluar
          const totalMasuk = accTxns.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0);
          const totalKeluar = accTxns.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0);

          // Count total accounts & percentages
          const allAccounts = stmts.getAccounts.all(user.id);
          const totalBalance = allAccounts.reduce((s, a) => s + a.balance, 0);
          const pct = totalBalance > 0 ? Math.round((account.balance / totalBalance) * 100) : 0;

          // Last 5 transactions
          const recentTxns = accTxns.slice(0, 5);

          reply = `🏦 *Detail Rekening: ${account.name}*\n\n─────────────────\n`;
          reply += `💰 Saldo Saat Ini  ${formatRupiah(account.balance)}\n`;
          reply += `📊 Kontribusi      ${pct}% dari total aset\n`;
          reply += `─────────────────\n\n`;
          reply += `📈 *Arus Bulan Ini:*\n`;
          reply += `🟢 Masuk   ${formatRupiah(totalMasuk)}\n`;
          reply += `🔴 Keluar  ${formatRupiah(totalKeluar)}\n`;
          reply += `📊 Neto    ${formatRupiah(totalMasuk - totalKeluar)}\n`;
          reply += `📋 Total   ${totalAllTxns} transaksi\n`;

          if (recentTxns.length > 0) {
            reply += `\n─────────────────\n`;
            reply += `📝 *Transaksi Terakhir:*\n`;
            recentTxns.forEach((tx, idx) => {
              const emoji = tx.type === 'masuk' ? '🟢' : '🔴';
              reply += `${idx + 1}. ${emoji} ${formatRupiah(tx.amount)} — ${tx.title}\n`;
            });
            if (totalAllTxns > 5) {
              reply += `_...dan ${totalAllTxns - 5} transaksi lainnya_\n`;
            }
            reply += `\n💡 Ketik \`hapus [nomor] ${account.name}\` untuk hapus transaksi.`;
          }

          reply += `─────────────────`;
          break;
        }

        case 'delete_by_number_account': {
          const number = parsed.number;
          const targetAccount = stmts.getAccountByName.get(user.id, parsed.accountName);
          if (!targetAccount) {
            reply = `❌ Rekening *"${parsed.accountName}"* tidak ditemukan.`;
            break;
          }

          // Get the Nth transaction for this account
          const accTxnsList = stmts.getTransactionsByAccount.all(user.id, targetAccount.id, 100);
          if (number < 1 || number > accTxnsList.length) {
            reply = `❌ Transaksi nomor ${number} tidak ditemukan di rekening *${targetAccount.name}*.\nKetik \`saldo ${targetAccount.name}\` untuk melihat daftar.`;
            break;
          }

          const targetTx = accTxnsList[number - 1];
          
          // Reverse the balance
          const reverseDelta = targetTx.type === 'keluar' ? targetTx.amount : -targetTx.amount;
          stmts.updateAccountBalance.run(reverseDelta, targetAccount.id);
          
          // Delete the transaction
          stmts.deleteTransactionById.run(targetTx.id, user.id);

          const emoji = targetTx.type === 'masuk' ? '🟢' : '🔴';
          reply = `🗑️ *Transaksi Dihapus dari ${targetAccount.name}:*\n\n`;
          reply += `${emoji} ${formatRupiah(targetTx.amount)} — ${targetTx.title}\n`;
          reply += `\nSaldo ${targetAccount.name} sekarang: ${formatRupiah(targetAccount.balance + reverseDelta)}`;
          break;
        }
        
        case 'check_budget': {
          const now = new Date();
          const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
          const currentMonth = wib.toISOString().slice(0, 7);
          
          const dbBudgets = stmts.getBudgets.all(user.id, currentMonth);
          
          if (dbBudgets.length === 0) {
            reply = formatBudgetResponse(currentMonth, null);
          } else {
            // Re-use logic from api.js for consistency
            const categories = stmts.getCategoryBreakdown.all(user.id, currentMonth + '%');
            const funds = stmts.getSinkingFunds.all(user.id);
            
            let totalBudgetLimit = 0;
            let totalBudgetSpent = 0;
            let totalFundsAllocated = 0;
            
            for (const f of funds) {
              totalFundsAllocated += f.monthly_allocation;
            }
            
            const budgetsData = dbBudgets.map(b => {
              const spent = categories.find(c => c.category === b.category)?.total || 0;
              totalBudgetLimit += b.limit_amount;
              totalBudgetSpent += spent;
              
              const pct = b.limit_amount > 0 ? Math.round((spent / b.limit_amount) * 100) : 0;
              let status = 'safe';
              if (pct >= 90) status = 'danger';
              else if (pct >= 75) status = 'warning';
              
              return {
                category: b.category,
                limit: b.limit_amount,
                spent,
                remaining: b.limit_amount - spent,
                percentage: Math.min(pct, 100),
                status,
                dailyLimit: Math.max(0, Math.round((b.limit_amount - spent) / (new Date(wib.getFullYear(), wib.getMonth() + 1, 0).getDate() - wib.getDate() + 1)))
              };
            });
            
            const daysInMonth = new Date(wib.getFullYear(), wib.getMonth() + 1, 0).getDate();
            const currentDay = wib.getDate();
            const remainingDays = daysInMonth - currentDay + 1;
            
            const remainingBudget = totalBudgetLimit - totalBudgetSpent - totalFundsAllocated;
            const dailySafeBudget = remainingDays > 0 ? Math.max(0, Math.round(remainingBudget / remainingDays)) : 0;
            
            reply = formatBudgetResponse(currentMonth, {
              dailySafeBudget,
              remainingDays,
              remainingBudget: Math.max(0, remainingBudget),
              budgets: budgetsData
            });
          }
          break;
        }
        
        case 'get_id': {
          reply = `🆔 *ID Anda untuk Dashboard:*
\`\`\`${senderPhone}\`\`\`

Masukkan ID ini di dashboard PWA untuk melihat data Anda.
\n📱 Dashboard: http://119.28.110.163:8077`;
          break;
        }
        
        case 'help': {
          reply = formatHelpMessage();
          break;
        }
        
        case 'export': {
          reply = '📥 Export CSV tersedia di dashboard PWA:\nhttp://119.28.110.163:8077\n\nTab Transaksi → Export CSV';
          break;
        }
        
        case 'activate_account': {
          stmts.createAccount.run(user.id, parsed.accountName, parsed.balance || 0);
          reply = `🏦 *Rekening berhasil diaktifkan!*

─────────────────
*Detail Rekening*
Nama       ${parsed.accountName}
Saldo Awal ${formatRupiah(parsed.balance || 0)}

─────────────────
Gunakan \`@${parsed.accountName}\` saat catat transaksi untuk memakai rekening ini.`;
          break;
        }

        case 'transfer_funds': {
          const fromAcc = stmts.getAccountByName.get(user.id, parsed.fromAccount);
          const toAcc = stmts.getAccountByName.get(user.id, parsed.toAccount);

          if (!fromAcc) {
            reply = `❌ Rekening sumber *"${parsed.fromAccount}"* tidak ditemukan.\n\nKetik \`sumber dana\` untuk lihat daftar rekening.`;
            break;
          }
          if (!toAcc) {
            reply = `❌ Rekening tujuan *"${parsed.toAccount}"* tidak ditemukan.\n\nKetik \`sumber dana\` untuk lihat daftar rekening.`;
            break;
          }
          if (fromAcc.id === toAcc.id) {
            reply = '❌ Rekening sumber dan tujuan tidak boleh sama.';
            break;
          }
          if (fromAcc.balance < parsed.amount) {
            reply = `❌ Saldo *${fromAcc.name}* tidak cukup.\nSaldo: ${formatRupiah(fromAcc.balance)}\nDibutuhkan: ${formatRupiah(parsed.amount)}`;
            break;
          }

          stmts.updateAccountBalance.run(-parsed.amount, fromAcc.id);
          stmts.updateAccountBalance.run(parsed.amount, toAcc.id);

          // Refresh balances
          const refreshedFrom = stmts.getAccountByName.get(user.id, parsed.fromAccount);
          const refreshedTo = stmts.getAccountByName.get(user.id, parsed.toAccount);

          reply = `🔁 *Transfer Berhasil!*

─────────────────
*Detail Transfer*
Jumlah     ${formatRupiah(parsed.amount)}
Dari       ${fromAcc.name}
Ke         ${toAcc.name}

─────────────────
*Saldo Terbaru*
${fromAcc.name.padEnd(12)} ${formatRupiah(refreshedFrom.balance).padStart(12)}
${toAcc.name.padEnd(12)} ${formatRupiah(refreshedTo.balance).padStart(12)}`;
          break;
        }

        case 'list_accounts': {
          const commonAccounts = [
            { name: 'Tunai', icon: '💵' },
            { name: 'BCA', icon: '🏦' },
            { name: 'Mandiri', icon: '🏦' },
            { name: 'BRI', icon: '🏦' },
            { name: 'BNI', icon: '🏦' },
            { name: 'GoPay', icon: '🟢' },
            { name: 'OVO', icon: '🟣' },
            { name: 'Dana', icon: '🔵' },
            { name: 'ShopeePay', icon: '🟠' },
            { name: 'LinkAja', icon: '🔴' },
          ];

          const userAccounts = stmts.getAccounts.all(user.id);
          const activeNames = new Set(userAccounts.map(a => a.name.toLowerCase()));

          let list = '🏦 *Sumber Dana & Rekening*\n\n─────────────────\n';
          for (const acc of commonAccounts) {
            const isActive = activeNames.has(acc.name.toLowerCase());
            const check = isActive ? '✅' : '⬜';
            list += `${check} ${acc.icon} ${acc.name}\n`;
          }
          list += '─────────────────\n';
          list += '✅ = sudah aktif | ⬜ = belum aktif\n\n';
          list += 'Untuk mengaktifkan:\n`aktifkan GoPay 500rb`';

          reply = list;
          break;
        }

        case 'list_reminders': {
          const reminders = stmts.getReminders.all(user.id);
          if (reminders.length === 0) {
            reply = '🔔 Belum ada pengingat.\n\nBuat pengingat:\n`ingatkan tagihan listrik tiap tgl 1`';
          } else {
            let list = '🔔 *Daftar Pengingat*\n\n─────────────────\n';
            for (let i = 0; i < reminders.length; i++) {
              const r = reminders[i];
              const amt = r.amount ? ` ${formatRupiah(r.amount)}` : '';
              list += `${i + 1}. ${r.title}${amt} — Tgl ${r.due_day}\n`;
            }
            list += '─────────────────\n';
            list += 'Hapus pengingat:\n`hapus pengingat [nomor]`';
            reply = list;
          }
          break;
        }

        case 'add_reminder': {
          stmts.createReminder.run(user.id, parsed.title, parsed.amount || null, parsed.dueDay);
          reply = `🔔 *Pengingat berhasil dibuat!*

─────────────────
*Detail Pengingat*
Judul      ${parsed.title}
Tanggal    Tiap tgl ${parsed.dueDay}
${parsed.amount ? `Jumlah     ${formatRupiah(parsed.amount)}` : ''}
─────────────────

Ketik \`pengingat\` untuk melihat semua pengingat.`;
          break;
        }

        case 'today_report': {
          const now = new Date();
          const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
          const todayStr = wib.toISOString().slice(0, 10);
          
          const txns = stmts.getTransactionsByDateRange.all(user.id, todayStr, todayStr);
          reply = safeFormatDailyReport(txns);
          break;
        }

        case 'week_report': {
          const now = new Date();
          const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
          
          // Monday of current week
          const day = wib.getDay();
          const diff = wib.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(wib.setDate(diff));
          const mondayStr = monday.toISOString().slice(0, 10);
          const todayStr = new Date(now.getTime() + (7 * 60 * 60 * 1000)).toISOString().slice(0, 10);
          
          const txns = stmts.getTransactionsByDateRange.all(user.id, mondayStr, todayStr);
          reply = safeFormatWeeklyReport(txns);
          break;
        }

        case 'month_report': {
          const now = new Date();
          const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
          const firstDayStr = `${wib.getFullYear()}-${String(wib.getMonth() + 1).padStart(2, '0')}-01`;
          const todayStr = wib.toISOString().slice(0, 10);
          
          const txns = stmts.getTransactionsByDateRange.all(user.id, firstDayStr, todayStr);
          reply = safeFormatMonthlyReport(txns);
          break;
        }

        case 'history': {
          const txns = stmts.getRecentTransactions.all(user.id, 5);
          reply = safeFormatHistory(txns);
          break;
        }

        case 'delete_reminder': {
          const reminder = stmts.getReminderByNumber.get(user.id, parsed.reminderNumber - 1);
          if (!reminder) {
            reply = `❌ Pengingat nomor ${parsed.reminderNumber} tidak ditemukan.\n\nKetik \`pengingat\` untuk melihat daftar.`;
          } else {
            stmts.deleteReminder.run(reminder.id, user.id);
            reply = `✅ Pengingat *"${reminder.title}"* berhasil dihapus.`;
          }
          break;
        }

        case 'list_categories': {
          const categories = {
            makanan: ['makan', 'minum', 'kopi', 'nasi', 'ayam', 'bakso', 'sate', 'martabak'],
            transportasi: ['grab', 'gojek', 'bensin', 'parkir', 'tol', 'ojol'],
            kesehatan: ['dokter', 'obat', 'rumah sakit', 'klinik', 'vitamin'],
            tagihan: ['listrik', 'air', 'internet', 'wifi', 'pulsa', 'cicilan', 'kos'],
            hiburan: ['nonton', 'bioskop', 'game', 'konser', 'tiket', 'liburan'],
            belanja: ['beli', 'belanja', 'mall', 'supermarket', 'tokopedia', 'shopee'],
            pendidikan: ['buku', 'sekolah', 'kuliah', 'kursus', 'les'],
            lainnya: ['lainnya', 'other'],
          };

          const catNames = {
            makanan: '🍜 Makanan & Minuman',
            transportasi: '🚗 Transportasi',
            kesehatan: '💊 Kesehatan',
            tagihan: '📋 Tagihan & Utilitas',
            hiburan: '🎬 Hiburan',
            belanja: '🛍️ Belanja',
            pendidikan: '📚 Pendidikan',
            lainnya: '📦 Lainnya',
          };

          let list = '📂 *Daftar Kategori*\n\n─────────────────\n';
          for (const [key, keywords] of Object.entries(categories)) {
            list += `*${catNames[key]}*\n`;
            list += `Kata kunci: ${keywords.slice(0, 5).join(', ')}\n\n`;
          }
          list += '─────────────────\n';
          list += 'Paksa kategori dengan #contoh:\n`keluar 50rb hadiah #hiburan`';

          reply = list;
          break;
        }

        case 'profile': {
          const txnCount = stmts.getTransactions.all(user.id, 999999).length;
          const accs = stmts.getAccounts.all(user.id);

          reply = `👤 *Profil Pengguna*

─────────────────
Nomor      ${senderPhone}
Transaksi  ${txnCount} total
Rekening   ${accs.length} aktif
─────────────────
🆔 ID Dashboard:
\`${senderPhone}\`

Dashboard: http://119.28.110.163:8077`;
          break;
        }

        case 'dashboard_info': {
          reply = `🌐 *Dashboard UangKu*

─────────────────
🌐 URL: http://119.28.110.163:8077

*Cara Login:*
1. Buka URL di browser
2. Masukkan ID Anda (ketik \`/id\` untuk cek)
3. Klik Login

*Fitur Dashboard:*
📊 Laporan & grafik lengkap
📥 Export CSV
🏦 Kelola rekening
💰 Atur budget
─────────────────`;
          break;
        }

        case 'batch_transactions': {
          let successCount = 0;
          let failCount = 0;
          let results = [];

          for (const line of parsed.lines) {
            const lineParsed = parseMessage(line.trim());
            if (lineParsed.command === 'add_transaction') {
              let accId = null;
              // Update account if specified
              if (lineParsed.accountName) {
                const acc = stmts.getAccountByName.get(user.id, lineParsed.accountName);
                if (acc) {
                  accId = acc.id;
                  const delta = lineParsed.type === 'keluar' ? -lineParsed.amount : lineParsed.amount;
                  stmts.updateAccountBalance.run(delta, acc.id);
                }
              }

              stmts.addTransaction.run(
                user.id, lineParsed.type, lineParsed.amount,
                lineParsed.title, lineParsed.category, lineParsed.date, lineParsed.time, accId
              );

              const emoji = lineParsed.type === 'keluar' ? '🔴' : '🟢';
              results.push(`${emoji} ${formatRupiah(lineParsed.amount)} — ${lineParsed.title}`);
              successCount++;
            } else {
              results.push(`❌ ${line.trim()}`);
              failCount++;
            }
          }

          reply = `📝 *Batch Transaksi*

─────────────────
${results.join('\n')}
─────────────────
Berhasil: ${successCount}
${failCount > 0 ? `Gagal: ${failCount}\n` : ''}
Salah? Ketik *batal* untuk hapus transaksi terakhir.`;
          break;
        }

        case 'update_balance': {
          const acc = stmts.getAccountByName.get(user.id, parsed.accountName);
          if (!acc) {
            reply = `❌ Rekening *"${parsed.accountName}"* tidak ditemukan.\n\nKetik \`sumber dana\` untuk lihat daftar rekening.`;
          } else {
            stmts.updateAccountBalance.run(parsed.amount, acc.id);
            const refreshed = stmts.getAccountByName.get(user.id, parsed.accountName);
            reply = `✅ *Saldo awal berhasil diatur!*

─────────────────
Rekening   ${acc.name}
Saldo      ${formatRupiah(refreshed.balance)}
─────────────────`;
          }
          break;
        }

        case 'list_debts': {
          const debts = stmts.getDebts.all(user.id, 'active');
          const receivables = stmts.getDebts.all(user.id, 'active');
          const debtList = debts.filter(d => d.type === 'debt');
          const recvList = debts.filter(d => d.type === 'receivable');
          
          let msg = '💳 *Hutang & Cicilan*\n\n─────────────────\n';
          
          if (debtList.length > 0) {
            msg += '*Hutang: *\n';
            for (const d of debtList) {
              const inst = d.installment_amount > 0 ? formatRupiah(d.installment_amount) : '-';
              const tenor = d.tenor > 1 ? ` (${d.tenor}x)` : '';
              const due = d.due_day > 0 ? ` — Tgl ${d.due_day}` : '';
              msg += `• ${d.name}: ${formatRupiah(d.total_amount)} | Cicil: ${inst}${tenor}${due}\n`;
            }
            msg += '\n';
          }
          
          if (recvList.length > 0) {
            msg += '*Piutang: *\n';
            for (const d of recvList) {
              msg += `• ${d.name}: ${formatRupiah(d.total_amount)}\n`;
            }
            msg += '\n';
          }
          
          if (debtList.length === 0 && recvList.length === 0) {
            msg += 'Belum ada hutang atau piutang tercatat.\n\n';
            msg += 'Tambah:\n';
            msg += '`hutang baru Kredivo 12jt 1.2jt 10x tgl 5`\n';
            msg += '`utang Andi 500rb`\n';
            msg += '`piutang Budi 300rb`\n';
          }
          
          msg += '─────────────────\n';
          msg += 'Bayar: `bayar hutang Kredivo 1.2jt`';
          reply = msg;
          break;
        }

        case 'add_debt': {
          stmts.createDebt.run(
            user.id, parsed.name, parsed.total,
            parsed.installment, parsed.tenor, parsed.dueDay, 'debt'
          );
          
          let msg = `💳 *Hutang baru tercatat!*\n\n─────────────────\n`;
          msg += `Nama      ${parsed.name}\n`;
          msg += `Total     ${formatRupiah(parsed.total)}\n`;
          msg += `Cicilan   ${formatRupiah(parsed.installment)}\n`;
          if (parsed.tenor > 1) msg += `Tenor     ${parsed.tenor}x\n`;
          if (parsed.dueDay > 0) msg += `Jatuh Tmp Tgl ${parsed.dueDay}\n`;
          msg += `─────────────────\n`;
          msg += `Ketik \`bayar hutang ${parsed.name} 1.2jt\` untuk bayar cicilan.`;
          reply = msg;
          break;
        }

        case 'add_single_debt': {
          stmts.createDebt.run(
            user.id, parsed.name, parsed.amount,
            parsed.amount, 1, 0, parsed.type
          );
          
          const typeLabel = parsed.type === 'debt' ? 'Hutang' : 'Piutang';
          reply = `💳 *${typeLabel} tercatat!*\n\n─────────────────\nNama      ${parsed.name}\nJumlah    ${formatRupiah(parsed.amount)}\n─────────────────\n`;
          
          if (parsed.type === 'debt') {
            reply += `Ketik \`bayar hutang ${parsed.name} ${parsed.amount}\` untuk lunasi.`;
          } else {
            reply += `Jika sudah dibayar, catat sebagai: \`masuk ${parsed.amount} piutang ${parsed.name}\``;
          }
          break;
        }

        case 'pay_debt': {
          const debt = stmts.getDebtByName.get(user.id, parsed.name);
          if (!debt) {
            reply = `❌ Hutang *"${parsed.name}"* tidak ditemukan atau sudah lunas.\n\nKetik \`hutang\` untuk lihat daftar.`;
            break;
          }
          
          const now = new Date();
          const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
          const dateStr = wib.toISOString().slice(0, 10);
          
          // Record payment
          stmts.addDebtPayment.run(debt.id, parsed.amount, dateStr, 'payment');
          
          // Also deduct from account if specified
          if (parsed.accountName) {
            const acc = stmts.getAccountByName.get(user.id, parsed.accountName);
            if (acc) {
              stmts.updateAccountBalance.run(-parsed.amount, acc.id);
            }
          }
          
          // Calculate total paid
          const payments = stmts.getDebtPayments.all(debt.id);
          const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
          const remaining = debt.total_amount - totalPaid;
          
          if (remaining <= 0) {
            stmts.markDebtPaid.run(debt.id, user.id);
            reply = `🎉 *Hutang lunas!*\n\n─────────────────\n${debt.name}\nTotal Dibayar: ${formatRupiah(debt.total_amount)}\n─────────────────`;
          } else {
            reply = `✅ *Pembayaran tercatat*\n\n─────────────────\nHutang    ${debt.name}\nBayar     ${formatRupiah(parsed.amount)}\nSisa      ${formatRupiah(remaining)}\n─────────────────`;
          }
          break;
        }

        case 'add_account': {
          stmts.createAccount.run(user.id, parsed.accountName, parsed.balance);
          const allAccounts = stmts.getAccounts.all(user.id);
          const totalBal = allAccounts.reduce((s, a) => s + a.balance, 0);
          
          let accList = '';
          for (const a of allAccounts) {
            accList += `${a.name.padEnd(15)} ${formatRupiah(a.balance).padStart(12)}\n`;
          }
          
          reply = `🏦 *Rekening berhasil ditambahkan!*

─────────────────
*Detail Rekening*
Nama       ${parsed.accountName}
Saldo      Rp ${parsed.balance.toLocaleString('id-ID')}

─────────────────
*Semua Rekening*
${accList}
─────────────────
Total Saldo *${formatRupiah(totalBal)}*`;
          break;
        }
        
        case 'accounts': {
          const accounts = stmts.getAccounts.all(user.id);
          if (accounts.length === 0) {
            reply = '🏦 Belum ada rekening.\nBuat rekening dari dashboard PWA.';
          } else {
            reply = '🏦 *Daftar Rekening:*\n\n';
            for (const acc of accounts) {
              reply += `• ${acc.name}: ${formatRupiah(acc.balance)}\n`;
            }
          }
          break;
        }
        
        case 'unknown':
        default: {
          reply = `❌ Format tidak dikenali.\n\nContoh:\n• \`keluar 50rb makan siang\`\n• \`masuk 5jt gaji\`\n• \`bantuan\` untuk panduan lengkap`;
          break;
        }
      }
      
      await sock.sendMessage(sender, { text: reply });
      
    } catch (err) {
      console.error('Error processing message:', err);
      await sock.sendMessage(sender, { 
        text: '❌ Terjadi kesalahan. Coba lagi atau ketik \`bantuan\` untuk panduan.' 
      });
    }
  });
}

console.log('🚀 Starting UangKu WhatsApp Bot...');
startBot().catch(err => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});
