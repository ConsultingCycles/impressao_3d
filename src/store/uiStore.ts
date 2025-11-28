import { create } from 'zustand';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
}

interface UIState {
  confirmDialog: {
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  };
  // Função que chamaremos nas telas
  confirm: (message: string, title?: string, type?: 'danger' | 'info') => Promise<boolean>;
  // Funções internas do modal
  closeConfirm: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  confirmDialog: {
    isOpen: false,
    options: { message: '', title: '' },
    resolve: () => {},
  },

  confirm: (message, title = 'Confirmação', type = 'danger') => {
    return new Promise((resolve) => {
      set({
        confirmDialog: {
          isOpen: true,
          options: { message, title, type },
          resolve, // Guarda a função 'resolve' para chamar depois que clicar
        },
      });
    });
  },

  closeConfirm: (value) => {
    const { resolve } = get().confirmDialog;
    resolve(value); // Destrava o código que estava esperando (await)
    set((state) => ({
      confirmDialog: { ...state.confirmDialog, isOpen: false },
    }));
  },
}));