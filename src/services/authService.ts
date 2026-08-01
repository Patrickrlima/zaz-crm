import type { AuthChangeEvent, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './supabaseClient';

/** URL do próprio app (respeitando a subpasta do GitHub Pages) usada como retorno dos e-mails do Supabase. */
function urlDoApp(): string {
  return window.location.origin + import.meta.env.BASE_URL;
}

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

  /** Envia o e-mail de recuperação de senha (link que traz o usuário de volta ao app). */
  async enviarEmailRecuperacao(email: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não está configurado. Verifique o arquivo .env.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: urlDoApp() });
    if (error) throw error;
  },

  /** Define uma nova senha. Só funciona logo após o usuário abrir o link de recuperação recebido por e-mail. */
  async definirNovaSenha(novaSenha: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não está configurado. Verifique o arquivo .env.');
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) throw error;
  },

  /** Assina mudanças no estado de autenticação (login/logout/recuperação de senha). Retorna uma função para cancelar. */
  observar(callback: (user: User | null, evento?: AuthChangeEvent) => void): () => void {
    if (!supabase) {
      callback(null);
      return () => {};
    }
    supabase.auth.getSession().then(({ data }) => callback(data.session?.user ?? null));
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null, event);
    });
    return () => subscription.subscription.unsubscribe();
  },

  usuarioAtual(): User | null {
    return null;
  },
};
