import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductDetail, type ProductDetailData } from '@/components/commerce/ProductView';
import { btnPrimary } from '@/lib/btn';

export default function ProductPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          if (!cancelled) {
            setProduct(null);
            setError(true);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setProduct(data.product ?? null);
          setError(!(data.product));
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="p-10 text-center text-sm text-muted">Загрузка товара...</p>;

  if (error || !product) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-4xl font-bold text-red-600">Товар не найден (404)</h1>
        <p className="mt-4 text-fg/80">Возможно, товар удалён или ссылка неверная.</p>
        <Link to="/catalog" className={`${btnPrimary} mt-8`}>
        ← Вернуться в каталог
      </Link>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}
