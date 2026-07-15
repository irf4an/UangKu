import { useState } from 'react';
import { usePhone } from '../hooks/useApi';
import { Smartphone, ArrowRight } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export default function PhoneSetup({ onLogin }: Props) {
  const { setPhone } = usePhone();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Accept any format - let the API handle flexible lookup
    const trimmed = input.trim();
    if (!trimmed || trimmed.length < 3) {
      setError('Masukkan nomor HP atau ID Anda');
      return;
    }
    
    // Try to normalize phone number, but also accept raw LID format
    let phone = trimmed;
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length >= 10) {
      // Looks like a phone number - normalize
      phone = digitsOnly;
      if (phone.startsWith('0')) phone = '62' + phone.slice(1);
      if (!phone.startsWith('62')) phone = '62' + phone;
    }
    // Otherwise use raw input (for LID format like "16948159053996")
    
    setPhone(phone);
    onLogin();
  };

  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft">
          <Smartphone className="h-8 w-8 text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text">Selamat Datang</h1>
          <p className="mt-2 text-sm text-text-muted">
            Masukkan nomor WhatsApp yang terhubung ke bot untuk melihat data keuangan Anda.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="tel"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); }}
              placeholder="08xxx atau ID dari bot"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-center font-display text-lg text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-expense">{error}</p>}
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white hover:bg-accent-hover transition-colors"
          >
            Masuk
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="text-[11px] text-text-muted">
          Masukkan nomor HP atau ID yang terhubung ke bot. Jika tidak tahu ID, kirim /id ke bot.
        </p>
      </div>
    </div>
  );
}
