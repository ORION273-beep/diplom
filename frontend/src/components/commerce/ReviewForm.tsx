import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, parseApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/AuthContext';
import { btnPrimary } from '@/lib/btn';

export function ReviewForm() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  if (!user) {
    return (
      <div className="mt-10 rounded-lg border border-line p-4">
        <p className="text-sm text-fg/80">Чтобы оставить отзыв — войди и сделай хотя бы один заказ.</p>
        <Link to="/login?next=/reviews" className={`${btnPrimary} mt-3`}>
          Войти
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <p className="mt-10 text-sm text-fg/80">Спасибо — отзыв ушёл на модерацию.</p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (text.trim().length < 10) {
      setFormError('Хотя бы 10 символов');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, text: text.trim() }),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, 'Не отправилось'));
      }
      setSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-4 border-t border-line pt-8">
      <h2 className="text-md font-semibold text-fg">Написать отзыв</h2>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      <div>
        <label className="mb-2 block text-sm text-fg/80">Оценка</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`rounded px-2 text-lg ${rating >= n ? 'text-amber-400' : 'text-muted'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm text-fg/80">Текст</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Как прошла покупка…"
          rows={4}
          required
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-emerald-500"
        />
      </div>
      <button type="submit" disabled={submitting} className={btnPrimary}>
        {submitting ? 'Шлю…' : 'Отправить'}
      </button>
    </form>
  );
}
