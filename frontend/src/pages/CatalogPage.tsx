import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ProductCard } from '@/components/commerce/ProductCard';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { fetchCategories, fetchProducts, type Category, type Product } from '@/lib/api/client';

export default function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sort = searchParams.get('sort') ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const category = searchParams.get('category') ?? undefined;
  const platform = searchParams.get('platform') ?? undefined;
  const min = searchParams.get('min') ?? undefined;
  const max = searchParams.get('max') ?? undefined;
  const inStock = searchParams.get('inStock') ?? undefined;
  const discount = searchParams.get('discount') ?? undefined;
  const page = searchParams.get('page') || '1';
  const onlyInStock = inStock === '1';
  const onlyDiscount = discount === '1';

  const filtersKey = searchParams.toString();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number } | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [{ products: p, pagination: pag, error: e }, { categories: cats }] = await Promise.all([
        fetchProducts({
          sort,
          q,
          category,
          platform,
          min,
          max,
          inStock,
          discount,
          page,
          limit: '12',
        }),
        fetchCategories(),
      ]);
      if (cancelled) return;
      setProducts(p);
      setPagination(pag);
      setError(e);
      setCategories(cats);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [filtersKey, sort, q, category, platform, min, max, inStock, discount, page]);

  const filterParams = {
    sort,
    q,
    category,
    platform,
    min,
    max,
    inStock: onlyInStock ? '1' : undefined,
    discount: onlyDiscount ? '1' : undefined,
  };

  const filterInitial = {
    q: q ?? '',
    sort: sort ?? '',
    category: category ?? '',
    platform: platform ?? '',
    min: min ?? '',
    max: max ?? '',
    inStock: onlyInStock,
    discount: onlyDiscount,
  };

  if (loading) return <p className="py-16 text-center text-muted">Загрузка каталога...</p>;

  return (
    <section className="min-h-[70vh]">
      <div className="border-b border-line px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-fg md:text-2xl">Каталог</h1>
            <p className="mt-0.5 text-sm text-muted">
              {sort === 'popular' ? 'Сначала популярные' : 'Все позиции магазина'}
            </p>
          </div>
          <p className="text-sm tabular-nums text-muted">{pagination?.total ?? products.length} шт.</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 md:px-8 lg:grid-cols-[240px_1fr] lg:py-8">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap gap-1.5 lg:flex-col">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={category === cat.id ? '/catalog' : `/catalog?category=${cat.id}`}
                className={`rounded-md px-2.5 py-1.5 text-xs transition-colors lg:w-full ${
                  category === cat.id
                    ? 'bg-emerald-600/15 font-medium text-emerald-400'
                    : 'text-fg/80 hover:bg-surface-raised hover:text-fg'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="border-t border-line pt-4">
            <CatalogFilters categories={categories} initial={filterInitial} />
          </div>
        </aside>

        <div>
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : products.length === 0 ? (
            <p className="py-12 text-sm text-muted">По этим фильтрам ничего нет.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {pagination && pagination.pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3 py-4">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => {
                      const nextPage = pagination.page - 1;
                      const params = new URLSearchParams();
                      Object.entries(filterParams).forEach(([key, value]) => {
                        if (value) params.set(key, value);
                      });
                      if (nextPage > 1) params.set('page', String(nextPage));
                      const qs = params.toString();
                      navigate(qs ? `/catalog?${qs}` : '/catalog');
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-line disabled:opacity-40"
                  >
                    ← Назад
                  </button>
                  <span className="text-sm text-muted">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => {
                      const nextPage = pagination.page + 1;
                      const params = new URLSearchParams();
                      Object.entries(filterParams).forEach(([key, value]) => {
                        if (value) params.set(key, value);
                      });
                      if (nextPage > 1) params.set('page', String(nextPage));
                      const qs = params.toString();
                      navigate(qs ? `/catalog?${qs}` : '/catalog');
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-line disabled:opacity-40"
                  >
                    Вперёд →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
