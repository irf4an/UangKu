import { useState, useEffect, useCallback } from 'react';
import {
  fetchTransactions, fetchSummary, fetchBudgets,
  fetchInstallments, fetchAccounts, fetchDebts, fetchSinkingFunds,
  getCurrentMonth, getPhone, setPhone as setApiPhone,
  type ApiTransaction, type ApiSummaryResponse,
  type ApiBudgetsResponse, type ApiInstallment,
  type ApiAccount, type ApiDebt, type ApiSinkingFund,
} from '../api/client';

// Phone management hook
export function usePhone() {
  const [phone, setPhoneState] = useState(getPhone());
  
  const setPhone = useCallback((newPhone: string) => {
    setApiPhone(newPhone);
    setPhoneState(newPhone);
  }, []);

  return { phone, setPhone, hasPhone: !!phone };
}

// Transactions hook
export function useTransactions(month?: string) {
  const [data, setData] = useState<ApiTransaction[]>([]);
  const [workspace, setWorkspace] = useState('My Wallet');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const phone = getPhone();

  const refresh = useCallback(async () => {
    if (!phone) { setLoading(false); return; }
    try {
      const res = await fetchTransactions(month);
      setData(res.transactions);
      setWorkspace(res.user.workspace);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [phone, month]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, workspace, loading, error, refresh };
}

// Summary hook
export function useSummary(month?: string) {
  const [data, setData] = useState<ApiSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const phone = getPhone();
  const m = month || getCurrentMonth();

  const refresh = useCallback(async () => {
    if (!phone) { setLoading(false); return; }
    try {
      const res = await fetchSummary(m);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [phone, m]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, refresh };
}

// Budgets hook
export function useBudgets(month?: string) {
  const [data, setData] = useState<ApiBudgetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const phone = getPhone();
  const m = month || getCurrentMonth();

  useEffect(() => {
    if (!phone) { setLoading(false); return; }
    fetchBudgets(m).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [phone, m]);

  return { data, loading };
}

// Installments hook
export function useInstallments() {
  const [installments, setInstallments] = useState<ApiInstallment[]>([]);
  const [activeTotal, setActiveTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const phone = getPhone();

  useEffect(() => {
    if (!phone) { setLoading(false); return; }
    fetchInstallments().then(res => {
      setInstallments(res.installments);
      setActiveTotal(res.activeTotal);
    }).catch(console.error).finally(() => setLoading(false));
  }, [phone]);

  return { installments, activeTotal, loading };
}

// Accounts hook
export function useAccounts() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const phone = getPhone();

  const refresh = useCallback(async () => {
    if (!phone) { setLoading(false); return; }
    try {
      const res = await fetchAccounts();
      setAccounts(res.accounts);
      setTotalBalance(res.totalBalance);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => { refresh(); }, [refresh]);

  return { accounts, totalBalance, loading, refresh };
}

// Debts hook
export function useDebts() {
  const [debts, setDebts] = useState<ApiDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const phone = getPhone();

  const refresh = useCallback(async () => {
    if (!phone) { setLoading(false); return; }
    try {
      const res = await fetchDebts();
      setDebts(res.debts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => { refresh(); }, [refresh]);

  return { debts, loading, refresh };
}

// Sinking Funds hook
export function useSinkingFunds() {
  const [funds, setFunds] = useState<ApiSinkingFund[]>([]);
  const [loading, setLoading] = useState(true);
  const phone = getPhone();

  useEffect(() => {
    if (!phone) { setLoading(false); return; }
    fetchSinkingFunds().then(res => setFunds(res.funds)).catch(console.error).finally(() => setLoading(false));
  }, [phone]);

  return { funds, loading };
}
