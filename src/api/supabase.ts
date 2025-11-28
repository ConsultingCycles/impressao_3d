import { createClient } from '@supabase/supabase-js';

// Tenta pegar as chaves, mas usa string vazia como fallback para não quebrar o javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verificação de segurança para Debug
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⛔ ERRO CRÍTICO: Chaves do Supabase não encontradas!');
}

// Cria o cliente. Se a URL for vazia, ele vai dar erro de conexão depois,
// mas NÃO vai travar a tela branca na inicialização.
export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true, // Mantém o usuário logado no Electron
      autoRefreshToken: true,
    }
  }
);