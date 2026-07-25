import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api/client';
import { RequireAuth } from '@/lib/RequireAuth';
import { useCart } from '@/lib/CartContext';
import { useNavigate } from 'react-router-dom';
import { btnSecondary } from '@/lib/btn';

type OrderItem = {
  productId: string | number;
  title: string;
  image?: string | null;
  quantity: number;
  priceAtPurchase: number;
};

type StatusHistoryEntry = {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  changedAt: string;
  changedBy: string;
};

type Order = {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  statusHistory?: StatusHistoryEntry[];
};

const statusLabel: Record<Order['status'], string> = {
  pending: 'Ожидает',
  processing: 'В обработке',
  completed: 'Завершён',
  failed: 'Ошибка',
  refunded: 'Возврат',
};

export default function ProfileOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addManyToCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const copyOrderId = async () => {
    if (!params.id) return;
    try {
      await navigator.clipboard.writeText(params.id);
    } catch {
    }
  };

  const repeatOrder = () => {
    if (!order) return;
    addManyToCart(
      order.items.map((item) => ({
        id: item.productId,
        title: item.title,
        price: item.priceAtPurchase,
        image: item.image || '/placeholder.svg',
        quantity: item.quantity,
      }))
    );
    navigate('/cart');
  };

  useEffect(() => {
    const run = async () => {
      try {
        const res = await apiFetch(`/api/orders/${params.id}`);
        if (!res.ok) throw new Error('Не удалось загрузить заказ');
        const data = await res.json();
        setOrder(data.order ?? null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [params.id]);

  return (
    <RequireAuth>
      <section className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-line bg-surface p-6">
            <h2 className="mb-1 text-lg font-semibold text-fg">Детали заказа</h2>
            <p className="mb-4 text-sm text-muted">Статус и состав заказа №{params.id}</p>
              {loading ? (
                <div className="text-muted">Загрузка...</div>
              ) : !order ? (
                <div className="space-y-4">
                  <p className="text-fg/80">Заказ не найден.</p>
                  <Link to="/profile/orders" className={btnSecondary}>
        Назад к заказам
      </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-line bg-surface-raised p-4">
                    <p className="text-sm text-muted">Дата создания</p>
                    <p className="text-fg">
                      {new Date(order.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-line bg-surface-raised/50 p-3"
                      >
                        <span className="text-fg">
                          {item.title} × {item.quantity}
                        </span>
                        <span className="text-emerald-400">
                          {(item.priceAtPurchase * item.quantity).toFixed(2)} ₽
                        </span>
                      </div>
                    ))}
                  </div>
                  {order.statusHistory && order.statusHistory.length > 0 && (
                    <div className="rounded-lg border border-line bg-surface-raised p-4">
                      <p className="mb-2 text-sm font-semibold text-fg/80">История статусов</p>
                      <div className="space-y-1 text-sm text-fg/80">
                        {order.statusHistory.map((entry, idx) => (
                          <div key={`${entry.changedAt}-${idx}`} className="flex justify-between gap-3">
                            <span>{statusLabel[entry.status]}</span>
                            <span className="text-muted">
                              {new Date(entry.changedAt).toLocaleString('ru-RU')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <div className="flex flex-wrap gap-2">
                      <Link to="/profile/orders" className={btnSecondary}>
        Назад к заказам
      </Link>
                      <button onClick={copyOrderId} className={btnSecondary} type="button">
        Копировать ID
      </button>
                      <button onClick={repeatOrder} type="button">
        Повторить заказ
      </button>
                    </div>
                    <div className="text-xl font-bold text-emerald-400">{order.totalAmount} ₽</div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </section>
    </RequireAuth>
  );
}

