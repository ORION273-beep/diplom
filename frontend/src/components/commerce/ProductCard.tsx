import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { isLocalProductArt, isPubgMobileProduct, ProductMediaFrame } from '@/components/commerce/ProductMediaFrame';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { useFavorites } from '@/lib/FavoritesContext';
import type { Product } from '@/lib/api/client';
import { btnPrimary, btnSecondary } from '@/lib/btn';

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite: checkFavorite } = useFavorites();
  const isFavorite = checkFavorite(product.id);

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const needAuth = (reason: string) => {
    if (user) return true;
    navigate(`/login?next=${encodeURIComponent(window.location.pathname)}&reason=${reason}`);
    return false;
  };

  const isInStock = product.inStock !== false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isInStock) return;
    if (!needAuth('cart')) return;
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      oldPrice: product.oldPrice ?? undefined,
      image: product.image,
      gameSlug: product.gameSlug ?? undefined,
      category: product.category,
      platform: product.platform,
      inStock: product.inStock,
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!needAuth('favorites')) return;
    toggleFavorite(product);
  };

  const isPubg = isPubgMobileProduct(product);
  const isLocalArt = isLocalProductArt(product.image);

  const imgClass = isPubg
    ? 'mx-auto size-full max-h-none max-w-none scale-[1.12] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)]'
    : isLocalArt
      ? 'h-full w-full bg-black object-contain transition-transform duration-300 group-hover:scale-[1.03]'
      : 'h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]';

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-line/80 bg-surface/80 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-500/45">
      <ProductMediaFrame product={product} className="bg-surface-raised">
        <Link to={`/product/${product.id}`} className="block h-full w-full">
          <img src={product.image || '/placeholder.svg'} alt={product.title} className={imgClass} />
        </Link>

        {discount > 0 && (
          <span className="absolute left-2 top-2 z-20 rounded bg-red-600/90 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            -{discount}%
          </span>
        )}

        <button
          className="absolute right-2 top-2 z-20 inline-flex size-8 items-center justify-center rounded-md bg-surface/75 text-muted backdrop-blur-sm hover:bg-surface-raised hover:text-fg"
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          type="button"
        >
          <Heart className={isFavorite ? 'size-3.5 fill-current text-red-500' : 'size-3.5'} />
        </button>
      </ProductMediaFrame>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <Link to={`/product/${product.id}`}>
          <h3 className="line-clamp-2 min-h-9 text-[13px] font-medium leading-snug text-fg transition-colors hover:text-emerald-400">
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto flex items-baseline gap-1.5">
          <span className="text-base font-semibold text-emerald-400">{product.price} ₽</span>
          {product.oldPrice ? (
            <span className="text-xs text-muted line-through">{product.oldPrice} ₽</span>
          ) : null}
        </div>

        <div className="flex gap-1.5">
          {isInStock ? (
            <Link to={`/product/${product.id}`} className={`${btnPrimary} flex-1 px-2! py-1.5! text-xs!`}>
              Купить
            </Link>
          ) : (
            <span className={`${btnPrimary} flex-1 cursor-not-allowed px-2! py-1.5! text-xs! opacity-50`}>
              Нет в наличии
            </span>
          )}
          <button
            onClick={handleAddToCart}
            aria-label="В корзину"
            className={`${btnSecondary} px-2! py-1.5!`}
            type="button"
            disabled={!isInStock}
          >
            <ShoppingCart className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
