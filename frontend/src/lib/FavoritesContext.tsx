import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isLoggedIn, useAuth } from '@/lib/AuthContext';

export type FavoriteProduct = {
  id: string | number;
  title: string;
  price: number;
  oldPrice?: number | null;
  image: string;
};

type FavoritesContextValue = {
  items: FavoriteProduct[];
  isFavorite: (id: string | number) => boolean;
  toggleFavorite: (product: FavoriteProduct) => void;
  removeFavorite: (id: string | number) => void;
  clearFavorites: () => void;
};

const LEGACY_KEY = 'favorites';
const STORAGE_PREFIX = 'onesec_favorites:';
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function parseItems(raw: string | null): FavoriteProduct[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { items?: FavoriteProduct[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function readFavorites(userId: string): FavoriteProduct[] {
  const key = storageKey(userId);
  const owned = parseItems(localStorage.getItem(key));
  if (owned.length > 0) return owned;

  // старый общий ключ — переношу на пользователя
  const legacy = parseItems(localStorage.getItem(LEGACY_KEY));
  if (legacy.length > 0) {
    localStorage.setItem(key, JSON.stringify({ items: legacy }));
    localStorage.removeItem(LEGACY_KEY);
  }
  return legacy;
}

function writeFavorites(userId: string, items: FavoriteProduct[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify({ items }));
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<FavoriteProduct[]>([]);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // подгрузка избранного пользователя (и очистка UI на выходе, без стирания storage)
  useEffect(() => {
    if (!ready) return;
    if (!user?.id) {
      setItems([]);
      setHydratedFor(null);
      return;
    }
    setItems(readFavorites(user.id));
    setHydratedFor(user.id);
  }, [ready, user?.id]);

  useEffect(() => {
    if (!user?.id || hydratedFor !== user.id) return;
    writeFavorites(user.id, items);
  }, [items, user?.id, hydratedFor]);

  return (
    <FavoritesContext.Provider
      value={{
        items,
        isFavorite: (id) => items.some((item) => item.id === id),
        toggleFavorite: (product) => {
          if (!isLoggedIn()) return;
          setItems((prev) => {
            if (prev.some((item) => item.id === product.id)) {
              return prev.filter((item) => item.id !== product.id);
            }
            return [...prev, product];
          });
        },
        removeFavorite: (id) => {
          setItems((prev) => prev.filter((item) => item.id !== id));
        },
        clearFavorites: () => setItems([]),
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites без FavoritesProvider');
  return ctx;
}
