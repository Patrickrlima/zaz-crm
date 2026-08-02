import { storage, STORAGE_KEYS } from './storage';
import type { Usuario, Configuracoes } from '../types';

const USUARIO_PADRAO: Usuario = {
  id: 'user_1',
  nome: 'Patrick Lima',
  cargo: 'Vendedor',
  email: 'patrick.lima@zazvendas.com.br',
};

export const usuarioService = {
  obter(): Usuario {
    return storage.get<Usuario>(STORAGE_KEYS.usuario, USUARIO_PADRAO);
  },

  salvar(usuario: Usuario): void {
    storage.save(STORAGE_KEYS.usuario, usuario);
    window.dispatchEvent(new Event('zaz-usuario-atualizado'));
  },

  atualizar(partial: Partial<Usuario>): Usuario {
    const atualizado = storage.update<Usuario>(STORAGE_KEYS.usuario, partial);
    window.dispatchEvent(new Event('zaz-usuario-atualizado'));
    return atualizado;
  },
};

const CONFIG_PADRAO: Configuracoes = {
  tema: 'claro',
  usuario: USUARIO_PADRAO,
};

export const configuracoesService = {
  obter(): Configuracoes {
    return storage.get<Configuracoes>(STORAGE_KEYS.configuracoes, CONFIG_PADRAO);
  },

  salvar(config: Configuracoes): void {
    storage.save(STORAGE_KEYS.configuracoes, config);
  },

  atualizar(partial: Partial<Configuracoes>): Configuracoes {
    return storage.update<Configuracoes>(STORAGE_KEYS.configuracoes, partial);
  },
};
