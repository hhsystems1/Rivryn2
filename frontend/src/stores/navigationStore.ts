import { create } from 'zustand';

export type Page = 'dashboard' | 'files' | 'code' | 'terminal' | 'agents' | 'integrations' | 'settings';

interface NavigationState {
  currentPage: Page;
  setPage: (page: Page) => void;
}

export const useNavigation = create<NavigationState>((set) => ({
  currentPage: 'dashboard',
  setPage: (page) => set({ currentPage: page }),
}));
