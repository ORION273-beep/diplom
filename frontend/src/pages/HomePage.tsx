import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/commerce/ProductCard';
import { PopularGameCard } from '@/components/catalog/PopularGameCard';
import type { Product } from '@/lib/api/client';
import { btnPrimary, btnSecondary } from '@/lib/btn';

type Game = {
  id: string | number;
  slug: string;
  name: string;
  cover: string;
  genres?: string[];
  popular?: boolean;
};

export default function HomePage() {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [productsRes, gamesRes] = await Promise.all([
          fetch('/api/products?popular=1'),
          fetch('/api/games'),
        ]);

        if (!productsRes.ok || !gamesRes.ok) {
          if (!cancelled) {
            setError('Не удалось загрузить данные.');
            setRecommendedProducts([]);
            setPopularGames([]);
          }
          return;
        }

        const productsData = await productsRes.json();
        const gamesData = await gamesRes.json();
        if (cancelled) return;
        setRecommendedProducts(productsData.products ?? []);
        setPopularGames((gamesData.games ?? []).filter((game: Game) => game.popular));
        setError(null);
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить. Попробуйте позже.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="py-20 text-center text-muted">Секунду...</p>;

  const heroMainGame = popularGames[0];

  return (
    <div>
      <section className="border-b border-line/80">
        <div className="container mx-auto grid items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div className="animate-fade-up">
            <h1 className="text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              Донат и ключи <span className="text-emerald-400">для игр</span>
            </h1>
            <p className="mt-3 max-w-md text-muted">
              Валюта, подписки, ключи — цены в каталоге, выдача после оплаты.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/catalog" className={btnPrimary}>
                В каталог
              </Link>
              <Link to="/games" className={btnSecondary}>
                Игры
              </Link>
            </div>
          </div>
          {heroMainGame?.cover ? (
            <div className="animate-fade-up-delay group overflow-hidden rounded-xl border border-line">
              <img
                src={heroMainGame.cover}
                alt={heroMainGame.name}
                className="w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center rounded-xl border border-line bg-surface-raised text-sm text-muted md:h-72">
              OneSec
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="container mx-auto px-4 pt-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold text-fg">Что берут чаще</h2>
        {recommendedProducts.length === 0 ? (
          <p className="text-sm text-muted">Популярных позиций пока нет</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {recommendedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <section className="border-t border-line bg-surface-raised/70">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <h2 className="mb-6 text-xl font-semibold text-fg">Популярные игры</h2>
          {popularGames.length === 0 ? (
            <p className="text-sm text-muted">Список игр пуст</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {popularGames.map((game) => (
                  <PopularGameCard key={game.id} game={game} />
                ))}
              </div>
              <div className="mt-8 flex justify-center md:mt-10">
                <Link
                  to="/games"
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-emerald-500/40 hover:bg-surface-alt"
                >
                  Все игры
                  <span aria-hidden className="text-muted">
                    →
                  </span>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
