import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { parseApiError } from '@/lib/api/client';
import { btnPrimary, btnSecondary, btnDanger } from '@/lib/btn';

type Game = {
  id: string;
  slug: string;
  name: string;
  cover: string;
  genres: string[];
  platforms: string[];
  description?: string | null;
  popular: boolean;
};

const blank = {
  slug: '',
  name: '',
  cover: '',
  genres: '',
  platforms: '',
  description: '',
  popular: false,
};

function packGameFields(form: typeof blank) {
  const splitCsv = (raw: string) => raw.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    cover: form.cover.trim(),
    genres: splitCsv(form.genres),
    platforms: splitCsv(form.platforms),
    description: form.description.trim() || null,
    popular: form.popular,
  };
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/games');
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setGames(data.games || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  function fillFrom(game: Game) {
    setEditingId(game.id);
    setForm({
      slug: game.slug,
      name: game.name,
      cover: game.cover,
      genres: (game.genres ?? []).join(', '),
      platforms: (game.platforms ?? []).join(', '),
      description: game.description ?? '',
      popular: game.popular,
    });
  }

  const clearForm = () => {
    setEditingId(null);
    setForm(blank);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = packGameFields(form);
      const res = await apiFetch(editingId ? `/api/admin/games/${editingId}` : '/api/admin/games', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return;
      }
      clearForm();
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить игру?')) return;
    const res = await apiFetch(`/api/admin/games/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      return;
    }
    await reload();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Игры</h1>
      <form onSubmit={onSave} className="space-y-3 rounded-xl border border-line p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">slug</label>
          <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Название</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Обложка URL</label>
          <input type="text" value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Жанры</label>
          <input type="text" value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Платформы</label>
          <input type="text" value={form.platforms} onChange={(e) => setForm({ ...form, platforms: e.target.value })} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Описание</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-fg/80">
          <input
            type="checkbox"
            checked={form.popular}
            onChange={(e) => setForm({ ...form, popular: e.target.checked })}
            className="size-4 rounded border-line"
          />
          Популярная
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className={btnPrimary}>
        {editingId ? 'Обновить' : 'Создать'}
      </button>
          {editingId ? <button type="button" onClick={clearForm} className={btnSecondary}>
        Сброс
      </button> : null}
        </div>
      </form>
      {loading ? <p>Загрузка...</p> : (
        <ul className="space-y-2">
          {games.map((game) => (
            <li key={game.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
              <button type="button" className="text-left" onClick={() => fillFrom(game)}>
                <div className="font-medium">{game.name}</div>
                <div className="text-xs text-muted">{game.slug}</div>
              </button>
              <button className={btnDanger} type="button" onClick={() => remove(game.id)}>
        <Trash2 className="size-4" />
        Удал.
      </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
