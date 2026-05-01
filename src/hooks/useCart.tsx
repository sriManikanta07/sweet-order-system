import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  note?: string;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setOpen: (v: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (id: string, qty: number) => void;
  updateNote: (id: string, note: string) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext =
  ((globalThis as any).__CartContext__ as React.Context<CartContextType | null>) ??
  ((globalThis as any).__CartContext__ = createContext<CartContextType | null>(null));
const STORAGE_KEY = "bakery_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem: CartContextType["addItem"] = useCallback((item) => {
    setItems((prev) => {
      const qty = Math.max(1, Math.floor(item.quantity ?? 1));
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: Math.min(99, p.quantity + qty), note: item.note ?? p.note } : p
        );
      }
      return [
        ...prev,
        { id: item.id, name: item.name, price: item.price, image_url: item.image_url, quantity: qty, note: item.note },
      ];
    });
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, quantity: Math.max(0, Math.min(99, Math.floor(qty))) } : p))
        .filter((p) => p.quantity > 0)
    );
  }, []);

  const updateNote = useCallback((id: string, note: string) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, note } : p)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextType>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
    return {
      items,
      count,
      total,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      setOpen: setIsOpen,
      addItem,
      updateQuantity,
      updateNote,
      removeItem,
      clear,
    };
  }, [items, isOpen, addItem, updateQuantity, updateNote, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
