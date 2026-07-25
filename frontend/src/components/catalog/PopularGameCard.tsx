import { Link } from 'react-router-dom';

export type PopularGameCardGame = {
  id: string | number;
  slug: string;
  name: string;
  cover: string;
  genres?: string[];
};

export function PopularGameCard({ game }: { game: PopularGameCardGame }) {
  const genreLine = game.genres?.slice(0, 2).join(' · ');

  return (
    <Link
      to={`/games/${game.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-emerald-500/40"
    >
      <div className="relative aspect-3/4 overflow-hidden bg-surface-raised">
        <img
          src={game.cover}
          alt={game.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute right-2 top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Топ
        </span>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-white">{game.name}</h3>
          {genreLine ? <p className="mt-1 line-clamp-1 text-xs text-white/70">{genreLine}</p> : null}
        </div>
      </div>
    </Link>
  );
}
