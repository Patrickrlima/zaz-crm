import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Pencil,
  Trash2,
  Calculator,
  FileText,
  CalendarPlus,
  PhoneCall,
  ArrowLeft,
} from 'lucide-react';
import { clienteService } from '../services/clienteService';
import { agendaService } from '../services/agendaService';
import { propostaService } from '../services/propostaService';
import { historicoService } from '../services/historicoService';
import { simuladorService } from '../services/simuladorService';
import { ClienteStatusBadge } from '../components/ui/StatusBadge';
import { ClienteForm, type ClienteFormValues } from '../components/clientes/ClienteForm';
import { ClienteHistorico } from '../components/clientes/ClienteHistorico';
import { EventoForm, type EventoFormValues } from '../components/agenda/EventoForm';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PropostaStatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency, formatDate, initials } from '../utils/format';
import type { Cliente } from '../types';

type Aba = 'visao_geral' | 'historico' | 'propostas' | 'tarefas';

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | undefined>();
  const [aba, setAba] = useState<Aba>('visao_geral');
  const [modalEditar, setModalEditar] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [modalEvento, setModalEvento] = useState<'visita' | 'ligacao' | null>(null);

  function carregar() {
    if (id) setCliente(clienteService.obter(id));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!cliente || !id) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-ink-faint">Cliente não encontrado.</p>
        <Link to="/clientes" className="mt-3 inline-block text-sm font-medium text-zaz-purple hover:underline">
          Voltar para clientes
        </Link>
      </div>
    );
  }

  const historico = historicoService.listarPorCliente(id);
  const propostas = propostaService.listarPorCliente(id);
  const eventos = agendaService.listarPorCliente(id);
  const simulacoes = simuladorService.listarPorCliente(id);

  function handleEditar(values: ClienteFormValues) {
    clienteService.atualizar(id!, values);
    setModalEditar(false);
    carregar();
  }

  function handleExcluir() {
    clienteService.remover(id!);
    navigate('/clientes');
  }

  function handleNovoEvento(values: EventoFormValues) {
    agendaService.criar({
      clienteId: id!,
      clienteNome: cliente!.nomeFantasia,
      tipo: values.tipo,
      data: values.data,
      hora: values.hora,
      observacoes: values.observacoes,
    });
    setModalEvento(null);
    carregar();
  }

  return (
    <div className="space-y-5">
      <Link to="/clientes" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={15} /> Voltar para clientes
      </Link>

      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-lg font-semibold text-zaz-purple">
            {initials(cliente.nomeFantasia) || <Store size={22} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">{cliente.nomeFantasia}</h2>
              <ClienteStatusBadge status={cliente.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
              <span className="flex items-center gap-1"><Phone size={12} /> {cliente.telefone}</span>
              <span className="flex items-center gap-1"><Mail size={12} /> {cliente.email}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {cliente.cidade} - {cliente.estado}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => setModalEditar(true)} className="btn-secondary">
            <Pencil size={15} /> Editar
          </button>
          <button onClick={() => setModalExcluir(true)} className="btn-secondary text-brand-red hover:bg-red-50">
            <Trash2 size={15} /> Excluir
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigate(`/simulador?clienteId=${id}`)} className="btn-primary">
          <Calculator size={15} /> Abrir simulador
        </button>
        <button onClick={() => navigate(`/propostas?novaPara=${id}`)} className="btn-secondary">
          <FileText size={15} /> Nova proposta
        </button>
        <button onClick={() => setModalEvento('visita')} className="btn-secondary">
          <CalendarPlus size={15} /> Nova visita
        </button>
        <button onClick={() => setModalEvento('ligacao')} className="btn-secondary">
          <PhoneCall size={15} /> Nova ligação
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card p-1">
            <div className="flex gap-1 border-b border-gray-100 px-3 pt-2">
              {(
                [
                  ['visao_geral', 'Visão geral'],
                  ['historico', 'Histórico'],
                  ['propostas', 'Propostas'],
                  ['tarefas', 'Tarefas'],
                ] as [Aba, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setAba(key)}
                  className={`rounded-t-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    aba === key ? 'border-b-2 border-zaz-purple text-zaz-purple' : 'text-ink-faint hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {aba === 'visao_geral' && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
                  <Info label="Razão social" value={cliente.razaoSocial} />
                  <Info label="CNPJ" value={cliente.cnpj} />
                  <Info label="Segmento" value={cliente.segmento} />
                  <Info
                    label="Faturamento estimado"
                    value={cliente.faturamentoEstimado ? formatCurrency(cliente.faturamentoEstimado) + '/mês' : '—'}
                  />
                  <Info label="Ticket médio" value={cliente.ticketMedio ? formatCurrency(cliente.ticketMedio) : '—'} />
                  <Info label="Início do relacionamento" value={formatDate(cliente.dataCadastro)} />
                  <Info label="Responsável" value={cliente.responsavel} />
                  <Info label="Endereço" value={cliente.endereco || '—'} />
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-xs text-ink-faint">Observações</p>
                    <p className="mt-1 text-sm text-ink-soft">{cliente.observacoes || 'Nenhuma observação registrada.'}</p>
                  </div>
                </div>
              )}

              {aba === 'historico' && <ClienteHistorico registros={historico} />}

              {aba === 'propostas' && (
                <div className="space-y-2">
                  {propostas.length === 0 ? (
                    <p className="py-8 text-center text-sm text-ink-faint">Nenhuma proposta para este cliente.</p>
                  ) : (
                    propostas.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-xl bg-surface-alt px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-ink">{formatCurrency(p.valor)}</p>
                          <p className="text-xs text-ink-faint">{formatDate(p.data)} · {p.parcelamento}x</p>
                        </div>
                        <PropostaStatusBadge status={p.status} />
                      </div>
                    ))
                  )}
                </div>
              )}

              {aba === 'tarefas' && (
                <div className="space-y-2">
                  {eventos.length === 0 ? (
                    <p className="py-8 text-center text-sm text-ink-faint">Nenhuma tarefa/atividade agendada.</p>
                  ) : (
                    eventos.map((e) => (
                      <div key={e.id} className="flex items-center justify-between rounded-xl bg-surface-alt px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-ink capitalize">{e.tipo}</p>
                          <p className="text-xs text-ink-faint">{formatDate(e.data)} às {e.hora}</p>
                        </div>
                        <span className={`badge ${e.status === 'concluido' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {e.status === 'concluido' ? 'Concluído' : 'Pendente'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 font-semibold text-ink">Simulações salvas</h3>
            {simulacoes.length === 0 ? (
              <p className="text-sm text-ink-faint">Nenhuma simulação salva ainda.</p>
            ) : (
              <div className="space-y-2">
                {simulacoes.slice(0, 3).map((s) => (
                  <div key={s.id} className="rounded-xl bg-surface-alt px-3 py-2.5 text-sm">
                    <p className="font-medium text-ink">{formatCurrency(s.valorLiquido)}</p>
                    <p className="text-xs text-ink-faint">de {formatCurrency(s.valorVenda)} · {formatDate(s.data)}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate(`/simulador?clienteId=${id}`)} className="btn-secondary mt-3 w-full">
              <Calculator size={15} /> Abrir simulador
            </button>
          </div>
        </div>
      </div>

      <Modal open={modalEditar} onClose={() => setModalEditar(false)} title="Editar cliente" size="lg">
        <ClienteForm cliente={cliente} onSubmit={handleEditar} onCancel={() => setModalEditar(false)} />
      </Modal>

      <Modal open={!!modalEvento} onClose={() => setModalEvento(null)} title={modalEvento === 'visita' ? 'Nova visita' : 'Nova ligação'}>
        <EventoForm
          clientes={[cliente]}
          clienteFixoId={id}
          tipoPadrao={modalEvento ?? 'visita'}
          onSubmit={handleNovoEvento}
          onCancel={() => setModalEvento(null)}
        />
      </Modal>

      <ConfirmDialog
        open={modalExcluir}
        title="Excluir cliente"
        message={`Tem certeza que deseja excluir ${cliente.nomeFantasia}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleExcluir}
        onCancel={() => setModalExcluir(false)}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}
