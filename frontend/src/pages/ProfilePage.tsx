import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch, logoutClient, parseApiError } from '@/lib/api/client';
import { Link, useNavigate } from 'react-router-dom';
import { RequireAuth } from '@/lib/RequireAuth';
import { btnPrimary, btnSecondary } from '@/lib/btn';

export default function ProfilePage() {
  const { user, setSession, accessToken, clear } = useAuth();
  const navigate = useNavigate();
  const [createdAt, setCreatedAt] = useState<string | null>(user?.createdAt ?? null);
  const [balance, setBalance] = useState<number>(user?.balance ?? 0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [passwordMsgShown, setPasswordMsgShown] = useState(false);

  useEffect(() => {
    if (!passwordMsg) {
      setPasswordMsgShown(false);
      return;
    }
    // следующий кадр — чтобы transition сработал с opacity-0 → 100
    const show = window.requestAnimationFrame(() => setPasswordMsgShown(true));
    if (passwordMsg.type !== 'ok') {
      return () => window.cancelAnimationFrame(show);
    }
    const fade = window.setTimeout(() => setPasswordMsgShown(false), 2700);
    const clear = window.setTimeout(() => setPasswordMsg(null), 3000);
    return () => {
      window.cancelAnimationFrame(show);
      window.clearTimeout(fade);
      window.clearTimeout(clear);
    };
  }, [passwordMsg]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiFetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        if (data.user) {
          if (data.user.createdAt) setCreatedAt(data.user.createdAt);
          if (typeof data.user.balance === 'number') setBalance(data.user.balance);
          if (accessToken) {
            setSession(data.user, accessToken);
          }
        }
      } catch {
        // ignore
      }
    };
    void loadProfile();
    // только при открытии профиля
  }, []);

  const handleLogout = async () => {
    await logoutClient();
    clear();
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'err', text: 'Новый пароль — минимум 6 символов' });
      return;
    }
    setChangingPassword(true);
    try {
      const res = await apiFetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, 'Пароль не сменился'));
      }
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMsg({ type: 'ok', text: 'Пароль изменён' });
    } catch (error) {
      setPasswordMsg({
        type: 'err',
        text: error instanceof Error ? error.message : 'Не вышло сменить пароль',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const registrationDate = createdAt ? new Date(createdAt).toLocaleDateString('ru-RU') : '—';
  const nick = user?.email?.split('@')[0] ?? '—';

  return (
    <RequireAuth>
      <section className="mx-auto max-w-4xl px-4 py-8 md:px-8 lg:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-fg md:text-3xl">Профиль</h1>
          <p className="mt-1 text-sm text-muted">Данные аккаунта и смена пароля</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface/60 p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Аккаунт</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 pb-3">
                <dt className="text-muted">Ник</dt>
                <dd className="font-medium text-fg">{nick}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 pb-3">
                <dt className="text-muted">Email</dt>
                <dd className="break-all font-medium text-fg">{user?.email}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 pb-3">
                <dt className="text-muted">Баланс</dt>
                <dd className="text-lg font-semibold text-emerald-400">
                  {balance.toLocaleString('ru-RU')} ₽
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-muted">Регистрация</dt>
                <dd className="text-fg">{registrationDate}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/profile/orders" className={btnPrimary}>
                Заказы
              </Link>
              {user?.role === 'admin' ? (
                <Link to="/admin" className={btnSecondary}>
                  Админка
                </Link>
              ) : null}
              <button type="button" onClick={handleLogout} className={btnSecondary}>
                Выйти
              </button>
            </div>
          </div>

          <form
            onSubmit={handleChangePassword}
            className="rounded-xl border border-line bg-surface/60 p-5 sm:p-6"
          >
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Пароль</h2>
            <p className="mb-4 text-sm text-muted">Минимум 6 символов для нового пароля</p>
            {passwordMsg ? (
              <div
                role="status"
                className={
                  (passwordMsg.type === 'ok'
                    ? 'mb-4 rounded-lg border border-emerald-500/40 bg-emerald-600/15 px-3 py-2.5 text-sm text-emerald-400'
                    : 'mb-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2.5 text-sm text-red-500') +
                  ` transition-opacity duration-300 ease-out ${passwordMsgShown ? 'opacity-100' : 'opacity-0'}`
                }
              >
                {passwordMsg.text}
              </div>
            ) : null}
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-fg/80" htmlFor="profile-current-password">
                  Текущий
                </label>
                <input
                  id="profile-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-fg/80" htmlFor="profile-new-password">
                  Новый
                </label>
                <input
                  id="profile-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={
                  changingPassword ||
                  !currentPassword.trim() ||
                  newPassword.length < 6
                }
                className={btnPrimary}
              >
                {changingPassword ? 'Сохраняю…' : 'Обновить пароль'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </RequireAuth>
  );
}
