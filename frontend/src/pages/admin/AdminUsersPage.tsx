import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { parseApiError } from '@/lib/api/client';
import { btnPrimary } from '@/lib/btn';

type AdminUser = {
  id: string;
  email: string;
  role: string;
  balance: number;
  blocked: boolean;
  orderCount: number;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busy, setBusy] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [balanceEdit, setBalanceEdit] = useState('');
  const [q, setQ] = useState('');

  async function loadUsers() {
    setBusy(true);
    try {
      const res = await apiFetch('/api/admin/users');
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setUsers((data.users as AdminUser[]) ?? []);
    } catch (err) {
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const patchAccount = async (id: string, body: Record<string, unknown>) => {
    const res = await apiFetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return;
    }
    setEditingId(null);
    await loadUsers();
  };

  const filtered = q.trim()
    ? users.filter((u) => u.email.toLowerCase().includes(q.trim().toLowerCase()))
    : users;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Аккаунты</h1>
          <p className="text-sm text-muted">Роль и баланс правятся прямо в списке</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Поиск по email</label>
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="email…" aria-label="Поиск по email" className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      {busy ? (
        <p className="text-sm text-muted">Гружу пользователей…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">{q ? 'Никого не нашёл по этому email' : 'Пользователей нет'}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-surface-raised text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Роль</th>
                <th className="px-4 py-3 font-medium">Баланс</th>
                <th className="px-4 py-3 font-medium">Заказов</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {filtered.map((u) => (
                <tr key={u.id} className={u.blocked ? 'opacity-60' : undefined}>
                  <td className="px-4 py-3 text-fg">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => patchAccount(u.id, { role: e.target.value })}
                      className="rounded border border-line bg-surface px-2 py-1"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <div className="flex items-center gap-2">
                        <input type="text" value={balanceEdit} onChange={(e) => setBalanceEdit(e.target.value)} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
                        <button
                          className={btnPrimary}
                          type="button"
                          onClick={() => patchAccount(u.id, { balance: Number(balanceEdit) })}
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="text-emerald-400 hover:underline"
                        onClick={() => {
                          setEditingId(u.id);
                          setBalanceEdit(String(u.balance));
                        }}
                      >
                        {u.balance.toLocaleString('ru-RU')} ₽
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fg/80">{u.orderCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className={
                        u.blocked
                          ? 'inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white'
                          : 'inline-flex items-center justify-center gap-1 rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold text-fg/80 ring-1 ring-line'
                      }
                      type="button"
                      onClick={() => patchAccount(u.id, { blocked: !u.blocked })}
                    >
                      {u.blocked ? 'Разблок' : 'Блок'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
