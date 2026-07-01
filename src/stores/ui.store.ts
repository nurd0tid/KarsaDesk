import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  isTaskDrawerOpen: boolean;
  activeTaskId: string | null;
  openTaskDrawer: (id?: string) => void;
  closeTaskDrawer: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      isTaskDrawerOpen: false,
      activeTaskId: null,
      openTaskDrawer: (id) => set({ isTaskDrawerOpen: true, activeTaskId: id || null }),
      closeTaskDrawer: () => set({ isTaskDrawerOpen: false, activeTaskId: null }),
    }),
    {
      name: 'vibeforge-ui-storage',
      partialize: (state) => ({ activeProjectId: state.activeProjectId }), // Only persist activeProjectId
    }
  )
);
