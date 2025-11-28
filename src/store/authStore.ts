import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { Profile, UserConfig } from '../types';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  config: UserConfig | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: (user?: any) => Promise<void>; // Agora aceita user opcional
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  config: null,
  loading: true,
  initialized: false,

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;

    // CORREÇÃO DEFINITIVA:
    // Se o login deu certo, JÁ TEMOS o usuário em 'data.user'.
    // Não vamos perguntar ao Supabase de novo (getUser), vamos usar esse dado direto.
    if (data.user) {
      // Define o usuário na memória imediatamente para evitar delay
      set({ user: data.user });
      
      // Chama o perfil passando o usuário que já temos
      await get().fetchProfile(data.user);
    }
  },

  signUp: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, config: null });
  },

  // Modificado para aceitar um 'currentUser' opcional
  fetchProfile: async (currentUser?: any) => {
    let user = currentUser;

    // Se não passamos um usuário, aí sim tentamos buscar da sessão (caso de F5/Reload)
    if (!user) {
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    }
    
    if (!user) {
      set({ user: null, profile: null, config: null, loading: false, initialized: true });
      return;
    }

    try {
      const [profileRes, configRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_configs').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      set({ 
        user, // Garante que o user está salvo no estado
        profile: profileRes.data, 
        config: configRes.data, 
        loading: false, 
        initialized: true 
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Mesmo se der erro no perfil, mantém o usuário logado para não travar o app
      set({ user, loading: false, initialized: true });
    }
  },
}));

// Listener para manter sincronia (Ex: se abrir outra janela ou der F5)
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // Só busca se o usuário ainda não estiver na memória (evita conflito com o signIn acima)
    const currentStoreUser = useAuthStore.getState().user;
    if (!currentStoreUser) {
      await useAuthStore.getState().fetchProfile(session.user);
    }
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, profile: null, config: null, loading: false });
  }
});