import type { User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './supabaseClient';

export const authService = {
  configurado: supabaseConfigured,

  async entrar(email: string, senha: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não está configurado. Verifique o arquivo .env.');
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
  },

  async sair(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  /** Assina mudanças no estado de autenticação (login/logout). Retorna uma função para cancelar. */
  observar(callback: (user: User | null) => void): () => void {
    if (!supabase) {
      callback(null);
      return () => {};
    }
    supabase.auth.getSession().then(({ data }) => callback(data.session?.user ?? null));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  },

  usuarioAtual(): User | null {
    return null;
  },
};
