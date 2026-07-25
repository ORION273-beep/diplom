import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { useFavorites } from '@/lib/FavoritesContext';
import { isPubgMobileProduct, PubgUcBackdrop } from '@/components/commerce/ProductMediaFrame';
import type { ProductDetailData } from '@/lib/api/client';
import { btnPrimary, btnSecondary } from '@/lib/btn';

export type { ProductDetailData };

function productBackFallback(product: ProductDetailData): string {
  if (product.category === 'subscriptions') return '/catalog/subscriptions';
  if (product.gameSlug) return `/games/${product.gameSlug}`;
  return '/catalog/currency';
}

export function ProductDetail({ product }: { product: ProductDetailData }) {
  const { addToCart, replaceCart } = useCart();
  const { toggleFavorite, items: favoriteItems } = useFavorites();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [buying, setBuying] = useState(false);

  const handleBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      navigate(-1);
      return;
    }
    navigate(productBackFallback(product));
  };

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const isPubg = isPubgMobileProduct({ category: product.category, image: product.image });
  const isInStock = product.inStock !== false;
  const isFavorite = favoriteItems.some((item) => item.id === product.id);

  const requireLogin = (reason: string) => {
    if (user) return true;
    navigate(`/login?next=${encodeURIComponent(window.location.pathname)}&reason=${reason}`);
    return false;
  };

  const cartPayload = {
    id: product.id,
    title: product.title,
    price: product.price,
    oldPrice: product.oldPrice ?? undefined,
    image: product.image,
    gameSlug: product.gameSlug ?? undefined,
    category: product.category,
    platform: product.platform,
    inStock: product.inStock,
  };

  const handleBuyNow = async () => {
    if (!requireLogin('buy')) return;
    setBuying(true);
    try {
      await replaceCart(cartPayload);
      navigate('/checkout');
    } finally {
      setBuying(false);
    }
  };

  const handleAddToCart = () => {
    if (!requireLogin('cart')) return;
    addToCart(cartPayload);
  };

  const handleToggleFavorite = () => {
    if (!requireLogin('favorites')) return;
    toggleFavorite({
      id: product.id,
      title: product.title,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.image,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:py-10">
      <button
        type="button"
        onClick={handleBack}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-emerald-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </button>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-10">
        <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface shadow-sm lg:mx-0">
          <div
            className={
              isPubg ? 'relative aspect-4/3' : 'relative aspect-4/3 bg-surface-raised'
            }
          >
            {isPubg && <PubgUcBackdrop />}
            <img
              src={product.image || '/placeholder.svg'}
              alt={product.title}
              className={
                isPubg
                  ? 'relative z-10 size-full scale-[1.08] object-contain p-3'
                  : 'absolute inset-0 size-full object-cover'
              }
            />
            {discount > 0 && (
              <div className="absolute left-3 top-3 z-20 rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                -{discount}%
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">
            {product.platform === 'mobile' ? 'Мобильные' : 'ПК'} · {product.category}
          </p>
          <h1 className="mb-3 text-xl font-semibold tracking-tight text-fg md:text-2xl">{product.title}</h1>
          <p className="mb-5 text-sm leading-relaxed text-fg/75">{product.description}</p>

          <div className="rounded-xl border border-line bg-surface/70 p-5">
            <div className="mb-1 flex items-baseline gap-2">
              <div className="text-2xl font-semibold text-emerald-400">{product.price} ₽</div>
              {product.oldPrice ? (
                <div className="text-sm text-muted line-through">{product.oldPrice} ₽</div>
              ) : null}
            </div>
            <p className={`mb-4 text-sm ${isInStock ? 'text-emerald-400/90' : 'text-muted'}`}>
              {isInStock ? 'В наличии' : 'Нет в наличии'}
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className={`${btnPrimary} w-full`}
                disabled={!isInStock}
                type="button"
                onClick={() => setConfirmOpen(true)}
              >
                <ShoppingCart className="size-4" />
                Купить
              </button>
              <button
                className={`${btnSecondary} w-full`}
                disabled={!isInStock}
                onClick={handleAddToCart}
                type="button"
              >
                В корзину
              </button>
            </div>

            <button className={`${btnSecondary} mt-2 w-full`} onClick={handleToggleFavorite} type="button">
              <Heart className="size-4" />
              {isFavorite ? 'В избранном' : 'В избранное'}
            </button>
          </div>
        </div>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Закрыть"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl rounded-xl bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Подтверждение</h2>
            <p className="mt-2 text-sm text-muted">
              Купить «{product.title}» за {product.price} ₽?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button className={btnSecondary} type="button" onClick={() => setConfirmOpen(false)}>
                Отмена
              </button>
              <button onClick={handleBuyNow} className={btnPrimary} type="button" disabled={buying}>
                {buying ? 'Секунду…' : 'К оплате'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
