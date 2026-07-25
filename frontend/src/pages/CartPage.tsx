import { useState } from 'react';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { RequireAuth } from '@/lib/RequireAuth';
import { useCart } from '@/lib/CartContext';
import { btnPrimary, btnSecondary } from '@/lib/btn';

export default function CartPage() {
  return (
    <RequireAuth loginReason="cart">
      <CartPageContent />
    </RequireAuth>
  );
}

function CartPageContent() {
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (items.length === 0) return;
    setSubmitting(true);
    navigate('/checkout');
    setSubmitting(false);
  };

  return (
    <section className="border-b border-line">
      <div className="border-b border-line bg-surface-raised/40 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold tracking-tight text-fg md:text-2xl">Корзина</h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingCart className="mx-auto mb-3 size-10 text-muted" />
            <p className="font-medium">Корзина пустая</p>
            <p className="mt-1 text-sm text-muted">Добавь что-нибудь из каталога</p>
            <Link to="/games" className={`${btnPrimary} mt-4`}>
        К играм
      </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-start">
            <ul className="divide-y divide-line border-y border-line">
              {items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={item.image || '/placeholder.svg'}
                      alt=""
                      className="size-14 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fg">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.price} ₽ за шт.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex h-8 items-center overflow-hidden rounded-lg border border-line">
                      <button
                        type="button"
                        aria-label="Уменьшить количество"
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="flex size-8 items-center justify-center text-muted transition hover:bg-surface-raised hover:text-fg/80 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="min-w-8 px-1 text-center text-sm tabular-nums text-fg/80">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Увеличить количество"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex size-8 items-center justify-center text-muted transition hover:bg-surface-raised hover:text-fg/80"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label="Удалить из корзины"
                      onClick={() => removeFromCart(item.id)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-raised hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <p className="min-w-16 text-right text-sm font-medium text-emerald-400">
                      {item.price * item.quantity} ₽
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="sticky top-24 space-y-4 rounded-xl border border-line bg-surface-raised p-5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-muted">Итого</span>
                <span className="text-2xl font-bold tabular-nums text-emerald-400">{total} ₽</span>
              </div>
              <p className="text-xs text-muted">{items.length} поз. в заказе</p>
              <button className={`${btnPrimary} w-full`} onClick={handleCheckout} disabled={submitting} type="button">
        {submitting ? 'Переход...' : 'Оформить заказ'}
      </button>
              <button className={`${btnSecondary} w-full`} onClick={clearCart} type="button">
        Очистить
      </button>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
