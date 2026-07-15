import http from 'http';
import { db, stmts } from './db.js';

// Flexible user lookup - handles phone, @lid, and format variations
function findUser(phone) {
  // Try exact match first
  let user = stmts.getUserByPhone.get(phone);
  if (user) return user;
  
  // Try with @lid suffix
  user = stmts.getUserByPhone.get(phone + '@lid');
  if (user) return user;
  
  // Try without @lid suffix
  if (phone.endsWith('@lid')) {
    user = stmts.getUserByPhone.get(phone.replace('@lid', ''));
    if (user) return user;
  }
  
  // Try common phone format variations
  const cleaned = phone.replace(/\D/g, '');
  const variations = new Set();
  if (cleaned) variations.add(cleaned);
  if (cleaned.startsWith('0')) variations.add('62' + cleaned.slice(1));
  if (cleaned.startsWith('62')) variations.add('0' + cleaned.slice(2));
  
  for (const v of variations) {
    user = stmts.getUserByPhone.get(v);
    if (user) return user;
    user = stmts.getUserByPhone.get(v + '@lid');
    if (user) return user;
  }
  
  // Last resort: fuzzy match - find any user whose phone contains the same digits
  const inputDigits = cleaned.replace(/^62/, '0').replace(/^0/, '');
  if (inputDigits.length >= 8) {
    const allUsers = db.prepare('SELECT * FROM users').all();
    for (const u of allUsers) {
      const storedDigits = u.phone.replace(/\D/g, '').replace(/^62/, '0').replace(/^0/, '');
      if (storedDigits === inputDigits || storedDigits.endsWith(inputDigits.slice(-8))) {
        return u;
      }
    }
  }
  
  return null;
}

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

