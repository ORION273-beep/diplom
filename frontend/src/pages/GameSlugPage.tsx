import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Monitor, Smartphone, Star } from 'lucide-react';
import type { Product } from '@/lib/api/client';
import { ProductCard } from '@/components/commerce/ProductCard';
import { btnPrimary } from '@/lib/btn';

interface Game {
  id: string | number;
  slug: string;
  name: string;
  cover: string;
  genres: string[];
  platforms: string[];
  description: string;
  popular?: boolean;
}


export default function GameSlugPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [gameRes, productsRes] = await Promise.all([
          fetch(`/api/games/${encodeURIComponent(slug)}`),
          fetch(`/api/products?gameSlug=${encodeURIComponent(slug)}`),
        ]);
        if (cancelled) return;
        if (!gameRes.ok) {
          setNotFoundState(true);
          setGame(null);
          setProducts([]);
          return;
        }
        const gameData = await gameRes.json();
        const productsData = productsRes.ok ? await productsRes.json() : { products: [] };
        setGame(gameData.game || null);
        setProducts(productsData.products || []);
        setNotFoundState(!gameData.game);
      } catch {
        if (!cancelled) setNotFoundState(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <div className="container mx-auto px-4 py-12 text-muted">Загрузка игры...</div>;

  if (notFoundState || !game) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-red-600">Игра не найдена</h1>
        <Link to="/games" className={`${btnPrimary} mt-8`}>
        ← Все игры
      </Link>
      </div>
    );
  }

  const genres = game.genres ?? [];
  const platforms = game.platforms ?? [];

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <Link
        to="/games"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-emerald-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Все игры
      </Link>

      <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-r from-secondary to-surface-alt p-8 lg:p-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div className="relative mb-8 aspect-video overflow-hidden rounded-2xl lg:mb-0 lg:aspect-[4/3]">
            <img
              src={game.cover}
              alt={game.name}
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
            {game.popular && (
              <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 px-3 py-1.5 text-xs font-bold text-black shadow-lg backdrop-blur-sm">
                <Star className="size-3" />
                Популярная
              </div>
            )}
          </div>

          <div className="space-y-6 lg:pt-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-fg lg:text-3xl">
                {game.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-fg/80">
                {genres.map((genre, i) => (
                  <span key={i} className="rounded-full bg-surface-raised px-3 py-1">
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-lg leading-relaxed text-fg/80 lg:text-xl">{game.description}</p>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
                <Monitor className="size-4" />
                Доступно на
              </h3>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600/10 px-3 py-1.5 text-xs font-medium text-emerald-400"
                  >
                    {platform.includes('Android') || platform.includes('iOS') ? (
                      <Smartphone className="size-3" />
                    ) : (
                      <Monitor className="size-3" />
                    )}
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Товары для <span className="text-emerald-400">{game.name}</span>
          </h2>
          <span className="text-sm text-muted">{products.length} товаров</span>
        </div>

        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center">
            <p className="font-medium">Пока нет товаров для этой игры</p>
            <p className="mt-1 text-sm text-muted">Загляни в общий каталог</p>
            <Link to="/catalog" className={`${btnPrimary} mt-4`}>
        Каталог
      </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {products.length > 0 && (
        <div className="mt-12 rounded-xl border border-line bg-surface-raised p-8 text-center">
          <h3 className="mb-3 text-xl font-bold text-emerald-400">Не нашли нужное?</h3>
          <Link to="/catalog" className={btnPrimary}>
        Весь каталог
      </Link>
        </div>
      )}
    </div>
  );
}
