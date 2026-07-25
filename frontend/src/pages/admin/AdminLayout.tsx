import { Link, Outlet, useLocation } from 'react-router-dom';
import { RequireAdmin } from '@/lib/RequireAuth';

const navItems = [
  { label: 'Обзор', href: '/admin' },
  { label: 'Заказы', href: '/admin/orders' },
  { label: 'Товары', href: '/admin/products' },
  { label: 'Игры', href: '/admin/games' },
  { label: 'Люди', href: '/admin/users' },
  { label: 'Отзывы', href: '/admin/reviews' },
  { label: 'FAQ', href: '/admin/faq' },
];

export default function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <RequireAdmin>
      <div className="flex min-h-screen bg-page text-fg">
        <aside className="hidden w-48 shrink-0 border-r border-line bg-surface/60 p-4 lg:block">
          <p className="mb-4 font-semibold text-fg">Админка</p>
          <nav className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={pathname === item.href ? 'font-semibold text-emerald-400' : 'text-fg/80 hover:underline'}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="mt-6 text-sm">
            <Link to="/profile" className="text-muted underline">
              в профиль
            </Link>
          </p>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-3 border-b border-line p-3 text-sm lg:hidden">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} className={pathname === item.href ? 'font-semibold' : ''}>
                {item.label}
              </Link>
            ))}
          </div>
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </RequireAdmin>
  );
}
