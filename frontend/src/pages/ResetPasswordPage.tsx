import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { parseApiErrorBody } from '@/lib/api/client';
import { btnPrimary } from '@/lib/btn';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState('');

  const applyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!token) {
      setFormError('Ссылка недействительна');
      return;
    }
    if (password.length < 6) {
      setFormError('Пароль должен быть не менее 6 символов');
      return;
    }
    if (password !== confirm) {
      setFormError('Пароли не совпадают');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(parseApiErrorBody(data, 'Не удалось сбросить пароль'));
        return;
      }
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setFormError('Ошибка сети. Попробуйте позже.');
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout
        title="Сброс пароля"
        subtitle="Ссылка недействительна или отсутствует"
        footer={
          <p className="text-center text-sm text-muted">
            <Link to="/forgot-password" className="font-medium text-emerald-400 hover:underline">
              Запросить новую ссылку
            </Link>
          </p>
        }
      >
        <p className="text-sm text-fg/80">
          Перейдите на страницу восстановления пароля и укажите email аккаунта.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Новый пароль"
      subtitle="Придумайте новый пароль для входа"
      footer={
        <p className="text-center text-sm text-muted">
          <Link to="/login" className="font-medium text-emerald-400 hover:underline">
            Вернуться ко входу
          </Link>
        </p>
      }
    >
      {done ? (
        <p className="text-sm text-fg/80">Пароль обновлён. Перенаправляем на страницу входа…</p>
      ) : (
        <form onSubmit={applyReset} className="space-y-5">
          {formError ? (
            <div className="rounded-lg border border-red-500 bg-red-950/40 px-4 py-3 text-sm text-red-600">
              {formError}
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Новый пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" required className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
          <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Подтвердите пароль</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
          <button type="submit" className={`${btnPrimary} w-full`} disabled={saving}>
        {saving ? 'Сохраняем...' : 'Сохранить пароль'}
      </button>
        </form>
      )}
    </AuthLayout>
  );
}
