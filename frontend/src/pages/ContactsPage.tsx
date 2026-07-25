import { Link } from 'react-router-dom';

export default function ContactsPage() {
  return (
    <section className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-fg">Контакты</h1>
      <p className="mt-2 text-sm text-muted">По вопросам заказов и выдачи.</p>

      <ul className="mt-8 space-y-3 text-fg/80">
        <li>
          Почта:{' '}
          <a href="mailto:support@onesec.shop" className="text-emerald-400 hover:underline">
            support@onesec.shop
          </a>
        </li>
        <li>
          Telegram:{' '}
          <a
            href="https://t.me/Orion434"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            @Orion434
          </a>
        </li>
      </ul>

      <p className="mt-6 text-sm text-fg/80">
        Пиши с 9 до 23 мск. В письме кинь номер заказа, если есть.
      </p>

      <p className="mt-10 text-sm text-muted">
        <Link to="/faq" className="text-emerald-400 hover:underline">
          FAQ
        </Link>
        {' · '}
        <Link to="/rules" className="text-emerald-400 hover:underline">
          Правила
        </Link>
      </p>
    </section>
  );
}
