import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { btnPrimary, btnSecondary, btnDanger } from '@/lib/btn';

type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  published: boolean;
  createdAt: string;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/reviews');
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setReviews((data.reviews as Review[]) ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews();
  }, []);

  const pending = reviews.filter((r) => !r.published);
  const published = reviews.filter((r) => r.published);

  const setPublished = async (id: string, next: boolean) => {
    try {
      const res = await apiFetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next }),
      });
      if (!res.ok) {
        return;
      }
      void loadReviews();
    } catch {
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Удалить отзыв навсегда?')) return;
    try {
      const res = await apiFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        return;
      }
      void loadReviews();
    } catch {
    }
  };

  if (loading) return <p>загрузка...</p>;

  return (
    <div>
      <h1 className="text-lg font-semibold">Отзывы</h1>
      <p className="text-sm text-muted">
        очередь {pending.length}, на сайте {published.length}
      </p>

      <h2 className="mt-6 font-medium">Ожидают</h2>
      {pending.length === 0 ? (
        <p className="text-sm text-muted">пусто</p>
      ) : (
        pending.map((review) => (
          <div key={review.id} className="mt-3 border-b border-line pb-3">
            <b>{review.author}</b> {'★'.repeat(review.rating)}
            <p className="text-sm">{review.text}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className={btnPrimary} onClick={() => setPublished(review.id, true)}>
                ок
              </button>
              <button type="button" className={btnDanger} onClick={() => deleteReview(review.id)}>
                удалить
              </button>
            </div>
          </div>
        ))
      )}

      <h2 className="mt-8 font-medium">На сайте</h2>
      {published.length === 0 ? (
        <p className="text-sm text-muted">пусто</p>
      ) : (
        published.map((review) => (
          <div key={review.id} className="mt-3 border-b border-line pb-3">
            <b>{review.author}</b> {'★'.repeat(review.rating)}
            <p className="text-sm">{review.text}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className={btnSecondary} onClick={() => setPublished(review.id, false)}>
                скрыть
              </button>
              <button type="button" className={btnDanger} onClick={() => deleteReview(review.id)}>
                удалить
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
