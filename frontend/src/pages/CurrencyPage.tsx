import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/commerce/ProductCard';
import { fetchProducts, type Product } from '@/lib/api/client';
import { btnSecondary } from '@/lib/btn';
import { Link } from 'react-router-dom';

export default function CurrencyPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts({ currency: '1', limit: '100' }).then(({ products: items, error: e }) => {
      setProducts(items);
      setError(e);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="py-16 text-center text-muted">Загрузка...</p>;

  return (
    <section className="min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-8">
        <h1 className="text-xl font-semibold text-fg md:text-2xl">Игровая валюта</h1>
        <p className="mt-0.5 text-sm text-muted">UC, кристаллы, робуксы и т.п.</p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 lg:py-8">
        {error ? <p className="text-red-600">{error}</p> : null}
        {!error && products.length === 0 ? (
          <div className="py-10 text-center">
            <p>Пока пусто</p>
            <Link to="/catalog" className={`${btnSecondary} mt-4`}>
              В каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
