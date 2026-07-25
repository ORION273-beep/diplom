import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts, type Product } from '@/lib/api/client';

export default function PromotionsPage() {
  const [list, setList] = useState<Product[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchProducts({ discount: '1', limit: '12' }).then((r) => {
      setList(r.products);
      if (r.error) setErr(r.error);
    });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-xl font-bold">Скидки</h1>
      <p className="mb-6 text-muted">Товары где указана старая цена.</p>
      {err ? <p className="text-red-600">{err}</p> : null}
      {list.length === 0 && !err ? <p>Сейчас пусто. Смотри <Link to="/catalog">каталог</Link>.</p> : null}
      <ul className="space-y-3">
        {list.map((p) => (
          <li key={p.id} className="border-b border-line pb-3">
            <Link to={`/product/${p.id}`} className="font-medium text-emerald-400 hover:underline">
              {p.title}
            </Link>
            <div className="text-sm">
              <span className="font-semibold">{p.price} ₽</span>
              {p.oldPrice ? (
                <span className="ml-2 text-muted line-through">{p.oldPrice} ₽</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
