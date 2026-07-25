import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useAuth } from '@/lib/AuthContext';
import { parseApiErrorBody } from '@/lib/api/client';
import { btnPrimary } from '@/lib/btn';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const reason = params.get('reason');
  const { user, ready, setSession } = useAuth();

  useEffect(() => {
    if (ready && user) navigate(next.startsWith('/') ? next : '/', { replace: true });
  }, [ready, user, navigate, next]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    if (!password) {
      setError('Введите пароль');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseApiErrorBody(data, 'Неверный email или пароль'));
        return;
      }
      if (data.accessToken && data.user) {
        setSession(data.user, data.accessToken);
        navigate(next.startsWith('/') ? next : '/');
      } else {
        setError('Странный ответ сервера');
      }
    } catch (err) {
      setError('Ошибка сети');
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const reasonText =
    reason === 'buy'
      ? 'Войди в аккаунт, чтобы оформить покупку'
      : reason === 'cart'
        ? 'Войди, чтобы пользоваться корзиной'
        : reason === 'favorites'
          ? 'Войди, чтобы сохранять избранное'
          : null;

  return (
    <AuthLayout
      title="Вход"
      subtitle="Email и пароль"
      footer={
        <p className="text-center text-sm text-muted">
          Нет аккаунта?{' '}
          <Link to={`/register?next=${encodeURIComponent(next)}`} className="text-emerald-400 hover:underline">
            Регистрация
          </Link>
        </p>
      }
    >
      <form onSubmit={onLogin} className="flex flex-col gap-5">
        {reasonText ? <p className="rounded-lg bg-emerald-600/10 px-3 py-2 text-sm text-emerald-400">{reasonText}</p> : null}
        {error ? <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-fg/80" htmlFor="login-password">
              Пароль
            </label>
            <Link to="/forgot-password" className="text-sm text-emerald-400 hover:underline">
              Забыли?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button type="submit" className={`${btnPrimary} w-full`} disabled={busy}>
          {busy ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </AuthLayout>
  );
}
