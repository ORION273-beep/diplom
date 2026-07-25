import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api/client';
import { parseApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { btnPrimary, btnSecondary, btnGhost } from '@/lib/btn';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Банковская карта', description: 'Visa, Mastercard, МИР' },
  { id: 'sbp', label: 'СБП', description: 'Оплата по QR-коду' },
  { id: 'balance', label: 'Баланс OneSec', description: 'Списание с внутреннего баланса' },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]['id'];

type StockInfo = {
  id: string;
  stock: number;
  inStock: boolean;
  title: string;
};

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState('');
  const [stockMap, setStockMap] = useState<Record<string, StockInfo>>({});
  const [balance, setBalance] = useState(user?.balance ?? 0);
  const total = getTotalPrice();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [meRes, ...productRes] = await Promise.all([
          apiFetch('/api/auth/me'),
          ...items.map((item) => apiFetch(`/api/products/${item.id}`)),
        ]);
        if (meRes.ok) {
          const me = await meRes.json();
          if (typeof me.user?.balance === 'number') setBalance(me.user.balance);
        }
        const map: Record<string, StockInfo> = {};
        for (let i = 0; i < items.length; i += 1) {
          const res = productRes[i];
          if (res?.ok) {
            const data = await res.json();
            const p = data.product;
            if (p) {
              map[String(items[i].id)] = {
                id: String(p.id),
                stock: p.stock ?? 0,
                inStock: p.inStock !== false,
                title: p.title,
              };
            }
          }
        }
        setStockMap(map);
      } catch {
      }
    };
    void load();
  }, [user, items]);

  const stockIssues = items.filter((item) => {
    const info = stockMap[String(item.id)];
    if (!info) return false;
    return !info.inStock || info.stock < item.quantity;
  });

  if (!user) {
    return (
      <section className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-2 text-xl font-semibold">Оплата</h1>
        <p className="text-sm text-muted">Нужно войти в аккаунт.</p>
        <Link to="/login?next=/checkout" className={`${btnPrimary} mt-4`}>
          Войти
        </Link>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-2 text-xl font-semibold">Оплата</h1>
        <p className="text-sm text-muted">Корзина пустая — сначала добавь товары.</p>
        <Link to="/catalog" className={`${btnSecondary} mt-4`}>
        В каталог
      </Link>
      </section>
    );
  }

  const insufficientBalance = method === 'balance' && balance < total;

  const handlePay = async () => {
    if (stockIssues.length > 0 || insufficientBalance) return;
    setPayError('');
    setSubmitting(true);
    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `order-${Date.now()}`;

      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: method,
          idempotencyKey,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(await parseApiError(res, 'Не удалось оформить заказ'));
      }

      const data = await res.json();
      clearCart();
      navigate(`/checkout/success?orderId=${encodeURIComponent(data.order.id)}`);
    } catch (error) {
      setPayError(error instanceof Error ? error.message : 'Ошибка оплаты');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-10 pb-16">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">Чекаут</p>
      <h1 className="mt-1 text-xl font-semibold text-fg">Оплата</h1>
      <p className="mt-1 mb-2 text-sm text-muted">Выбери способ и подтверди</p>
      <p className="mb-8 text-xs text-muted">Демо: оплата симулируется, реального списания нет.</p>

      {stockIssues.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-500 bg-red-950/40 p-3 text-sm text-red-600">
          <p className="font-medium">Некоторые товары недоступны:</p>
          <ul className="mt-2 list-inside list-disc text-xs">
            {stockIssues.map((item) => {
              const info = stockMap[String(item.id)];
              return (
                <li key={item.id}>
                  {item.title} — доступно: {info?.stock ?? 0}, в корзине: {item.quantity}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-2" role="radiogroup" aria-label="Способ оплаты">
        {PAYMENT_METHODS.map((pm) => (
          <label
            key={pm.id}
            className={
              method === pm.id
                ? 'flex w-full cursor-pointer items-start gap-3 rounded-lg border border-line bg-emerald-600/10 p-3 ring-2 ring-emerald-500'
                : 'flex w-full cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-raised/60 p-3 ring-1 ring-line hover:bg-surface-raised'
            }
          >
            <input
              type="radio"
              name="pay-method"
              value={pm.id}
              checked={method === pm.id}
              onChange={() => setMethod(pm.id as PaymentMethod)}
              className="mt-1 size-4"
            />
            <span>
              <span className="block text-sm font-medium text-fg">{pm.label}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {pm.id === 'balance'
                  ? `${pm.description}. Доступно: ${balance.toLocaleString('ru-RU')} ₽`
                  : pm.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      {insufficientBalance && (
        <p className="mb-4 text-sm text-red-600">
          Не хватает {(total - balance).toLocaleString('ru-RU')} ₽ на балансе
        </p>
      )}

      {payError ? (
        <p className="mb-4 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-600">{payError}</p>
      ) : null}
      <div className="mb-6 space-y-2 border-y border-line py-4">
        {items.map((item) => {
          const info = stockMap[String(item.id)];
          const lowStock = info && (info.stock < item.quantity || !info.inStock);
          return (
            <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span className={lowStock ? 'text-red-600' : 'text-fg'}>
                {item.title} × {item.quantity}
              </span>
              <span className="shrink-0 tabular-nums text-emerald-400">
                {item.price * item.quantity} ₽
              </span>
            </div>
          );
        })}
        <div className="flex justify-between pt-2 text-base font-semibold">
          <span className="text-fg">Итого</span>
          <span className="tabular-nums text-emerald-400">{total} ₽</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          className={`${btnPrimary} w-full`}
          onClick={handlePay}
          disabled={submitting || stockIssues.length > 0 || insufficientBalance}
          type="button"
        >
          {submitting ? 'Обработка...' : `Оплатить ${total} ₽`}
        </button>
        <Link to="/cart" className={`${btnGhost} w-full`}>
        Назад в корзину
      </Link>
      </div>
    </section>
  );
}
