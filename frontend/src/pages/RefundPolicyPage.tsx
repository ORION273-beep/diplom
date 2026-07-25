import { useState } from 'react';
import { btnPrimary, btnSecondary } from '@/lib/btn';
import { Link } from 'react-router-dom';

const faqs: Record<string, { q: string; a: string }> = {
  not_delivered: {
    q: 'Можно вернуть деньги, если товар не пришёл?',
    a: 'Да, если оплата прошла, а выдача не состоялась в разумный срок — пиши в поддержку с номером заказа.',
  },
  wrong_id: {
    q: 'Вернут ли оплату, если я ошибся в ID аккаунта?',
    a: 'Чаще нет: товар мог уйти на чужой аккаунт. Проверяй данные до оплаты.',
  },
  wait: {
    q: 'Сколько ждать ответа по возврату?',
    a: 'Обычно 1–3 рабочих дня. В пиковые дни может быть дольше.',
  },
  attach: {
    q: 'Что приложить к обращению?',
    a: 'Номер заказа, email, скрин оплаты и описание проблемы.',
  },
};

const FAQ_KEYS = Object.keys(faqs);

export default function RefundPolicyPage() {
  const [open, setOpen] = useState<string | null>(FAQ_KEYS[0] ?? null);

  return (
    <section className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-fg">Возвраты</h1>
      <p className="mt-2 text-sm text-muted">Частые вопросы — кликни, чтобы раскрыть ответ.</p>

      <div className="mt-8 divide-y divide-line rounded-xl border border-line">
        {FAQ_KEYS.map((id) => {
          const item = faqs[id];
          return (
            <div key={id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={() => setOpen(open === id ? null : id)}
              >
                <span className="font-medium text-fg">{item.q}</span>
                <span className="text-muted">{open === id ? '−' : '+'}</span>
              </button>
              <div className={open !== id ? 'hidden px-4 pb-3 text-sm text-fg/80' : 'px-4 pb-3 text-sm text-fg/80'}>{item.a}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/contacts" className={btnPrimary}>
        Написать в поддержку
      </Link>
        <Link to="/rules" className={btnSecondary}>
        Правила
      </Link>
      </div>
    </section>
  );
}
