
import cron from 'node-cron';
import { db, stmts } from './db.js';
import { formatRupiah } from './parser.js';

export function startReminderCron(sock) {
  // Run everyday at 09:00 WIB (02:00 UTC)
  // "0 2 * * *"
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Checking daily reminders...');
    try {
      const now = new Date();
      // Adjust to WIB just to get the current date
      const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const currentDay = wib.getDate();
      
      // Get all active reminders due today
      const reminders = db.prepare('SELECT * FROM reminders WHERE active = 1 AND due_day = ?').all(currentDay);
      console.log(`[CRON] Found ${reminders.length} reminders for day ${currentDay}`);
      
      for (const r of reminders) {
        // We need the user's phone number to send the message
        // In our DB, user phone is stored in `users` table
        const user = db.prepare('SELECT phone FROM users WHERE id = ?').get(r.user_id);
        if (user && user.phone) {
          const jid = `${user.phone}@s.whatsapp.net`; // basic jid format
          
          let msg = `⏰ *PENGINGAT HARI INI*\n\n─────────────────\n`;
          msg += `Judul   : ${r.title}\n`;
          if (r.amount) {
            msg += `Jumlah  : ${formatRupiah(r.amount)}\n`;
          }
          msg += `─────────────────\n`;
          msg += `Jangan lupa dibayar/dicatat ya!\n`;
          
          if (r.amount) {
            msg += `Ketik: \`keluar ${r.amount} ${r.title}\``;
          }
          
          await sock.sendMessage(jid, { text: msg });
          console.log(`[CRON] Sent reminder to ${user.phone}`);
        }
      }
    } catch (err) {
      console.error('[CRON] Error running reminders:', err);
    }
  });
  console.log('[CRON] Reminder scheduler started.');
}
