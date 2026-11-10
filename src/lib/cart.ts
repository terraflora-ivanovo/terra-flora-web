import { useSyncExternalStore } from "react";

export type CartLine = {
  productId: string;
  name: string;
  priceRub: number;
  imagePath: string | null;
  isCustom: boolean;
  qty: number;
};

type CartState = {
  tenantId: string;
  lines: CartLine[];
};

const listeners = new Set<() => void>();

/** In-memory cache so `useSyncExternalStore` gets a stable reference between writes. */
const cartCache = new Map<string, CartState>();

function storageKey(tenantId: string): string {
  return `flora-cart:${tenantId}`;
}

function read(tenantId: string): CartState {
  const cached = cartCache.get(tenantId);
  if (cached) return cached;

  let state: CartState = { tenantId, lines: [] };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(storageKey(tenantId));
      if (raw) {
        const parsed = JSON.parse(raw) as CartState;
        if (parsed.tenantId === tenantId && Array.isArray(parsed.lines)) {
          state = parsed;
        }
      }
    } catch {
      // Ignore corrupt localStorage payloads.
    }
  }

  cartCache.set(tenantId, state);
  return state;
}

function write(state: CartState): void {
  cartCache.set(state.tenantId, state);

  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey(state.tenantId), JSON.stringify(state));
  }

  listeners.forEach((listener) => listener());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Current cart snapshot for a tenant (from cache / localStorage). */
export function getCart(tenantId: string): CartState {
  return read(tenantId);
}

/**
 * Adds a line to the tenant cart.
 * Custom (individual) bouquets replace any previous custom line and always use qty 1.
 */
export function addToCart(
  tenantId: string,
  line: Omit<CartLine, "qty">,
  qty = 1,
): void {
  const state = read(tenantId);

  if (line.isCustom) {
    const withoutCustom = state.lines.filter((l) => !l.isCustom);
    write({
      tenantId,
      lines: [...withoutCustom, { ...line, qty: 1 }],
    });
    return;
  }

  const existing = state.lines.find((l) => l.productId === line.productId && !l.isCustom);
  const lines = existing
    ? state.lines.map((l) =>
        l.productId === line.productId ? { ...l, qty: l.qty + qty } : l,
      )
    : [...state.lines, { ...line, qty }];

  write({ tenantId, lines });
}

/** Sets quantity for a product line; qty ≤ 0 removes the line. */
export function setLineQty(tenantId: string, productId: string, qty: number): void {
  const state = read(tenantId);
  const lines =
    qty <= 0
      ? state.lines.filter((l) => l.productId !== productId)
      : state.lines.map((l) => (l.productId === productId ? { ...l, qty } : l));
  write({ tenantId, lines });
}

/** Removes a single product line from the cart. */
export function removeFromCart(tenantId: string, productId: string): void {
  const state = read(tenantId);
  write({ tenantId, lines: state.lines.filter((l) => l.productId !== productId) });
}

/** Clears all lines for the tenant. */
export function clearCart(tenantId: string): void {
  write({ tenantId, lines: [] });
}

/** Total item count (sum of quantities). */
export function cartCount(tenantId: string): number {
  return read(tenantId).lines.reduce((sum, l) => sum + l.qty, 0);
}

/**
 * Cart total in rubles.
 * Custom lines are excluded from the sum (priced on request).
 */
export function cartTotalRub(tenantId: string): number {
  return read(tenantId).lines.reduce(
    (sum, l) => sum + (l.isCustom ? 0 : l.priceRub * l.qty),
    0,
  );
}

/** React hook: subscribe to cart changes for a tenant. */
export function useCart(tenantId: string): CartState {
  return useSyncExternalStore(
    subscribe,
    () => read(tenantId),
    () => read(tenantId),
  );
}
