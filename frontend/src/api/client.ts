// API Client for connecting PWA to WhatsApp bot backend
const API_BASE = 'http://119.28.110.163:3000/api';

// Default user phone - will be set after login
let userPhone = localStorage.getItem('uangku_phone') || '';

export function setPhone(phone: string) {
  userPhone = phone;
  localStorage.setItem('uangku_phone', phone);
}

export function getPhone(): string {
  return userPhone;
}

async function apiFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (userPhone) url.searchParams.set('phone', userPhone);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Types matching the API responses
export interface ApiTransaction {
  id: number;
  user_id: number;
  type: 'masuk' | 'keluar';
  amount: number;
  title: string;
  category: string;
  date: string;
  time: string;
}

export interface ApiTransactionsResponse {
  transactions: ApiTransaction[];
  user: { id: number; name: string; workspace: string };
}

export interface ApiCategoryBreakdown {
  category: string;
  total: number;
}

export interface ApiBudgetDetail {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
  dailyLimit: number;
}

export interface ApiSummaryResponse {
  month: string;
  masuk: number;
  keluar: number;
  neto: number;
  transaction_count: number;
  categories: ApiCategoryBreakdown[];
  budgets: Array<{ category: string; limit_amount: number }>;
}

export interface ApiBudgetsResponse {
  month: string;
  dailySafeBudget: number;
  remainingDays: number;
  totalLimit: number;
  totalSpent: number;
  remainingBudget: number;
  budgets: ApiBudgetDetail[];
}

export interface ApiInstallment {
  id: number;
  user_id: number;
  name: string;
  total_amount: number;
  monthly_amount: number;
  remaining_amount: number;
  due_day: number;
  status: 'lunas' | 'belum';
}

export interface ApiInstallmentsResponse {
  installments: ApiInstallment[];
  activeTotal: number;
  activeCount: number;
}

export interface ApiDebt {
  id: number;
  user_id: string;
  name: string;
  total_amount: number;
  installment_amount: number;
  tenor: number;
  due_day: number;
  type: 'debt' | 'receivable';
  status: 'active' | 'paid';
  payments?: Array<{
    id: number;
    debt_id: number;
    amount: number;
    date: string;
    type: 'payment' | 'penalty';
  }>;
  total_paid?: number;
  remaining_amount?: number;
}

export interface ApiDebtsResponse {
  debts: ApiDebt[];
}

export interface ApiSinkingFund {
  id: number;
  user_id: number;
  target_name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string;
}

export interface ApiSinkingFundsResponse {
  funds: ApiSinkingFund[];
}

export interface ApiAccount {
  id: number;
  user_id: number;
  name: string;
  balance: number;
}

export interface ApiAccountsResponse {
  accounts: ApiAccount[];
  totalBalance: number;
}

// API functions
export async function fetchTransactions(month?: string, limit?: number): Promise<ApiTransactionsResponse> {
  const params: Record<string, string> = {};
  if (month) params.month = month;
  if (limit) params.limit = limit.toString();
  return apiFetch('/transactions', params);
}

export async function fetchSummary(month: string): Promise<ApiSummaryResponse> {
  return apiFetch('/summary', { month });
}

export async function fetchBudgets(month: string): Promise<ApiBudgetsResponse> {
  return apiFetch('/budgets', { month });
}

export async function fetchInstallments(): Promise<ApiInstallmentsResponse> {
  return apiFetch('/installments');
}

export async function fetchDebts(): Promise<ApiDebtsResponse> {
  return apiFetch('/debts');
}

export async function fetchAccounts(): Promise<ApiAccountsResponse> {
  return apiFetch('/accounts');
}

export async function fetchSinkingFunds(): Promise<ApiSinkingFundsResponse> {
  return apiFetch('/sinking-funds');
}

export async function deleteTransaction(id: number): Promise<{ success: boolean }> {
  const phone = getPhone();
  const url = `${API_BASE}/transactions/${id}?phone=${encodeURIComponent(phone)}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Helper: get current month in YYYY-MM format
export function getCurrentMonth(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return wib.toISOString().slice(0, 7);
}

// Helper: format currency
export function formatIDR(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}
