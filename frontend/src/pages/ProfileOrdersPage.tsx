import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { parseApiError } from '@/lib/api/client';
import { RequireAuth } from '@/lib/RequireAuth';
import { useCart } from '@/lib/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { btnPrimary, btnSecondary } from '@/lib/btn';

interface OrderItem {
  productId: string | number;
  title: string;
  image?: string | null;
  quantity: number;
  priceAtPurchase: number;
}

interface StatusHistoryEntry {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  changedAt: string;
  changedBy: string;
}

interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  statusHistory?: StatusHistoryEntry[];
}

const ORDERS_PER_PAGE = 10;

const statusLabel: Record<Order['status'], string> = {
  pending: 'Ожидает',
  processing: 'В обработке',
  completed: 'Завершён',
  failed: 'Ошибка',
  refunded: 'Возврат',
};

export default function ProfileOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const { addManyToCart } = useCart();
  const navigate = useNavigate();

  const copyOrderId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
    }
  };

  const repeatOrder = (order: Order) => {
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

  async function fetchOrders(pageNum: number) {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/orders?page=${pageNum}&limit=${ORDERS_PER_PAGE}`);
      if (!res.ok) throw new Error(await parseApiError(res, 'Не удалось загрузить заказы'));

      const data = await res.json();
      setOrders(data.orders || []);
      setPages(data.pagination?.pages ?? 1);
    } catch (error) {
      console.error('profile orders:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <RequireAuth>
      <section className="container mx-auto max-w-4xl px-4 py-8 pb-10">
        <h1 className="text-2xl font-semibold text-fg">Мои заказы</h1>
        <p className="mt-1 mb-6 text-sm text-muted">История покупок</p>
        <div>
          <div className="rounded-xl border border-line bg-surface p-6">
              {loading ? (
                <div className="py-12 text-center text-muted">Подтягиваю заказы…</div>
              ) : orders.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-fg">Заказов пока нет</p>
                  <p className="mt-1 text-sm text-muted">Купи что-нибудь — появится тут</p>
                  <Link to="/games" className={`${btnPrimary} mt-4`}>
        К играм
      </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-line rounded-lg p-4 hover:bg-surface-raised transition-colors">
                      <div className="flex flex-wrap justify-between items-start mb-3">
                        <div>
                          <span className="text-sm text-muted">Заказ №{order.id}</span>
                          <p className="text-sm text-fg/80">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'completed' ? 'bg-emerald-950/40 text-green-600' :
                          order.status === 'processing' ? 'bg-yellow-950/30 text-yellow-600' :
                          order.status === 'pending' ? 'bg-emerald-950/40 text-emerald-400' :
                          order.status === 'refunded' ? 'bg-surface-raised text-muted' :
                          'bg-red-950/40 text-red-600'
                        }`}>
                          {statusLabel[order.status]}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-surface-raised rounded">
                            <span className="text-fg/80">{item.title} × {item.quantity}</span>
                            <span className="text-fg">{(item.priceAtPurchase * item.quantity).toFixed(2)} ₽</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-line">
                        <span className="font-medium text-fg">Итого:</span>
                        <span className="text-xl font-bold text-emerald-400">{order.totalAmount} ₽</span>
                      </div>

                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <button className={btnSecondary} type="button" onClick={() => copyOrderId(order.id)}>
        Копировать ID
      </button>
                        <button className={btnSecondary} type="button" onClick={() => repeatOrder(order)}>
        Повторить заказ
      </button>
                        <Link to={`/profile/orders/${order.id}`} className={btnSecondary}>
                          Подробнее
                        </Link>
                      </div>

                      {order.statusHistory && order.statusHistory.length > 0 && (
                        <div className="mt-3 rounded-md border border-line/70 bg-surface-raised p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                            История статусов
                          </p>
                          <div className="space-y-1.5 text-xs text-fg/80">
                            {order.statusHistory.map((entry, index) => (
                              <div key={`${entry.changedAt}-${index}`} className="flex items-center justify-between gap-2">
                                <span className="font-medium text-fg">{statusLabel[entry.status]}</span>
                                <span className="text-muted">
                                  {new Date(entry.changedAt).toLocaleString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!loading && orders.length > 0 && pages > 1 && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
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
                    onClick={() => handlePageChange(page + 1)}
                    className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-line disabled:opacity-40"
                  >
                    Вперёд →
                  </button>
                </div>
              )}
          </div>
        </div>
      </section>
    </RequireAuth>
  );
}
