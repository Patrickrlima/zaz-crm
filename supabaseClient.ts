import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente do Supabase.
 *
 * Os valores vêm de variáveis de ambiente (arquivo `.env`, veja `.env.example`)
 * para não deixar chaves fixas no código-fonte. Copie os valores em:
 * Painel do Supabase > Project Settings > API > Project URL / anon public key.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseConfigured ? createClient(url!, anonKey!) : null;
