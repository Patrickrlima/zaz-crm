import { storage, STORAGE_KEYS } from './storage';
import { generateId } from '../utils/id';
import { STATUS_CLIENTE_LABEL, STATUS_CLIENTE_COLOR, STATUS_CLIENTE_PADRAO, KANBAN_COLUNAS } from '../types';

export interface ColunaKanban {
  id: string; // vira o valor salvo em cliente.status
  label: string;
  cor: { bg: string; text: string; dot: string };
}

const CHAVE = STORAGE_KEYS.kanbanColunas;

const PALETA_NOVAS_COLUNAS = [
  { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-500' },
  { bg: 'bg-pink-50', text: 'text-pink-600', dot: 'bg-pink-500' },
  { bg: 'bg-cyan-50', text: 'text-cyan-600', dot: 'bg-cyan-500' },
  { bg: 'bg-lime-50', text: 'text-lime-700', dot: 'bg-lime-500' },
  { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
];

function colunasPadrao(): ColunaKanban[] {
  return KANBAN_COLUNAS.map((id) => ({
    id,
    label: STATUS_CLIENTE_LABEL[id] ?? id,
    cor: STATUS_CLIENTE_COLOR[id] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  }));
}

/**
 * Garante que quadros já personalizados pelo usuário (colunas salvas antes desta
 * atualização) ganhem a nova coluna "Fechamentos do Mês", inserida logo antes da
 * coluna "Fechado" (ou no fim, se essa não existir). Não mexe em nada além disso.
 */
function comColunaDeFechamentoMes(colunas: ColunaKanban[]): ColunaKanban[] {
  if (colunas.some((c) => c.id === STATUS_CLIENTE_PADRAO.fechamentoMes)) return colunas;

  const nova: ColunaKanban = {
    id: STATUS_CLIENTE_PADRAO.fechamentoMes,
    label: STATUS_CLIENTE_LABEL[STATUS_CLIENTE_PADRAO.fechamentoMes],
    cor: STATUS_CLIENTE_COLOR[STATUS_CLIENTE_PADRAO.fechamentoMes],
  };
  const idxFechado = colunas.findIndex((c) => c.id === STATUS_CLIENTE_PADRAO.fechado);
  return idxFechado === -1
    ? [...colunas, nova]
    : [...colunas.slice(0, idxFechado), nova, ...colunas.slice(idxFechado)];
}

export const kanbanColunaService = {
  listar(): ColunaKanban[] {
    const salvas = storage.get<ColunaKanban[] | null>(CHAVE, null);
    if (salvas && salvas.length > 0) {
      const atualizadas = comColunaDeFechamentoMes(salvas);
      if (atualizadas !== salvas) this.salvar(atualizadas);
      return atualizadas;
    }
    return colunasPadrao();
  },

  salvar(colunas: ColunaKanban[]): void {
    storage.save(CHAVE, colunas);
  },

  adicionar(label: string): ColunaKanban {
    const colunas = this.listar();
    const cor = PALETA_NOVAS_COLUNAS[colunas.length % PALETA_NOVAS_COLUNAS.length];
    const nova: ColunaKanban = { id: generateId('col'), label: label.trim(), cor };
    const atualizadas = [...colunas, nova];
    this.salvar(atualizadas);
    return nova;
  },

  renomear(id: string, novoLabel: string): void {
    const colunas = this.listar().map((c) => (c.id === id ? { ...c, label: novoLabel.trim() } : c));
    this.salvar(colunas);
  },

  remover(id: string): void {
    const colunas = this.listar().filter((c) => c.id !== id);
    this.salvar(colunas);
  },
};
