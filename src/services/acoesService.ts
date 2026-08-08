import { clienteService } from './clienteService';
import { agendaService } from './agendaService';
import { propostaService } from './propostaService';
import { historicoService } from './historicoService';
import { nomeExibicaoCliente } from '../utils/format';
import type { Cliente, EventoAgenda, Proposta } from '../types';

/**
 * Configuração: depois de quantos dias sem nenhum contato registrado um
 * cliente deve aparecer na lista de "esquecidos". Ajustável pelo próprio
 * vendedor em Configurações → Central de Ações.
 */
const CHAVE_DIAS_SEM_CONTATO = 'zaz_crm_dias_sem_contato';
const DIAS_SEM_CONTATO_PADRAO = 5;

/** Propostas enviadas e sem resposta há mais desse tanto de dias entram na lista. */
const DIAS_PROPOSTA_PARADA = 5;

/** Estágios em que um cliente já "morreu" (perdido) ou já é pós-venda: não faz
 * sentido cobrar follow-up de contato ativo nesses casos. */
const STATUS_IGNORADOS_EM_ESQUECIDOS = new Set(['perdido', 'fechado']);

/** Tipos de registro no Histórico que contam como um contato de verdade com
 * o cliente (fala/reunião realizada, proposta enviada, simulação feita).
 * "cadastro", "edição" e "exclusão" são administrativos e não contam. */
const TIPOS_HISTORICO_CONTATO = new Set(['ligacao', 'visita', 'proposta', 'simulacao', 'conclusao']);

export function obterDiasSemContato(): number {
  const salvo = window.localStorage.getItem(CHAVE_DIAS_SEM_CONTATO);
  const numero = salvo ? Number(salvo) : NaN;
  return Number.isFinite(numero) && numero > 0 ? numero : DIAS_SEM_CONTATO_PADRAO;
}

export function salvarDiasSemContato(dias: number): void {
  const seguro = Math.max(1, Math.round(dias) || DIAS_SEM_CONTATO_PADRAO);
  window.localStorage.setItem(CHAVE_DIAS_SEM_CONTATO, String(seguro));
}

function diasDesde(dataISO: string): number {
  const data = new Date(dataISO.length <= 10 ? `${dataISO}T00:00:00` : dataISO);
  const diffMs = Date.now() - data.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export interface ClienteEsquecido {
  cliente: Cliente;
  diasSemContato: number;
  ultimoContatoEm: string | null;
}

export interface PropostaParada {
  proposta: Proposta;
  dias: number;
}

export const acoesService = {
  /** Atividades da agenda de hoje que ainda estão pendentes. */
  atividadesDeHoje(): EventoAgenda[] {
    return agendaService.listarHoje().filter((e) => e.status === 'pendente');
  },

  /**
   * Clientes ativos (fora de "perdido"/"fechado") sem nenhum contato
   * registrado no Histórico há mais dias do que o configurado.
   */
  clientesEsquecidos(): ClienteEsquecido[] {
    const diasLimite = obterDiasSemContato();
    const historico = historicoService.listar();

    return clienteService
      .listar()
      .filter((c) => !STATUS_IGNORADOS_EM_ESQUECIDOS.has(c.status))
      .map((cliente) => {
        const contatos = historico.filter((h) => h.clienteId === cliente.id && TIPOS_HISTORICO_CONTATO.has(h.tipo));
        const ultimoContatoEm = contatos[0]?.data ?? null; // historico já vem ordenado do mais novo pro mais antigo
        const referencia = ultimoContatoEm ?? cliente.dataCadastro;
        return {
          cliente,
          diasSemContato: diasDesde(referencia),
          ultimoContatoEm,
        };
      })
      .filter((item) => item.diasSemContato >= diasLimite)
      .sort((a, b) => b.diasSemContato - a.diasSemContato);
  },

  /** Propostas "enviada" sem resposta há mais do que o prazo configurado. */
  propostasParadas(): PropostaParada[] {
    return propostaService
      .listar()
      .filter((p) => p.status === 'enviada')
      .map((proposta) => ({ proposta, dias: diasDesde(proposta.data) }))
      .filter((item) => item.dias >= DIAS_PROPOSTA_PARADA)
      .sort((a, b) => b.dias - a.dias);
  },

  /** Registra um contato rápido direto pela Central de Ações (some da lista de esquecidos). */
  registrarContatoRapido(cliente: Cliente): void {
    const nome = nomeExibicaoCliente(cliente);
    historicoService.registrar({
      tipo: 'ligacao',
      titulo: 'Contato registrado',
      descricao: `Contato com ${nome} registrado pela Central de Ações.`,
      clienteId: cliente.id,
      clienteNome: nome,
    });
  },
};
