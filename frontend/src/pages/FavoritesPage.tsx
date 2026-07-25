import { Heart } from 'lucide-react';
import { ProductCard } from '@/components/commerce/ProductCard';
import { RequireAuth } from '@/lib/RequireAuth';
import { useFavorites } from '@/lib/FavoritesContext';
import { btnPrimary, btnSecondary } from '@/lib/btn';
import { Link } from 'react-router-dom';

export default function FavoritesPage() {
  return (
    <RequireAuth loginReason="favorites">
      <FavoritesPageContent />
    </RequireAuth>
  );
}

function FavoritesPageContent() {
  const { items, clearFavorites } = useFavorites();

  return (
    <section className="container mx-auto px-4 py-8 pb-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Избранное</h1>
        </div>
        {items.length > 0 && (
          <button onClick={clearFavorites} className={btnSecondary} type="button">
        Очистить
      </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <Heart className="size-10 text-muted" />
          <h2 className="text-lg font-semibold text-fg">Пока пусто</h2>
          <p className="max-w-sm text-sm text-muted">Жми сердечко на карточке — вернёшься сюда быстрее</p>
          <Link to="/games" className={`${btnPrimary} mt-2`}>
        К играм
      </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
