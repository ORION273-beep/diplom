import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { parseApiError } from '@/lib/api/client';
import { btnPrimary, btnDanger } from '@/lib/btn';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sort: number;
};

export default function AdminFaqPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ question: '', answer: '', sort: '0' });
  const [fresh, setFresh] = useState({ question: '', answer: '', sort: '0' });
  const [creating, setCreating] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/faq');
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setItems((data.items as FaqItem[]) ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const toggle = (item: FaqItem) => {
    if (openId === item.id) {
      setOpenId(null);
      return;
    }
    setOpenId(item.id);
    setEdit({
      question: item.question,
      answer: item.answer,
      sort: String(item.sort),
    });
  };

  const writeFaqEntry = async (id: string) => {
    const res = await apiFetch(`/api/admin/faq/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: edit.question.trim(),
        answer: edit.answer.trim(),
        sort: Number(edit.sort) || 0,
      }),
    });
    if (!res.ok) {
      return;
    }
    await reload();
  };

  const createFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await apiFetch('/api/admin/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: fresh.question.trim(),
          answer: fresh.answer.trim(),
          sort: Number(fresh.sort) || 0,
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Не удалось добавить вопрос'));
      setFresh({ question: '', answer: '', sort: '0' });
      await reload();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const dropFaq = async (id: string) => {
    if (!confirm('Убрать этот вопрос из FAQ?')) return;
    const res = await apiFetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      return;
    }
    if (openId === id) setOpenId(null);
    await reload();
  };

  return (
    <div>
      <h1 className="text-lg font-semibold">FAQ</h1>

      <form onSubmit={createFaq} className="mt-4 space-y-2 border border-line p-3">
        <p className="text-sm font-medium">Новый</p>
        <input
          type="text"
          placeholder="вопрос"
          value={fresh.question}
          onChange={(e) => setFresh({ ...fresh, question: e.target.value })}
          required
          className="w-full border border-line px-2 py-1 text-sm"
        />
        <textarea
          placeholder="ответ"
          value={fresh.answer}
          onChange={(e) => setFresh({ ...fresh, answer: e.target.value })}
          rows={3}
          required
          className="w-full border border-line px-2 py-1 text-sm"
        />
        <input
          type="text"
          placeholder="порядок"
          value={fresh.sort}
          onChange={(e) => setFresh({ ...fresh, sort: e.target.value })}
          className="w-24 border border-line px-2 py-1 text-sm"
        />
        <div>
          <button type="submit" disabled={creating} className={btnPrimary}>
            {creating ? '...' : 'Добавить'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="mt-4 text-sm text-muted">загрузка...</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items
            .slice()
            .sort((a, b) => a.sort - b.sort)
            .map((item) => (
              <li key={item.id} className="border-b border-line pb-2">
                <button type="button" className="text-left font-medium" onClick={() => toggle(item)}>
                  {item.question} <span className="text-xs text-muted">#{item.sort}</span>
                </button>
                {openId === item.id ? (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={edit.question}
                      onChange={(e) => setEdit({ ...edit, question: e.target.value })}
                      className="w-full border border-line px-2 py-1 text-sm"
                    />
                    <textarea
                      value={edit.answer}
                      onChange={(e) => setEdit({ ...edit, answer: e.target.value })}
                      rows={3}
                      className="w-full border border-line px-2 py-1 text-sm"
                    />
                    <input
                      type="text"
                      value={edit.sort}
                      onChange={(e) => setEdit({ ...edit, sort: e.target.value })}
                      className="w-24 border border-line px-2 py-1 text-sm"
                    />
                    <div className="flex gap-2">
                      <button type="button" className={btnPrimary} onClick={() => writeFaqEntry(item.id)}>
                        Сохранить
                      </button>
                      <button type="button" className={btnDanger} onClick={() => dropFaq(item.id)}>
                        Удалить
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
