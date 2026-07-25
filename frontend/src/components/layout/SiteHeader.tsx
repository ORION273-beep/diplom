import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, LogIn, Menu, ShoppingCart, User, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useCart } from '@/lib/CartContext';
import { useFavorites } from '@/lib/FavoritesContext';
import { useAuth } from '@/lib/AuthContext';
import { btnGhost } from '@/lib/btn';

const navItems = [
  { label: 'Валюта', href: '/catalog/currency' },
  { label: 'Игры', href: '/games' },
  { label: 'Подписки', href: '/catalog/subscriptions' },
];

function CountBadge({ count, tone }: { count: number; tone: 'red' | 'emerald' }) {
  if (count <= 0) return null;
  return (
    <span
      className={`pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-semibold text-white ${
        tone === 'red' ? 'bg-red-600' : 'bg-emerald-600'
      }`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function SiteHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { items: cartItems } = useCart();
  const { items: favoriteItems } = useFavorites();
  const { user } = useAuth();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const favoritesCount = favoriteItems.length;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/catalog?q=${encodeURIComponent(q)}`);
    setMobileOpen(false);
  };

  const searchForm = (
    <form onSubmit={handleSearch} className="w-full">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Поиск товаров..."
        className="w-full rounded-lg bg-surface-raised px-3 py-2 text-sm text-fg ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-emerald-500"
      />
    </form>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:gap-4 md:px-6 lg:px-8">
        <Logo href="/" showTagline className="hidden lg:flex" />
        <Logo href="/" className="lg:hidden" />

        <nav className="ml-1 hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-auto hidden min-w-0 max-w-md flex-1 md:block lg:mx-0 lg:ml-auto">
          {searchForm}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 md:ml-0">
          <div className="relative">
            <Link to="/favorites" aria-label="Избранное" className={btnGhost}>
              <Heart className="size-4" />
            </Link>
            <CountBadge count={favoritesCount} tone="red" />
          </div>
          <div className="relative">
            <Link to="/cart" aria-label="Корзина" className={btnGhost}>
              <ShoppingCart className="size-4" />
            </Link>
            <CountBadge count={totalItems} tone="emerald" />
          </div>
          {user ? (
            <Link to="/profile" aria-label="Профиль" className={btnGhost}>
              <User className="size-4" />
            </Link>
          ) : (
            <Link to="/login" aria-label="Войти" className={btnGhost}>
              <LogIn className="size-4" />
            </Link>
          )}

          <button
            type="button"
            className="rounded-lg p-2 text-fg hover:bg-surface-raised lg:hidden"
            aria-label={mobileOpen ? 'Закрыть меню' : 'Меню'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-line bg-surface lg:hidden">
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-4 md:px-6">
            <div className="md:hidden">{searchForm}</div>
            <ul className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-fg hover:bg-surface-raised"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label === 'Валюта' ? 'Игровая валюта' : item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/catalog"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-fg hover:bg-surface-raised"
                  onClick={() => setMobileOpen(false)}
                >
                  Каталог
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ) : null}
    </header>
  );
}
