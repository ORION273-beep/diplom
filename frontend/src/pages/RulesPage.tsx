import { btnSecondary } from '@/lib/btn';
import { Link } from 'react-router-dom';

const numbered: { n: number; text: string }[] = [
  { n: 1, text: 'Указывай рабочий email и правильные данные игрового аккаунта — иначе выдача может зависнуть.' },
  { n: 2, text: 'После оплаты заказ уходит в обработку; обычно цифровой товар приходит за несколько минут.' },
  { n: 3, text: 'Иногда платёж проверяем вручную — это не баг, просто антифрод.' },
  { n: 4, text: 'Споры и возвраты — через поддержку, с номером заказа и скринами.' },
  { n: 5, text: 'Не свети пароль от профиля OneSec и игровых аккаунтов посторонним.' },
];

export default function RulesPage() {
  return (
    <section className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-fg">Правила магазина</h1>
      <p className="mt-2 text-sm text-muted">Коротко, без юридической простыни.</p>

      <ol className="mt-8 list-decimal space-y-4 pl-5 text-fg/80">
        {numbered.map(({ n, text }) => (
          <li key={n} className="pl-1 leading-relaxed">
            {text}
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/user-agreement" className={btnSecondary}>
        Соглашение
      </Link>
        <Link to="/refund-policy" className={btnSecondary}>
        Возвраты
      </Link>
      </div>
    </section>
  );
}
