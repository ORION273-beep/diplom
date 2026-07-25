import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useAuth } from '@/lib/AuthContext';
import { parseApiErrorBody } from '@/lib/api/client';
import { btnPrimary } from '@/lib/btn';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/';
  const loginHref = next && next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login';
  const { setSession } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Некорректный email');
      return;
    }
    if (password.length < 6) {
      setError('Пароль минимум 6 символов');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(parseApiErrorBody(data, 'Ошибка регистрации'));
        return;
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const loginData = await loginRes.json().catch(() => ({}));
      if (loginRes.ok && loginData.accessToken && loginData.user) {
        setSession(loginData.user, loginData.accessToken);
        navigate(next.startsWith('/') ? next : '/');
      } else {
        setError('Регистрация ок, но вход не прошёл — зайди вручную');
      }
    } catch (err) {
      setError('Сервер недоступен');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Регистрация"
      subtitle="Создай аккаунт"
      footer={
        <p className="text-center text-sm text-muted">
          Уже есть аккаунт?{' '}
          <Link to={loginHref} className="text-emerald-400 hover:underline">
            Войти
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Ещё раз пароль</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button type="submit" className={`${btnPrimary} w-full`} disabled={isLoading}>
          {isLoading ? '...' : 'Зарегистрироваться'}
        </button>
      </form>
    </AuthLayout>
  );
}
