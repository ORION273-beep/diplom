import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/commerce/ProductCard';
import { fetchProducts, type Product } from '@/lib/api/client';
import { btnPrimary } from '@/lib/btn';
import { Link } from 'react-router-dom';

export default function SubscriptionsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      const { products, error } = await fetchProducts({ category: 'subscriptions' });
      if (ac.signal.aborted) return;
      setItems(products);
      setErr(error);
      setLoading(false);
    })();
    return () => ac.abort();
  }, []);

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="mb-8 max-w-xl">
        <h1 className="text-3xl font-bold">Подписки</h1>
        <p className="mt-2 text-muted">Netflix, Spotify и прочее. После оплаты смотри заказ в профиле.</p>
      </div>

      {loading ? <p>Гружу...</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      {!loading && items.length === 0 ? (
        <div className="py-8">
          <p>Пока нет позиций</p>
          <Link to="/catalog" className={`${btnPrimary} mt-4`}>
        Каталог
      </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