export function createApiRoutes() {
  return async (req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    console.log(`[API] ${req.method} ${path}`);

    // GET /api/user/:phone
    if (req.method === 'GET' && path.match(/^\/api\/user\/.+$/)) {
      const phone = path.split('/').pop();
      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);
      return jsonResponse(res, user);
    }

    // PUT /api/user/workspace?phone=xxx
    if (req.method === 'PUT' && path === '/api/user/workspace') {
      const phone = url.searchParams.get('phone');
      if (!phone) return jsonResponse(res, { error: 'phone required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { workspace } = JSON.parse(body);
          if (!workspace || workspace.length > 30) {
            return jsonResponse(res, { error: 'Invalid workspace name' }, 400);
          }
          db.prepare('UPDATE users SET workspace_name = ? WHERE id = ?').run(workspace, user.id);
          return jsonResponse(res, { success: true, workspace });
        } catch (e) {
          return jsonResponse(res, { error: 'Invalid JSON' }, 400);
        }
      });
      return;
    }

    // GET /api/transactions?phone=xxx&month=2026-07&limit=50
    if (req.method === 'GET' && path === '/api/transactions') {
      const phone = url.searchParams.get('phone');
      const month = url.searchParams.get('month');
      const limit = parseInt(url.searchParams.get('limit') || '100');

      if (!phone) return jsonResponse(res, { error: 'phone required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      let transactions;
      if (month) {
        transactions = stmts.getTransactionsByMonth.all(user.id, month + '%');
      } else {
        transactions = stmts.getTransactions.all(user.id, limit);
      }

      return jsonResponse(res, { transactions, user: { id: user.id, name: user.name, workspace: user.workspace_name } });
    }

    // DELETE /api/transactions/:id?phone=xxx
    if (req.method === 'DELETE' && path.match(/^\/api\/transactions\/\d+$/)) {
      const id = parseInt(path.split('/').pop());
      const phone = url.searchParams.get('phone');
      if (!phone) return jsonResponse(res, { error: 'phone required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      const txn = stmts.getTransactionById.get(id, user.id);
      if (!txn) return jsonResponse(res, { error: 'Transaction not found' }, 404);

      // Reverse account balance before deleting
      if (txn.account_id) {
        const reversal = txn.type === 'keluar' ? txn.amount : -txn.amount;
        stmts.updateAccountBalance.run(reversal, txn.account_id);
      }

      // Check if this transaction is linked to a debt payment
      const dbtPayment = db.prepare('SELECT * FROM debt_payments WHERE transaction_id = ?').get(id);
      if (dbtPayment) {
        // Delete the debt payment
        db.prepare('DELETE FROM debt_payments WHERE id = ?').run(dbtPayment.id);
        
        // Re-active the debt status if it was set to paid
        db.prepare("UPDATE debts SET status = 'active' WHERE id = ?").run(dbtPayment.debt_id);
      }

      stmts.deleteTransactionById.run(id, user.id);
      return jsonResponse(res, { success: true, message: 'Transaction deleted' });
    }

    // GET /api/summary?phone=xxx&month=2026-07
    if (req.method === 'GET' && path === '/api/summary') {
      const phone = url.searchParams.get('phone');
      const month = url.searchParams.get('month');

      if (!phone || !month) return jsonResponse(res, { error: 'phone and month required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      const summary = stmts.getMonthlySummary.all(user.id, month + '%');
      const categories = stmts.getCategoryBreakdown.all(user.id, month + '%');
      const budgets = stmts.getBudgets.all(user.id, month);

      const masuk = summary.find(s => s.type === 'masuk')?.total || 0;
      const keluar = summary.find(s => s.type === 'keluar')?.total || 0;

      return jsonResponse(res, {
        month,
        masuk,
        keluar,
        neto: masuk - keluar,
        transaction_count: summary.reduce((acc, s) => acc + s.count, 0),
        categories,
        budgets,
      });
    }

    // GET /api/budgets?phone=xxx&month=2026-07
    if (req.method === 'GET' && path === '/api/budgets') {
      const phone = url.searchParams.get('phone');
      const month = url.searchParams.get('month');

      if (!phone || !month) return jsonResponse(res, { error: 'phone and month required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      const budgets = stmts.getBudgets.all(user.id, month);
      const categories = stmts.getCategoryBreakdown.all(user.id, month + '%');

      // Calculate daily safe budget
      const now = new Date();
      const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const currentDay = wib.getDate();
      const daysInMonth = new Date(wib.getFullYear(), wib.getMonth() + 1, 0).getDate();
      const remainingDays = daysInMonth - currentDay;

      const totalLimit = budgets.reduce((acc, b) => acc + b.limit_amount, 0);
      const totalSpent = budgets.reduce((acc, b) => {
        const spent = categories.find(c => c.category === b.category)?.total || 0;
        return acc + spent;
      }, 0);
      const remainingBudget = totalLimit - totalSpent;
      const dailySafe = remainingDays > 0 ? Math.max(0, Math.round(remainingBudget / remainingDays)) : 0;

      const budgetDetails = budgets.map(b => {
        const spent = categories.find(c => c.category === b.category)?.total || 0;
        const ratio = b.limit_amount > 0 ? spent / b.limit_amount : 0;
        const dailyLimit = remainingDays > 0 && (b.limit_amount - spent) > 0
          ? Math.round((b.limit_amount - spent) / remainingDays) : 0;

        return {
          category: b.category,
          limit: b.limit_amount,
          spent,
          remaining: Math.max(0, b.limit_amount - spent),
          percentage: Math.min(100, Math.round(ratio * 100)),
          status: ratio >= 0.9 ? 'danger' : ratio >= 0.7 ? 'warning' : 'safe',
          dailyLimit,
        };
      });

      return jsonResponse(res, {
        month,
        dailySafeBudget: dailySafe,
        remainingDays,
        totalLimit,
        totalSpent,
        remainingBudget,
        budgets: budgetDetails,
      });
    }

    // GET /api/installments?phone=xxx
    if (req.method === 'GET' && path === '/api/installments') {
      const phone = url.searchParams.get('phone');
      if (!phone) return jsonResponse(res, { error: 'phone required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      const installments = db.prepare('SELECT * FROM installments WHERE user_id = ? ORDER BY due_day ASC').all(user.id);
      const activeTotal = installments.filter(i => i.status === 'belum').reduce((acc, i) => acc + i.remaining_amount, 0);

      return jsonResponse(res, { installments, activeTotal, activeCount: installments.filter(i => i.status === 'belum').length });
    }

    // GET /api/accounts?phone=xxx
    if (req.method === 'GET' && path === '/api/accounts') {
      const phone = url.searchParams.get('phone');
      if (!phone) return jsonResponse(res, { error: 'phone required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      const accounts = stmts.getAccounts.all(user.id);
      const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

      return jsonResponse(res, { accounts, totalBalance });
    }
    
    // GET /api/debts?phone=xxx
    if (req.method === 'GET' && path === '/api/debts') {
      const phone = url.searchParams.get('phone');
      if (!phone) return jsonResponse(res, { error: 'phone required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      const debts = stmts.getAllDebts.all(user.id);
      
      // Get payments for each debt
      const debtsWithPayments = debts.map(d => {
        const payments = stmts.getDebtPayments.all(d.id);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        return {
          ...d,
          payments,
          total_paid: totalPaid,
          remaining_amount: d.total_amount - totalPaid
        };
      });

      return jsonResponse(res, { debts: debtsWithPayments });
    }

    // POST /api/debts?phone=xxx
    if (req.method === 'POST' && path === '/api/debts') {
      const phone = url.searchParams.get('phone');
      if (!phone) return jsonResponse(res, { error: 'phone required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.name || !data.total_amount) {
            return jsonResponse(res, { error: 'name and total_amount required' }, 400);
          }
          
          stmts.createDebt.run(
            user.id, data.name, Number(data.total_amount),
            Number(data.installment_amount || data.total_amount),
            Number(data.tenor || 1), Number(data.due_day || 0), data.type || 'debt'
          );
          return jsonResponse(res, { success: true, message: 'Debt created' }, 201);
        } catch (e) {
          return jsonResponse(res, { error: 'Invalid JSON' }, 400);
        }
      });
      return;
    }

    // POST /api/debts/pay?phone=xxx
    if (req.method === 'POST' && path === '/api/debts/pay') {
      const phone = url.searchParams.get('phone');
      if (!phone) return jsonResponse(res, { error: 'phone required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.debt_id || !data.amount) {
            return jsonResponse(res, { error: 'debt_id and amount required' }, 400);
          }
          
          const debt = db.prepare('SELECT * FROM debts WHERE id = ? AND user_id = ?').get(data.debt_id, user.id);
          if (!debt) return jsonResponse(res, { error: 'Debt not found' }, 404);
          
          const now = new Date();
          const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
          const dateStr = wib.toISOString().slice(0, 10);
          const timeStr = wib.toISOString().slice(11, 16);
          
          // Record payment as 'keluar' transaction for reporting/summary features
          const txRes = stmts.addTransaction.run(user.id, 'keluar', Number(data.amount), `Bayar Cicilan: ${debt.name}`, 'lainnya', dateStr, timeStr, data.account_id || null);
          const txId = txRes.lastInsertRowid;
          
          // Record payment with transaction_id link
          db.prepare('INSERT INTO debt_payments (debt_id, amount, date, type, transaction_id) VALUES (?, ?, ?, ?, ?)')
            .run(debt.id, Number(data.amount), dateStr, 'payment', txId);

          // Deduct from account if account_id is specified
          if (data.account_id) {
            const acc = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(data.account_id, user.id);
            if (acc) {
              stmts.updateAccountBalance.run(-Number(data.amount), acc.id);
            }
          }
          
          // Check if fully paid
          const payments = stmts.getDebtPayments.all(debt.id);
          const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
          if (totalPaid >= debt.total_amount) {
            stmts.markDebtPaid.run(debt.id, user.id);
          }
          
          return jsonResponse(res, { success: true, message: 'Payment recorded' });
        } catch (e) {
          return jsonResponse(res, { error: 'Invalid JSON' }, 400);
        }
      });
      return;
    }
    // POST /api/accounts?phone=xxx
    if (req.method === 'POST' && path === '/api/accounts') {
      const phone = url.searchParams.get('phone');
      if (!phone) return jsonResponse(res, { error: 'phone required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.name || data.balance === undefined) {
            return jsonResponse(res, { error: 'name and balance required' }, 400);
          }
          
          stmts.createAccount.run(user.id, data.name, Number(data.balance));
          return jsonResponse(res, { success: true, message: 'Account created' }, 201);
        } catch (e) {
          return jsonResponse(res, { error: 'Invalid JSON' }, 400);
        }
      });
      return;
    }


    // GET /api/sinking-funds?phone=xxx
    if (req.method === 'GET' && path === '/api/sinking-funds') {
      const phone = url.searchParams.get('phone');
      if (!phone) return jsonResponse(res, { error: 'phone required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      const funds = db.prepare('SELECT * FROM sinking_funds WHERE user_id = ?').all(user.id);
      return jsonResponse(res, { funds });
    }

    // GET /api/export/csv?phone=xxx&month=2026-07
    if (req.method === 'GET' && path === '/api/export/csv') {
      const phone = url.searchParams.get('phone');
      const month = url.searchParams.get('month');

      if (!phone) return jsonResponse(res, { error: 'phone required' }, 400);

      const user = findUser(phone);
      if (!user) return jsonResponse(res, { error: 'User not found' }, 404);

      let transactions;
      if (month) {
        transactions = stmts.getTransactionsByMonth.all(user.id, month + '%');
      } else {
        transactions = stmts.getTransactions.all(user.id, 1000);
      }

      // Build CSV
      let csv = 'Tanggal,Waktu,Tipe,Kategori,Keterangan,Nominal\n';
      for (const tx of transactions) {
        csv += `${tx.date},${tx.time},${tx.type},${tx.category},"${tx.title}",${tx.amount}\n`;
      }

      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="uangku-${month || 'all'}.csv"`,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(csv);
      return;
    }

    // GET /api/health
    if (req.method === 'GET' && path === '/api/health') {
      return jsonResponse(res, { status: 'ok', timestamp: new Date().toISOString() });
    }

    // 404
    jsonResponse(res, { error: 'Not found' }, 404);
  };
}
