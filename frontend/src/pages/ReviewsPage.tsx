import { useEffect, useState } from 'react';
import { ReviewForm } from '@/components/commerce/ReviewForm';

type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt?: string;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/reviews')
      .then(async (res) => {
        if (!res.ok) throw new Error('Отзывы сейчас не открылись');
        return res.json() as Promise<{ reviews?: Review[] }>;
      })
      .then((data) => {
        if (!alive) return;
        setReviews(data.reviews ?? []);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Сервер не отвечает');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <p className="py-16 text-center text-sm text-muted">Секунду, отзывы...</p>;

  return (
    <section className="mx-auto max-w-xl px-4 py-10 md:py-14">
      <header className="mb-10 text-center">
        <h1 className="text-2xl font-semibold text-fg">Отзывы</h1>
        <p className="mt-1 text-sm text-muted">Лента после покупок</p>
      </header>

      {error && <p className="mb-6 text-center text-sm text-red-600">{error}</p>}

      <ol className="relative space-y-0 border-l border-line pl-6">
        {reviews.length === 0 && !error ? (
          <li className="pb-8 text-sm text-muted">Пока тишина — можешь оставить первый ниже.</li>
        ) : (
          reviews.map((review, i) => {
            const stamp =
              review.createdAt != null
                ? new Date(review.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                  })
                : `#${i + 1}`;
            return (
              <li key={review.id} className="relative pb-8 last:pb-0">
                <span className="absolute -left-[1.6rem] top-1 size-2.5 rounded-full bg-emerald-600 ring-4 ring-line" />
                <time className="text-xs font-medium uppercase tracking-wide text-muted">{stamp}</time>
                <p className="mt-1 text-xs text-emerald-400">{'★'.repeat(review.rating)}</p>
                <p className="mt-2 text-sm leading-relaxed text-fg">{review.text}</p>
                <p className="mt-2 text-xs text-muted">{review.author}</p>
              </li>
            );
          })
        )}
      </ol>

      <div className="mt-12 border-t border-line pt-8">
        <ReviewForm />
      </div>
    </section>
  );
}
