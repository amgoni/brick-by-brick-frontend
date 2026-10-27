import { create } from "zustand";

/**
 * Interface state that more than one part of the tree needs. The command
 * palette lives in the app shell, but the top bar's search box, the ⌘K
 * shortcut and the dashboard's New button all open it.
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
}

export const useUiStore = create<UiState>()((set) => ({
  commandOpen: false,
  commandQuery: "",
  openCommand: (query = "") => set({ commandOpen: true, commandQuery: query }),
  setCommandOpen: (open) => set({ commandOpen: open }),
}));
