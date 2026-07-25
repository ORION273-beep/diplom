import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

const footerLinks = {
  main: [
    { title: 'Каталог', href: '/catalog' },
    { title: 'Популярное', href: '/catalog?sort=popular' },
    { title: 'Акции', href: '/promotions' },
    { title: 'Отзывы', href: '/reviews' },
  ],
  support: [
    { title: 'Контакты', href: '/contacts' },
    { title: 'FAQ', href: '/faq' },
    { title: 'Правила магазина', href: '/rules' },
    { title: 'Пользовательское соглашение', href: '/user-agreement' },
    { title: 'Политика возврата', href: '/refund-policy' },
  ],
  social: [{ title: 'Telegram', href: 'https://t.me/Orion434' }],
};

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface/80">
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Logo href="/" />
            <p className="mt-4 text-sm text-muted">
              Магазин игровой валюты, ключей и подписок.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg/80">
              Навигация
            </h3>
            <ul className="space-y-2">
              {footerLinks.main.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted transition-colors hover:text-emerald-400"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg/80">
              Поддержка
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted transition-colors hover:text-emerald-400"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg/80">
              Соцсети
            </h3>
            <ul className="space-y-2">
              {footerLinks.social.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted transition-colors hover:text-emerald-400"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-center text-sm text-muted">
          © {new Date().getFullYear()} OneSec
        </div>
      </div>
    </footer>
  );
}
