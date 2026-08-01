import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { storage, STORAGE_KEYS, type StorageKey } from './storage';

/**
 * Sincronização em tempo real entre dispositivos, usando Supabase (Postgres).
 *
 * Estratégia: uma única tabela `dados_crm` guarda, por usuário, o conteúdo
 * de cada chave local (clientes, agenda, historico, propostas, simulacoes,
 * usuario) em uma coluna JSON. Veja o script SQL de criação da tabela em
 * `supabase/schema.sql`.
 *
 * - Toda gravação local (feita pelas telas, através dos Services que já
 *   existiam) é automaticamente replicada para o Supabase.
 * - Toda mudança que chegar do Supabase Realtime (feita em outro
 *   dispositivo) é aplicada no LocalStorage deste dispositivo e um evento
 *   "zaz-cloud-sync" é disparado para as telas atualizarem a exibição.
 *
 * As telas continuam lendo dados do LocalStorage de forma síncrona (rápida,
 * sem loading em cada clique) — o Supabase roda "por trás", mantendo os
 * dispositivos sincronizados sem exigir nenhuma tela nova.
 */

export const CLOUD_SYNC_EVENT = 'zaz-cloud-sync';

const TABELA = 'dados_crm';

const CHAVES_SINCRONIZADAS: StorageKey[] = [
  STORAGE_KEYS.clientes,
  STORAGE_KEYS.agenda,
  STORAGE_KEYS.historico,
  STORAGE_KEYS.propostas,
  STORAGE_KEYS.simulacoes,
  STORAGE_KEYS.usuario,
];

let canal: RealtimeChannel | null = null;
let unsubscribeLocalChanges: (() => void) | null = null;
let syncingUid: string | null = null;
let aplicandoRemoto = false;

function dispatchSyncEvent(key: string) {
  window.dispatchEvent(new CustomEvent(CLOUD_SYNC_EVENT, { detail: { key } }));
}

/** Envia o conteúdo local de uma chave para o Supabase. */
async function enviarParaNuvem(uid: string, chave: string, valor: unknown) {
  if (!supabase || aplicandoRemoto) return;
  try {
    const { error } = await supabase
      .from(TABELA)
      .upsert({ user_id: uid, chave, valor, atualizado_em: new Date().toISOString() }, { onConflict: 'user_id,chave' });
    if (error) throw error;
  } catch (e) {
    console.error(`Falha ao sincronizar "${chave}" com a nuvem:`, e);
  }
}

/** Busca o estado atual de todas as chaves e aplica localmente (usado ao entrar). */
async function carregarEstadoInicial(uid: string) {
  if (!supabase) return;
  const { data, error } = await supabase.from(TABELA).select('chave, valor').eq('user_id', uid);
  if (error) {
    console.error('Falha ao carregar dados da nuvem:', error);
    return;
  }
  aplicandoRemoto = true;
  try {
    for (const linha of data ?? []) {
      if (CHAVES_SINCRONIZADAS.includes(linha.chave as StorageKey)) {
        storage.saveFromRemote(linha.chave, linha.valor);
        dispatchSyncEvent(linha.chave);
      }
    }
  } finally {
    aplicandoRemoto = false;
  }
}

/** Inicia a sincronização em tempo real para o usuário autenticado. */
export async function iniciarSincronizacao(uid: string) {
  if (!supabase) return;
  if (syncingUid === uid) return; // já sincronizando este usuário
  pararSincronizacao();
  syncingUid = uid;

  // 1) Carrega o que já existe na nuvem e sobrescreve o que houver localmente.
  await carregarEstadoInicial(uid);

  // 2) Ouve mudanças em tempo real feitas em outros dispositivos.
  canal = supabase
    .channel(`dados_crm_${uid}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABELA, filter: `user_id=eq.${uid}` },
      (payload) => {
        const linha = (payload.new ?? payload.old) as { chave?: string; valor?: unknown } | null;
        if (!linha?.chave || !CHAVES_SINCRONIZADAS.includes(linha.chave as StorageKey)) return;
        aplicandoRemoto = true;
        try {
          storage.saveFromRemote(linha.chave, linha.valor ?? []);
          dispatchSyncEvent(linha.chave);
        } finally {
          aplicandoRemoto = false;
        }
      }
    )
    .subscribe();

  // 3) Ouve mudanças locais (LocalStorage -> Supabase) e propaga.
  unsubscribeLocalChanges = storage.onChange((key, data) => {
    if (CHAVES_SINCRONIZADAS.includes(key as StorageKey)) {
      enviarParaNuvem(uid, key, data);
    }
  });
}

/** Interrompe toda sincronização (usado no logout). */
export function pararSincronizacao() {
  if (canal) {
    supabase?.removeChannel(canal);
    canal = null;
  }
  if (unsubscribeLocalChanges) {
    unsubscribeLocalChanges();
    unsubscribeLocalChanges = null;
  }
  syncingUid = null;
}
