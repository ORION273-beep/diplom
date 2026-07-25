import { Link } from 'react-router-dom';
import { btnSecondary } from '@/lib/btn';

const SECTIONS = [
  {
    h: 'Сервис',
    p: 'Мы продаём цифровые товары (валюта, ключи, подписки и т.п.). Сайт можно использовать только в законных целях. Обход защиты, скамы и мультиаккаунты для абуза — основание для блокировки.',
  },
  {
    h: 'Аккаунт',
    p: 'За достоверность email и прочих данных отвечаешь ты. Передавать доступ к аккаунту третьим лицам нельзя — последствия таких действий на тебе.',
  },
  {
    h: 'Оплата',
    p: 'Заказ исполняем после подтверждения оплаты. Срок выдачи зависит от типа товара и провайдера. Ограничения сторонних игровых платформ (регион, бан аккаунта и т.д.) — вне нашей зоны ответственности.',
  },
  {
    h: 'Изменения',
    p: 'Текст на этой странице может обновляться. Актуальная версия — всегда здесь.',
  },
] as const;

export default function UserAgreementPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-12 prose-invert">
      <h1 className="text-3xl font-semibold text-fg">Пользовательское соглашение</h1>
      <p className="mt-4 leading-relaxed text-fg/80">
        Пользуясь OneSec, ты соглашаешься с этими условиями, а также с{' '}
        <Link to="/rules" className="text-emerald-400 underline">
          правилами магазина
        </Link>{' '}
        и{' '}
        <Link to="/refund-policy" className="text-emerald-400 underline">
          политикой возврата
        </Link>
        .
      </p>

      {SECTIONS.map((s) => (
        <div key={s.h}>
          <h2 className="mt-8 text-lg font-semibold text-fg">{s.h}</h2>
          <p className="mt-2 leading-relaxed text-fg/80">{s.p}</p>
        </div>
      ))}

      <div className="mt-10">
        <Link to="/contacts" className={btnSecondary}>
        Вопросы — в контакты
      </Link>
      </div>
    </article>
  );
}
