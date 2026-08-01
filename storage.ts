/**
 * Serviço único de persistência local.
 *
 * Toda a aplicação acessa dados exclusivamente por meio deste módulo.
 * Isso isola o restante do código do mecanismo de armazenamento (hoje
 * LocalStorage) para que, no futuro, baste trocar a implementação
 * interna por chamadas de API/REST sem alterar nenhuma tela.
 */

export const STORAGE_KEYS = {
  clientes: 'zaz_crm_clientes',
  agenda: 'zaz_crm_agenda',
  historico: 'zaz_crm_historico',
  propostas: 'zaz_crm_propostas',
  simulacoes: 'zaz_crm_simulacoes',
  configuracoes: 'zaz_crm_configuracoes',
  usuario: 'zaz_crm_usuario',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const PREFIX = 'zaz_crm_';

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

type ChangeListener = (key: string, data: unknown) => void;

class StorageService {
  private listeners: ChangeListener[] = [];
  private suppressNotify = false;

  /**
   * Assina mudanças locais (usado pelo módulo de sincronização em nuvem
   * para replicar cada gravação local no Firestore). Retorna uma função
   * para cancelar a assinatura.
   */
  onChange(listener: ChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Salva (substitui) uma lista/objeto inteiro sob uma chave. */
  save<T>(key: StorageKey | string, data: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
      if (!this.suppressNotify) {
        this.listeners.forEach((l) => l(key, data));
      }
    } catch (e) {
      if (isQuotaError(e)) {
        console.error('Armazenamento local cheio. Não foi possível salvar os dados.');
      }
      throw e;
    }
  }

  /**
   * Grava dados vindos da nuvem (outro dispositivo) sem disparar uma nova
   * gravação de volta para a nuvem — evita loop infinito de sincronização.
   */
  saveFromRemote<T>(key: StorageKey | string, data: T): void {
    this.suppressNotify = true;
    try {
      this.save(key, data);
    } finally {
      this.suppressNotify = false;
    }
  }

  /** Recupera o valor completo salvo em uma chave, ou defaultValue se não existir. */
  get<T>(key: StorageKey | string, defaultValue: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  /** Remove uma chave inteira. */
  remove(key: StorageKey | string): void {
    window.localStorage.removeItem(key);
  }

  /** Limpa todas as chaves da aplicação (mantém outros dados do domínio). */
  clear(): void {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  }

  /** Atualiza parcialmente um objeto salvo (merge raso). */
  update<T extends object>(key: StorageKey | string, partial: Partial<T>): T {
    const current = this.get<T>(key, {} as T);
    const updated = { ...current, ...partial };
    this.save(key, updated);
    return updated;
  }

  // -------- Helpers para listas (usado por clientes, agenda, etc.) --------

  list<T>(key: StorageKey | string): T[] {
    return this.get<T[]>(key, []);
  }

  addItem<T extends { id: string }>(key: StorageKey | string, item: T): T {
    const items = this.list<T>(key);
    items.unshift(item);
    this.save(key, items);
    return item;
  }

  updateItem<T extends { id: string }>(key: StorageKey | string, id: string, partial: Partial<T>): T | null {
    const items = this.list<T>(key);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...partial };
    this.save(key, items);
    return items[idx];
  }

  removeItem<T extends { id: string }>(key: StorageKey | string, id: string): void {
    const items = this.list<T>(key);
    this.save(
      key,
      items.filter((i) => i.id !== id)
    );
  }

  findItem<T extends { id: string }>(key: StorageKey | string, id: string): T | undefined {
    return this.list<T>(key).find((i) => i.id === id);
  }

  /** Exporta todos os dados da aplicação como um único objeto (para backup). */
  exportAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    Object.values(STORAGE_KEYS).forEach((key) => {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        try {
          result[key] = JSON.parse(raw);
        } catch {
          result[key] = raw;
        }
      }
    });
    return result;
  }

  /** Importa um objeto de backup gerado por exportAll(). */
  importAll(data: Record<string, unknown>): void {
    Object.entries(data).forEach(([key, value]) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    });
  }
}

export const storage = new StorageService();
