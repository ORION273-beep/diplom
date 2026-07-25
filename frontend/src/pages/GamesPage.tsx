import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Game {
  id: string | number;
  slug: string;
  name: string;
  cover: string;
  genres?: string[];
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/games');
        if (!res.ok) {
          if (!cancelled) setError('Список игр не открылся — проверь backend.');
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setGames(data.games || []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('Сервер недоступен (:4000).');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="p-10 text-center">Загрузка игр...</p>;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="mb-3 text-2xl font-semibold">Игры</h1>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Игры</h1>
      <p className="mb-6 text-sm text-muted">{games.length} в каталоге</p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {games.length === 0 ? (
          <p className="col-span-full text-sm text-muted">Пока ни одной игры</p>
        ) : (
          games.map((game) => (
            <Link
              key={game.slug}
              to={`/games/${game.slug}`}
              className="group overflow-hidden rounded-xl border border-line bg-surface-raised hover:border-emerald-500/50"
            >
              <div className="aspect-video overflow-hidden bg-surface">
                <img src={game.cover} alt={game.name} className="size-full object-cover group-hover:scale-105" />
              </div>
              <div className="p-3">
                <h2 className="font-semibold">{game.name}</h2>
                {game.genres?.length ? <p className="text-xs text-muted">{game.genres.slice(0, 2).join(' · ')}</p> : null}
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
