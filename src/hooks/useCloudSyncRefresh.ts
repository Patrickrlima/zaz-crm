import { useEffect } from 'react';
import { CLOUD_SYNC_EVENT } from '../services/cloudSync';

/**
 * Executa `callback` quando a tela monta e sempre que dados chegarem de
 * outro dispositivo (via sincronização em nuvem). Use no lugar de um
 * `useEffect(() => { carregar(); }, [])` simples nas telas que exibem
 * listas vindas do storage (clientes, agenda, propostas, histórico...).
 *
 * Se `chave` for informada, só reage a mudanças daquela chave específica
 * (ex.: STORAGE_KEYS.clientes). Se omitida, reage a qualquer mudança.
 */
export function useCloudSyncRefresh(callback: () => void, chave?: string) {
  useEffect(() => {
    callback();

    function handler(e: Event) {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (!chave || detail?.key === chave || detail?.key === '*') {
        callback();
      }
    }

    window.addEventListener(CLOUD_SYNC_EVENT, handler);
    return () => window.removeEventListener(CLOUD_SYNC_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
}
