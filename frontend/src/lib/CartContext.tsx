import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch, type Product } from '@/lib/api/client';
import { getAccessToken, isLoggedIn, useAuth } from '@/lib/AuthContext';

export type { Product };

export type CartItem = Product & { quantity: number };

type CartContextValue = {
  items: CartItem[];
  addToCart: (product: Product) => void;
  addManyToCart: (products: CartItem[]) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  // «купить» — только этот товар
  replaceCart: (product: Product) => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

const STORAGE_KEY = 'cart';
const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: CartItem[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function toServerPayload(item: CartItem) {
  return {
    productId: item.id,
    title: item.title,
    price: item.price,
    oldPrice: item.oldPrice ?? null,
    image: item.image,
    quantity: item.quantity,
    gameSlug: item.gameSlug ?? null,
    category: item.category ?? null,
    platform: item.platform ?? null,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => readCart());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  }, [items]);

  // после логина / F5 забираю корзину с сервера
  useEffect(() => {
    if (!ready || !user) return;
    (async () => {
      try {
        const res = await apiFetch('/api/cart');
        if (!res.ok) return;
        const data = (await res.json()) as { items?: CartItem[] };
        if (Array.isArray(data.items)) setItems(data.items);
      } catch {
        /* offline */
      }
    })();
  }, [ready, user]);

  useEffect(() => {
    if (ready && !user) setItems([]);
  }, [ready, user]);

  function addToCart(product: Product) {
    if (!isLoggedIn()) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      let next: CartItem[];
      if (existing) {
        next = prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      } else {
        next = [...prev, { ...product, quantity: 1 }];
      }
      const item = next.find((i) => i.id === product.id);
      if (item && getAccessToken()) {
        void apiFetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toServerPayload(item)),
        });
      }
      return next;
    });
  }

  function addManyToCart(products: CartItem[]) {
    if (!isLoggedIn()) return;
    setItems((prev) => {
      const next = [...prev];
      for (const product of products) {
        const existing = next.find((i) => i.id === product.id);
        if (existing) existing.quantity += product.quantity;
        else next.push({ ...product });
      }
      if (getAccessToken()) {
        for (const item of products) {
          const merged = next.find((i) => i.id === item.id);
          if (merged) {
            void apiFetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(toServerPayload(merged)),
            });
          }
        }
      }
      return next;
    });
  }

  function removeFromCart(id: string | number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (getAccessToken()) {
      void apiFetch(`/api/cart/${id}`, { method: 'DELETE' });
    }
  }

  function updateQuantity(id: string | number, qty: number) {
    if (qty < 1) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
    if (getAccessToken()) {
      void apiFetch(`/api/cart/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty }),
      });
    }
  }

  function clearCart() {
    setItems([]);
    if (getAccessToken()) {
      void apiFetch('/api/cart', { method: 'DELETE' });
    }
  }

  async function replaceCart(product: Product) {
    if (!isLoggedIn()) return;
    const item: CartItem = { ...product, quantity: 1 };
    setItems([item]);
    if (!getAccessToken()) return;
    await apiFetch('/api/cart', { method: 'DELETE' });
    await apiFetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toServerPayload(item)),
    });
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addManyToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        replaceCart,
        getTotalItems: () => items.reduce((sum, i) => sum + i.quantity, 0),
        getTotalPrice: () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart без CartProvider');
  return ctx;
}
