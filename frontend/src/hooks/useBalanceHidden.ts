import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'wafin_hide_balance';

export function useBalanceHidden() {
  const [hidden, setHiddenState] = useState(false);

  // Read initial on mount to avoid hydration mismatch
  useEffect(() => {
    setHiddenState(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  const toggle = useCallback(() => {
    setHiddenState(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      // Dispatch an event so other instances of the hook across the app sync instantly
      window.dispatchEvent(new Event('wafin_balance_hidden_toggle'));
      return next;
    });
  }, []);

  useEffect(() => {
    const handleSync = () => {
      setHiddenState(localStorage.getItem(STORAGE_KEY) === 'true');
    };
    window.addEventListener('wafin_balance_hidden_toggle', handleSync);
    return () => window.removeEventListener('wafin_balance_hidden_toggle', handleSync);
  }, []);

  return { hidden, toggle };
}
