import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export default function FaqPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/faq')
      .then(async (r) => {
        if (!r.ok) throw new Error('не загрузилось');
        return r.json();
      })
      .then((data) => setItems(data.items || []))
      .catch(() => setError('не загрузилось'));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-semibold">FAQ</h1>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!error && items.length === 0 && <p className="mt-4 text-muted">пока пусто</p>}
      {items.map((item) => (
        <details key={item.id} className="my-3">
          <summary className="cursor-pointer font-medium">{item.question}</summary>
          <p className="mt-1 text-sm text-fg/80">{item.answer}</p>
        </details>
      ))}
      <p className="mt-8 text-sm text-muted">
        не нашёл ответ —{' '}
        <Link to="/contacts" className="text-emerald-400 hover:underline">
          напиши нам
        </Link>
      </p>
    </div>
  );
}
