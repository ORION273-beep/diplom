import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { parseApiError } from '@/lib/api/client';
import type { AdminProduct } from '@/lib/api/client';
import { btnPrimary, btnSecondary, btnDanger } from '@/lib/btn';

type Product = AdminProduct;

const empty = {
  title: '',
  category: 'currency',
  platform: 'mobile',
  price: '',
  oldPrice: '',
  image: '',
  description: '',
  stock: '100',
  popular: false,
  gameSlug: '',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/products');
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const clearForm = () => {
    setForm(empty);
    setEditingId(null);
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      category: p.category,
      platform: p.platform,
      price: String(p.price),
      oldPrice: p.oldPrice != null ? String(p.oldPrice) : '',
      image: p.image,
      description: p.description ?? '',
      stock: String(p.stock),
      popular: p.popular,
      gameSlug: p.gameSlug ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      title: form.title,
      category: form.category,
      platform: form.platform,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      image: form.image,
      description: form.description.trim() || null,
      stock: Number(form.stock),
      popular: form.popular,
      gameSlug: form.gameSlug || null,
    };
    try {
      const res = await apiFetch(editingId ? `/api/admin/products/${editingId}` : '/api/admin/products', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return;
      }
      clearForm();
      await load();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить товар?')) return;
    const res = await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      return;
    }
    if (editingId === id) clearForm();
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Товары</h1>
        <p className="text-sm text-muted">{products.length} шт.</p>
      </div>

      <form onSubmit={save} className="space-y-3 rounded-xl border border-line p-4">
        <h2 className="font-medium">{editingId ? 'Редактирование' : 'Новый товар'}</h2>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Название</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Категория</label>
          <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
          <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Платформа</label>
          <input type="text" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Цена</label>
          <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
          <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Старая цена</label>
          <input type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Картинка (url)</label>
          <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Описание</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">Остаток</label>
          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
          <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg/80">gameSlug</label>
          <input type="text" value={form.gameSlug} onChange={(e) => setForm({ ...form, gameSlug: e.target.value })} className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-fg shadow-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500" />
        </div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-fg/80">
          <input
            type="checkbox"
            checked={form.popular}
            onChange={(e) => setForm({ ...form, popular: e.target.checked })}
            className="size-4 rounded border-line"
          />
          Популярный
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className={btnPrimary}>
        <Plus className="size-4" />
        {saving ? '...' : editingId ? 'Обновить' : 'Создать'}
      </button>
          {editingId ? (
            <button type="button" onClick={clearForm} className={btnSecondary}>
        Сброс
      </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-muted">Загрузка...</p>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-muted">
                  {p.price} ₽ · остаток {p.stock} · {p.category}
                </div>
              </div>
              <div className="flex gap-2">
                <button className={btnSecondary} type="button" onClick={() => startEdit(p)}>
        Изменить
      </button>
                <button className={btnDanger} type="button" onClick={() => remove(p.id)}>
        <Trash2 className="size-4" />
        Удал.
      </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
