import { useEffect, useState } from 'react';
import { apiFetch, parseApiError } from '@/lib/api/client';
import { btnPrimary, btnSecondary } from '@/lib/btn';

interface Order {
  id: string;
  userId: string;
  userEmail?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  totalAmount: number;
  createdAt: string;
}

const statusLabel: Record<Order['status'], string> = {
  pending: 'Ожидает',
  processing: 'В обработке',
  completed: 'Завершён',
  failed: 'Ошибка',
  refunded: 'Возврат',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  async function fetchOrders(pageNum: number, status: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '15' });
      if (status !== 'all') params.set('status', status);
      const res = await apiFetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error(await parseApiError(res, 'Не загрузились заказы'));
      const data = await res.json();
      setOrders(data.orders || []);
      setPages(data.pagination?.pages ?? 1);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchOrders(page, statusFilter);
  }, [page, statusFilter]);

  const setFilter = (s: string) => {
    setStatusFilter(s);
    setPage(1);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(`Статус → ${statusLabel[newStatus as Order['status']] ?? newStatus}?`)) return;
    const res = await apiFetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      return;
    }
    await fetchOrders(page, statusFilter);
  };

  if (loading) return <p className="py-10 text-center text-sm text-muted">Загрузка заказов...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Заказы</h1>

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'processing', 'completed', 'failed', 'refunded'] as const).map((s) => (
          <button
            key={s}
            className={statusFilter === s ? btnPrimary : btnSecondary}
            type="button"
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Все' : statusLabel[s]}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="text-muted">Пусто</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="py-2 pr-2">ID</th>
                <th className="py-2 pr-2">Юзер</th>
                <th className="py-2 pr-2">Дата</th>
                <th className="py-2 pr-2">Сумма</th>
                <th className="py-2 pr-2">Статус</th>
                <th className="py-2">Действие</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line/60">
                  <td className="py-2 pr-2 font-medium">{order.id}</td>
                  <td className="py-2 pr-2">
                    <div>{order.userEmail || '—'}</div>
                    <div className="text-xs text-muted">{order.userId}</div>
                  </td>
                  <td className="py-2 pr-2">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td className="py-2 pr-2">{order.totalAmount} ₽</td>
                  <td className="py-2 pr-2">{statusLabel[order.status]}</td>
                  <td className="py-2">
                    <select
                      className="rounded border border-line bg-surface px-2 py-1"
                      value={order.status}
                      onChange={(e) => {
                        if (e.target.value !== order.status) void updateStatus(order.id, e.target.value);
                      }}
                    >
                      {Object.entries(statusLabel).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 py-4">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-line disabled:opacity-40"
        >
          ← Назад
        </button>
        <span className="text-sm text-muted">
          {page} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
          className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-line disabled:opacity-40"
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
}
