import { create } from "zustand";

/** What a new purchase order starts with when it's opened from a stock row or an alert. */
export interface PurchaseOrderPrefill {
  itemId?: string;
  deliverToId?: string;
  quantity?: number;
}

/**
 * Interface state that more than one part of the tree needs. The command
 * palette lives in the app shell, but the top bar's search box, the ⌘K
 * shortcut and the dashboard's New button all open it. The new purchase
 * order drawer is the same: the Inventory page, its stock rows, the
 * dashboard's Reorder and the palette all open it.
 *
 * Server data never goes here; that's TanStack Query's job. This is only for
 * state that exists nowhere but the screen.
 */
interface UiState {
  commandOpen: boolean;
  /** What the palette opens with already typed in ("New" from a New button). */
  commandQuery: string;
  openCommand: (query?: string) => void;
  setCommandOpen: (open: boolean) => void;

  purchaseOrderOpen: boolean;
  purchaseOrderPrefill: PurchaseOrderPrefill;
  openPurchaseOrder: (prefill?: PurchaseOrderPrefill) => void;
  setPurchaseOrderOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  commandOpen: false,
  commandQuery: "",
  openCommand: (query = "") => set({ commandOpen: true, commandQuery: query }),
  setCommandOpen: (open) => set({ commandOpen: open }),

  purchaseOrderOpen: false,
  purchaseOrderPrefill: {},
  openPurchaseOrder: (prefill = {}) =>
    set({ purchaseOrderOpen: true, purchaseOrderPrefill: prefill }),
  setPurchaseOrderOpen: (open) => set({ purchaseOrderOpen: open }),
}));
