import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { PropostaCard } from '../components/propostas/PropostaCard';
import { PropostaLista } from '../components/propostas/PropostaLista';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { propostaService } from '../services/propostaService';
import { clienteService } from '../services/clienteService';
import { simuladorService, TAXAS_PADRAO } from '../services/simuladorService';
import type { Cliente, Proposta, StatusProposta } from '../types';

export default function Propostas() {
  const [searchParams] = useSearchParams();
  const novaParaClienteId = searchParams.get('novaPara');

  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusProposta | 'todos'>('todos');
  const [modalNova, setModalNova] = useState(!!novaParaClienteId);
  const [visualizando, setVisualizando] = useState<Proposta | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const [novoClienteId, setNovoClienteId] = useState(novaParaClienteId ?? '');
  const [novoValor, setNovoValor] = useState<number>(0);
  const [novoParcelamento, setNovoParcelamento] = useState(1);
  const [novasObservacoes, setNovasObservacoes] = useState('');

  function carregar() {
    setPropostas(propostaService.listar());
    setClientes(clienteService.listar());
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtradas = useMemo(
    () => (filtroStatus === 'todos' ? propostas : propostas.filter((p) => p.status === filtroStatus)),
    [propostas, filtroStatus]
  );

  function handleCriar() {
    const cliente = clientes.find((c) => c.id === novoClienteId);
    if (!cliente || !novoValor) return;
    propostaService.criar({
      clienteId: cliente.id,
      clienteNome: cliente.nomeFantasia,
      valor: novoValor,
      parcelamento: novoParcelamento,
      taxas: simuladorService.obterTaxas() || TAXAS_PADRAO,
      observacoes: novasObservacoes,
    });
    setModalNova(false);
    setNovoClienteId('');
    setNovoValor(0);
    setNovoParcelamento(1);
    setNovasObservacoes('');
    carregar();
  }

  function handleDuplicar(id: string) {
    propostaService.duplicar(id);
    carregar();
  }

  function handleStatus(id: string, status: Proposta['status']) {
    propostaService.atualizarStatus(id, status);
    carregar();
  }

  async function handleGerarPdf(proposta: Proposta) {
    const { gerarPdfProposta } = await import('../services/pdfService');
    const cliente = clientes.find((c) => c.id === proposta.clienteId);
    await gerarPdfProposta(proposta, cliente);
  }

  function handleRemover() {
    if (removendoId) propostaService.remover(removendoId);
    setRemovendoId(null);
    carregar();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as StatusProposta | 'todos')}
          className="input-base sm:w-56"
        >
          <option value="todos">Todos os status</option>
          <option value="enviada">Enviada</option>
          <option value="aceita">Aceita</option>
          <option value="recusada">Recusada</option>
          <option value="expirada">Expirada</option>
        </select>
        <button onClick={() => setModalNova(true)} className="btn-primary shrink-0">
          <Plus size={16} /> Nova proposta
        </button>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          icon={<FileText size={20} />}
          title="Nenhuma proposta encontrada"
          description="Crie uma proposta diretamente ou gere uma a partir do Simulador."
          action={
            <button onClick={() => setModalNova(true)} className="btn-primary">
              <Plus size={16} /> Nova proposta
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((p) => (
            <PropostaCard
              key={p.id}
              proposta={p}
              onVisualizar={setVisualizando}
              onDuplicar={handleDuplicar}
              onGerarPdf={handleGerarPdf}
              onRemover={(id) => setRemovendoId(id)}
              onEditarStatus={handleStatus}
            />
          ))}
        </div>
      )}

      <Modal open={modalNova} onClose={() => setModalNova(false)} title="Nova proposta">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Cliente</label>
            <select value={novoClienteId} onChange={(e) => setNovoClienteId(e.target.value)} className="input-base">
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nomeFantasia}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Valor</label>
              <input
                type="number"
                step="0.01"
                className="input-base"
                value={novoValor || ''}
                onChange={(e) => setNovoValor(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Parcelamento</label>
              <input
                type="number"
                min={1}
                max={12}
                className="input-base"
                value={novoParcelamento}
                onChange={(e) => setNovoParcelamento(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Observações</label>
            <textarea
              rows={3}
              className="input-base resize-none"
              value={novasObservacoes}
              onChange={(e) => setNovasObservacoes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalNova(false)} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleCriar} disabled={!novoClienteId || !novoValor} className="btn-primary disabled:opacity-40">
              Criar proposta
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!visualizando} onClose={() => setVisualizando(null)} title="Detalhes da proposta">
        {visualizando && <PropostaLista proposta={visualizando} />}
      </Modal>

      <ConfirmDialog
        open={!!removendoId}
        title="Excluir proposta"
        message="Tem certeza que deseja excluir esta proposta?"
        confirmLabel="Excluir"
        onConfirm={handleRemover}
        onCancel={() => setRemovendoId(null)}
      />
    </div>
  );
}
