import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { btnSecondary } from '@/lib/btn';

const selectCls =
  'w-full appearance-none rounded-lg bg-surface px-3 py-2.5 text-sm font-medium text-fg shadow-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-emerald-500';

type CategoryOption = { id: string; name: string };

type CatalogFiltersProps = {
  categories?: CategoryOption[];
  initial: {
    q: string;
    sort: string;
    category: string;
    platform: string;
    min: string;
    max: string;
    inStock: boolean;
    discount: boolean;
  };
};

export function CatalogFilters({ categories = [], initial }: CatalogFiltersProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const [q, setQ] = useState(initial.q);
  const [sort, setSort] = useState(initial.sort);
  const [category, setCategory] = useState(initial.category);
  const [platform, setPlatform] = useState(initial.platform);
  const [min, setMin] = useState(initial.min);
  const [max, setMax] = useState(initial.max);
  const [inStock, setInStock] = useState(initial.inStock);
  const [discount, setDiscount] = useState(initial.discount);
  const ready = useRef(false);

  const apply = (overrides?: Partial<Record<string, string | boolean>>) => {
    const next = new URLSearchParams(searchParams.toString());
    const values = { q, sort, category, platform, min, max, inStock, discount, ...overrides };

    const put = (key: string, value: string | boolean) => {
      if (typeof value === 'boolean') {
        if (value) next.set(key, '1');
        else next.delete(key);
        return;
      }
      const t = value.trim();
      if (t) next.set(key, t);
      else next.delete(key);
    };

    put('q', String(values.q));
    put('sort', String(values.sort));
    put('category', String(values.category));
    put('platform', String(values.platform));
    put('min', String(values.min));
    put('max', String(values.max));
    put('inStock', Boolean(values.inStock));
    put('discount', Boolean(values.discount));
    next.delete('page');

    const qs = next.toString();
    navigate(qs ? `${pathname}?${qs}` : pathname);
  };

  // debounce поиска
  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }
    const t = setTimeout(() => apply(), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!ready.current) return;
    apply();
  }, [sort, category, platform, min, max, inStock, discount]);

  const reset = () => {
    setQ('');
    setSort('');
    setCategory('');
    setPlatform('');
    setMin('');
    setMax('');
    setInStock(false);
    setDiscount(false);
    navigate(pathname);
  };

  const chips: Array<{ key: string; label: string }> = [];
  if (q) chips.push({ key: 'q', label: `Поиск: ${q}` });
  if (sort) chips.push({ key: 'sort', label: `Сорт: ${sort}` });
  if (category) chips.push({ key: 'category', label: category });
  if (platform) chips.push({ key: 'platform', label: platform });
  if (min) chips.push({ key: 'min', label: `от ${min}` });
  if (max) chips.push({ key: 'max', label: `до ${max}` });
  if (inStock) chips.push({ key: 'inStock', label: 'в наличии' });
  if (discount) chips.push({ key: 'discount', label: 'скидка' });

  return (
    <div className="mb-4 space-y-3 rounded-lg border border-line bg-surface/80 p-3">
      <div className="flex items-center justify-between">
        <b>Фильтры</b>
        <button onClick={reset} className={btnSecondary} type="button">
          Сброс
        </button>
      </div>

      <div>
        <label className="text-sm">Поиск</label>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="название"
          className="mt-1 w-full rounded border border-line bg-surface-raised px-2 py-1.5 text-sm text-fg"
        />
      </div>
      <div>
        <label className="text-sm">Категория</label>
        <select className={`${selectCls} mt-1`} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Любая</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm">Платформа</label>
        <select className={`${selectCls} mt-1`} value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">Любая</option>
          <option value="mobile">Мобильные</option>
          <option value="pc">ПК</option>
        </select>
      </div>
      <div>
        <label className="text-sm">Сортировка</label>
        <select className={`${selectCls} mt-1`} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">По умолчанию</option>
          <option value="popular">Популярные</option>
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена ↓</option>
        </select>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-sm">Цена от</label>
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="mt-1 w-full rounded border border-line bg-surface-raised px-2 py-1.5 text-sm text-fg"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm">Цена до</label>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="mt-1 w-full rounded border border-line bg-surface-raised px-2 py-1.5 text-sm text-fg"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
          В наличии
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={discount} onChange={(e) => setDiscount(e.target.checked)} />
          Со скидкой
        </label>
      </div>

      {chips.length > 0 ? (
        <p className="text-xs text-muted">{chips.map((c) => c.label).join(' · ')}</p>
      ) : null}
    </div>
  );
}
