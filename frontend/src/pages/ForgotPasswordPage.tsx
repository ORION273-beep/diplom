import { Link } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { parseApiErrorBody } from '@/lib/api/client';
import { btnPrimary } from '@/lib/btn';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiErrorBody(data, 'Не удалось отправить запрос'));
        return;
      }
      setSent(true);
    } catch {
      setError('Ошибка сети. Попробуйте позже.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout
      title="Восстановление пароля"
      subtitle="Укажите email аккаунта — мы отправим инструкцию"
      footer={
        <p className="text-center text-sm text-muted">
          <Link to="/login" className="font-medium text-emerald-400 hover:underline">
            Вернуться ко входу
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-4 text-sm text-fg/80">
          <p>Если email зарегистрирован, инструкция по восстановлению отправлена.</p>
          <p>
            Не пришло письмо? Напишите в{' '}
            <a
              href="https://t.me/Orion434"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Telegram @Orion434
            </a>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={submitForgot} className="space-y-5">
          {error ? <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-600">{error}</p> : null}
          <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
          <button type="submit" className={`${btnPrimary} w-full`} disabled={sending}>
        {sending ? 'Отправляем...' : 'Отправить'}
      </button>
        </form>
      )}
    </AuthLayout>
  );
}
