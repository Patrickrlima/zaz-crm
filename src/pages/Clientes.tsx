import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCloudSyncRefresh } from '../hooks/useCloudSyncRefresh';
import { Plus, Users, Upload, LayoutGrid, List, MessageCircle, Phone, CheckSquare, Square, Trash2, X } from 'lucide-react';
import { ClienteCard } from '../components/clientes/ClienteCard';
import { ClienteFiltro } from '../components/clientes/ClienteFiltro';
import { ClienteForm, type ClienteFormValues } from '../components/clientes/ClienteForm';
import { ImportarClientesModal } from '../components/clientes/ImportarClientesModal';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ClienteStatusBadge } from '../components/ui/StatusBadge';
import { BotaoCopiar } from '../components/ui/BotaoCopiar';
import { clienteService } from '../services/clienteService';
import { initials, nomeExibicaoCliente, linkWhatsApp } from '../utils/format';
import type { Cliente, StatusCliente } from '../types';

const VISUALIZACAO_KEY = 'zaz_crm_clientes_visualizacao';

export default function Clientes() {
  const [searchParams] = useSearchParams();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState(() => searchParams.get('q') ?? '');
  const [status, setStatus] = useState<StatusCliente | 'todos'>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);
  const [visualizacao, setVisualizacao] = useState<'grade' | 'lista'>(
    () => (window.localStorage.getItem(VISUALIZACAO_KEY) as 'grade' | 'lista') || 'grade'
  );
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  function carregar() {
    setClientes(clienteService.listar());
  }

  useCloudSyncRefresh(carregar);

  // Botão ☰ no topo (sem função nesta tela até então) alterna entre grade e lista.
  useEffect(() => {
    function handler() {
      setVisualizacao((v) => {
        const novo = v === 'grade' ? 'lista' : 'grade';
        window.localStorage.setItem(VISUALIZACAO_KEY, novo);
        return novo;
      });
    }
    window.addEventListener('zaz-alternar-visualizacao-clientes', handler);
    return () => window.removeEventListener('zaz-alternar-visualizacao-clientes', handler);
  }, []);

  const filtrados = useMemo(() => {
    return clientes.filter((c) => {
      const buscaLower = busca.toLowerCase();
      const matchBusca =
        !busca ||
        c.nomeFantasia.toLowerCase().includes(buscaLower) ||
        c.cidade.toLowerCase().includes(buscaLower) ||
        c.cnpj.includes(busca);
      const matchStatus = status === 'todos' || c.status === status;
      return matchBusca && matchStatus;
    });
  }, [clientes, busca, status]);

  function handleCriar(values: ClienteFormValues) {
    clienteService.criar({ ...values, whatsapp: values.whatsapp ?? '', endereco: values.endereco ?? '', observacoes: values.observacoes ?? '' });
    setModalAberto(false);
    carregar();
  }

  function alternarSelecao(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function sairDoModoSelecao() {
    setModoSelecao(false);
    setSelecionados(new Set());
  }

  function confirmarExclusao() {
    clienteService.removerVarios(Array.from(selecionados));
    setConfirmandoExclusao(false);
    sairDoModoSelecao();
    carregar();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ClienteFiltro busca={busca} onBuscaChange={setBusca} status={status} onStatusChange={setStatus} />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="hidden items-center gap-1 rounded-lg border border-gray-200 p-0.5 sm:flex">
            <button
              onClick={() => setVisualizacao('grade')}
              className={`rounded-md p-1.5 ${visualizacao === 'grade' ? 'bg-accent-soft text-zaz-purple' : 'text-ink-faint hover:text-ink-soft'}`}
              title="Ver em grade"
              aria-label="Ver em grade"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setVisualizacao('lista')}
              className={`rounded-md p-1.5 ${visualizacao === 'lista' ? 'bg-accent-soft text-zaz-purple' : 'text-ink-faint hover:text-ink-soft'}`}
              title="Ver em lista"
              aria-label="Ver em lista"
            >
              <List size={15} />
            </button>
          </div>

          {modoSelecao ? (
            <>
              <span className="text-xs text-ink-soft">{selecionados.size} selecionado(s)</span>
              <button
                onClick={() => setConfirmandoExclusao(true)}
                disabled={selecionados.size === 0}
                className="btn-secondary text-brand-red hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 size={15} /> Apagar
              </button>
              <button onClick={sairDoModoSelecao} className="btn-secondary">
                <X size={15} /> Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setModoSelecao(true)} className="btn-secondary">
                <CheckSquare size={15} /> Selecionar
              </button>
              <button onClick={() => setModalImportar(true)} className="btn-secondary">
                <Upload size={16} /> Importar
              </button>
              <button onClick={() => setModalAberto(true)} className="btn-primary">
                <Plus size={16} /> Novo cliente
              </button>
            </>
          )}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={<Users size={20} />}
          title="Nenhum cliente encontrado"
          description={
            clientes.length === 0
              ? 'Cadastre seu primeiro cliente para começar a acompanhar sua carteira.'
              : 'Tente ajustar os filtros de busca.'
          }
          action={
            clientes.length === 0 ? (
              <button onClick={() => setModalAberto(true)} className="btn-primary">
                <Plus size={16} /> Novo cliente
              </button>
            ) : undefined
          }
        />
      ) : visualizacao === 'grade' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((cliente) =>
            modoSelecao ? (
              <button
                key={cliente.id}
                onClick={() => alternarSelecao(cliente.id)}
                className={`card relative flex flex-col gap-3 p-4 text-left ${
                  selecionados.has(cliente.id) ? 'ring-2 ring-zaz-purple' : ''
                }`}
              >
                <span className="absolute right-3 top-3 text-zaz-purple">
                  {selecionados.has(cliente.id) ? <CheckSquare size={18} /> : <Square size={18} className="text-ink-faint" />}
                </span>
                <div className="flex items-start gap-3 pr-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-sm font-semibold text-zaz-purple">
                    {initials(nomeExibicaoCliente(cliente)) || '—'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{nomeExibicaoCliente(cliente)}</p>
                    <p className="truncate text-xs text-ink-faint">{cliente.segmento}</p>
                  </div>
                </div>
              </button>
            ) : (
              <ClienteCard key={cliente.id} cliente={cliente} />
            )
          )}
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 overflow-hidden">
          {filtrados.map((cliente) => {
            const whatsapp = linkWhatsApp(cliente.whatsapp || cliente.telefone);
            const conteudo = (
              <>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-zaz-purple">
                  {initials(nomeExibicaoCliente(cliente)) || '—'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{nomeExibicaoCliente(cliente)}</p>
                  <p className="truncate text-xs text-ink-faint">
                    {cliente.cidade}{cliente.cidade && cliente.estado ? ' - ' : ''}{cliente.estado} {cliente.segmento && `· ${cliente.segmento}`}
                  </p>
                </div>
                <span className="hidden shrink-0 items-center gap-1 text-xs text-ink-soft sm:flex">
                  <Phone size={12} className="text-ink-faint" /> {cliente.telefone || '—'}
                  {cliente.telefone && <BotaoCopiar valor={cliente.telefone} titulo="Copiar telefone" />}
                </span>
                <ClienteStatusBadge status={cliente.status} />
              </>
            );
            return (
              <div key={cliente.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-alt">
                {modoSelecao ? (
                  <button onClick={() => alternarSelecao(cliente.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="shrink-0 text-zaz-purple">
                      {selecionados.has(cliente.id) ? <CheckSquare size={18} /> : <Square size={18} className="text-ink-faint" />}
                    </span>
                    {conteudo}
                  </button>
                ) : (
                  <Link to={`/clientes/${cliente.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    {conteudo}
                  </Link>
                )}
                {!modoSelecao && whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg p-1.5 text-brand-green hover:bg-green-50"
                    title="Chamar no WhatsApp"
                    aria-label="Chamar no WhatsApp"
                  >
                    <MessageCircle size={15} />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Novo cliente" size="lg">
        <ClienteForm onSubmit={handleCriar} onCancel={() => setModalAberto(false)} />
      </Modal>

      <ImportarClientesModal
        open={modalImportar}
        onClose={() => setModalImportar(false)}
        onImportado={carregar}
      />

      <ConfirmDialog
        open={confirmandoExclusao}
        title="Apagar clientes selecionados"
        message={`Tem certeza que deseja apagar ${selecionados.size} cliente(s) selecionado(s)? Essa ação não pode ser desfeita.`}
        confirmLabel="Apagar"
        onConfirm={confirmarExclusao}
        onCancel={() => setConfirmandoExclusao(false)}
      />
    </div>
  );
}
