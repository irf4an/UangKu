import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'wafin.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    workspace_name TEXT DEFAULT 'My Wallet',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('masuk', 'keluar')),
    amount INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'lainnya',
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    limit_amount INTEGER NOT NULL,
    month TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category, month),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    monthly_amount INTEGER NOT NULL,
    remaining_amount INTEGER NOT NULL,
    due_day INTEGER NOT NULL,
    status TEXT DEFAULT 'belum' CHECK(status IN ('lunas', 'belum')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    balance INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount INTEGER,
    due_day INTEGER NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Prepared statements
const stmts = {
  // Users
  getUserByPhone: db.prepare('SELECT * FROM users WHERE phone = ?'),
  createUser: db.prepare('INSERT INTO users (phone, name) VALUES (?, ?)'),
  
  // Transactions
  getTransactions: db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, time DESC LIMIT ?'),
  getTransactionsByMonth: db.prepare("SELECT * FROM transactions WHERE user_id = ? AND date LIKE ? ORDER BY date DESC, time DESC"),
  getTransactionsByDateRange: db.prepare('SELECT * FROM transactions WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, time DESC'),
  getRecentTransactions: db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT ?'),
  addTransaction: db.prepare('INSERT INTO transactions (user_id, type, amount, title, category, date, time, account_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  getTransactionsByAccount: db.prepare("SELECT * FROM transactions WHERE user_id = ? AND account_id = ? ORDER BY date DESC, time DESC LIMIT ?"),
  deleteLastTransaction: db.prepare('DELETE FROM transactions WHERE id = (SELECT id FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 1)'),
  getMonthlySummary: db.prepare(`
    SELECT 
      type,
      SUM(amount) as total,
      COUNT(*) as count
    FROM transactions 
    WHERE user_id = ? AND date LIKE ?
    GROUP BY type
  `),
  getCategoryBreakdown: db.prepare(`
    SELECT category, SUM(amount) as total
    FROM transactions
    WHERE user_id = ? AND type = 'keluar' AND date LIKE ?
    GROUP BY category
    ORDER BY total DESC
  `),

  // Budgets
  getBudgets: db.prepare('SELECT * FROM budgets WHERE user_id = ? AND month = ?'),
  setBudget: db.prepare('INSERT OR REPLACE INTO budgets (user_id, category, limit_amount, month) VALUES (?, ?, ?, ?)'),
  getBudgetByCategory: db.prepare('SELECT * FROM budgets WHERE user_id = ? AND category = ? AND month = ?'),

  // Accounts
  getAccounts: db.prepare('SELECT * FROM accounts WHERE user_id = ?'),
  createAccount: db.prepare('INSERT INTO accounts (user_id, name, balance) VALUES (?, ?, ?)'),
  updateBalance: db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?'),
  // New: get account by fuzzy name match (case-insensitive LIKE)
  getAccountByName: db.prepare("SELECT * FROM accounts WHERE user_id = ? AND LOWER(name) LIKE '%' || LOWER(?) || '%'"),
  // New: update account balance by account_id (absolute set, or +/- delta)
  updateAccountBalance: db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?'),
  updateTransactionAccount: db.prepare('UPDATE transactions SET account_id = ? WHERE id = ? AND user_id = ?'),
  getTransactionById: db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?'),

  // Reminders
  createReminder: db.prepare('INSERT INTO reminders (user_id, title, amount, due_day) VALUES (?, ?, ?, ?)'),
  getReminders: db.prepare('SELECT * FROM reminders WHERE user_id = ? AND active = 1 ORDER BY due_day ASC'),
  deleteReminder: db.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?'),
  getReminderByNumber: db.prepare('SELECT * FROM reminders WHERE user_id = ? AND active = 1 ORDER BY due_day ASC LIMIT 1 OFFSET ?'),

  // Debts
  getDebts: db.prepare('SELECT * FROM debts WHERE user_id = ? AND status = ? ORDER BY id DESC'),
  getAllDebts: db.prepare('SELECT * FROM debts WHERE user_id = ? ORDER BY id DESC'),
  getDebtByName: db.prepare("SELECT * FROM debts WHERE user_id = ? AND LOWER(name) LIKE '%' || LOWER(?) || '%' AND status = 'active'"),
  createDebt: db.prepare('INSERT INTO debts (user_id, name, total_amount, installment_amount, tenor, due_day, type) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  deleteDebt: db.prepare('DELETE FROM debts WHERE id = ? AND user_id = ?'),
  markDebtPaid: db.prepare("UPDATE debts SET status = 'paid' WHERE id = ? AND user_id = ?"),
  addDebtPayment: db.prepare('INSERT INTO debt_payments (debt_id, amount, date, type) VALUES (?, ?, ?, ?)'),
  getDebtPayments: db.prepare('SELECT * FROM debt_payments WHERE debt_id = ? ORDER BY date DESC'),

  // Delete transaction by number (1-indexed, most recent first)
  getTransactionByNumber: db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 1 OFFSET ?'),
  deleteTransactionById: db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?'),
};

export { db, stmts };
