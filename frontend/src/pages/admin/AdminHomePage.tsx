import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api/client';

type Stats = {
  orderCount: number;
  productCount: number;
  userCount: number;
  revenue: number;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{ title: string; quantity: number }>;
};

export default function AdminHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch('/api/admin/stats');
        if (!alive) return;
        if (!res.ok) {
          setError('Не удалось загрузить статистику');
          return;
        }
        const data = await res.json();
        if (alive) setStats(data.stats ?? null);
      } catch {
        if (alive) setError('Ошибка сети');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const name = user?.email?.split('@')[0] ?? 'админ';

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted">Админка</p>
        <h1 className="text-2xl font-semibold text-fg">Привет, {name}</h1>
        <p className="mt-1 max-w-xl text-sm text-fg/80">Сводка по магазину. Разделы — в меню слева.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Гружу статистику...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : stats ? (
        <ul className="space-y-2 text-sm text-fg">
          <li>
            Выручка (completed):{' '}
            <span className="font-semibold">{stats.revenue.toLocaleString('ru-RU')} ₽</span>
          </li>
          <li>
            Заказов: <span className="font-semibold">{stats.orderCount}</span>
          </li>
          <li>
            Пользователей: <span className="font-semibold">{stats.userCount}</span>, товаров:{' '}
            <span className="font-semibold">{stats.productCount}</span>
          </li>
        </ul>
      ) : (
        <p className="text-sm text-muted">Пока нет данных</p>
      )}

      {stats?.topProducts?.length ? (
        <div>
          <h2 className="mb-2 text-sm font-medium text-fg/80">Топ по количеству в заказах</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-fg">
            {stats.topProducts.slice(0, 5).map((p) => (
              <li key={p.title}>
                {p.title} <span className="text-muted">×{p.quantity}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/admin/orders" className="text-emerald-400 underline-offset-2 hover:underline">
          К заказам
        </Link>
        <Link to="/admin/products" className="text-emerald-400 underline-offset-2 hover:underline">
          К товарам
        </Link>
        <Link to="/" className="text-muted underline-offset-2 hover:underline">
          На витрину
        </Link>
      </div>
    </div>
  );
}
