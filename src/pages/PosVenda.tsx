import { useEffect, useMemo, useState } from 'react';
import { Upload, ArrowLeft, ChevronRight } from 'lucide-react';
import { useCloudSyncRefresh } from '../hooks/useCloudSyncRefresh';
import { DashboardAnalitico } from '../components/dashboard/DashboardAnalitico';
import { ImportarClientesModal } from '../components/clientes/ImportarClientesModal';
import { EmptyState } from '../components/ui/EmptyState';
import { clienteService } from '../services/clienteService';
import { propostaService } from '../services/propostaService';
import { historicoService } from '../services/historicoService';
import { formatCurrency, nomeExibicaoCliente, initials } from '../utils/format';
import type { Cliente, Proposta, RegistroHistorico } from '../types';

export default function PosVenda() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [modalImportar, setModalImportar] = useState(false);
  const [verLista, setVerLista] = useState(false);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);

  function carregar() {
    setClientes(clienteService.listar());
    setPropostas(propostaService.listar());
    setHistorico(historicoService.listar());
  }

  useCloudSyncRefresh(carregar);

  // O botão ☰ no topo (sem função nesta tela até então) abre a lista de clientes.
  useEffect(() => {
    function handler() {
      setVerLista(true);
      setClienteSelecionadoId(null);
    }
    window.addEventListener('zaz-abrir-lista-pos-venda', handler);
    return () => window.removeEventListener('zaz-abrir-lista-pos-venda', handler);
  }, []);

  const clientesPosVenda = useMemo(() => clientes.filter((c) => c.posVenda), [clientes]);
  const idsPosVenda = useMemo(() => new Set(clientesPosVenda.map((c) => c.id)), [clientesPosVenda]);
  const propostasPosVenda = useMemo(() => propostas.filter((p) => idsPosVenda.has(p.clienteId)), [propostas, idsPosVenda]);
  const historicoPosVenda = useMemo(
    () => historico.filter((h) => h.clienteId && idsPosVenda.has(h.clienteId)),
    [historico, idsPosVenda]
  );

  const clienteSelecionado = clientesPosVenda.find((c) => c.id === clienteSelecionadoId) ?? null;

  function voltarAosTotais() {
    setClienteSelecionadoId(null);
    setVerLista(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {(verLista || clienteSelecionado) && (
          <button onClick={voltarAosTotais} className="btn-secondary">
            <ArrowLeft size={15} /> Voltar aos totais
          </button>
        )}
        <button onClick={() => setModalImportar(true)} className="btn-primary ml-auto">
          <Upload size={15} /> Importar planilha de pós-venda
        </button>
      </div>

      {clientesPosVenda.length === 0 ? (
        <EmptyState
          icon={<Upload size={20} />}
          title="Nenhum cliente de pós-venda ainda"
          description="Importe a planilha de pós-venda para começar a acompanhar MCV, TPV e desempenho desses clientes aqui."
          action={
            <button onClick={() => setModalImportar(true)} className="btn-primary">
              <Upload size={16} /> Importar planilha
            </button>
          }
        />
      ) : clienteSelecionado ? (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-zaz-purple">
              {initials(nomeExibicaoCliente(clienteSelecionado)) || '—'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">{nomeExibicaoCliente(clienteSelecionado)}</h2>
              <p className="text-xs text-ink-faint">Dashboard individual — pós-venda</p>
            </div>
          </div>
          <DashboardAnalitico
            clientes={[clienteSelecionado]}
            propostas={propostas.filter((p) => p.clienteId === clienteSelecionado.id)}
            historico={historico.filter((h) => h.clienteId === clienteSelecionado.id)}
          />
        </div>
      ) : verLista ? (
        <div className="card divide-y divide-gray-100 overflow-hidden">
          {clientesPosVenda.map((c) => {
            const tpv = c.tpvAtual ?? 0;
            return (
              <button
                key={c.id}
                onClick={() => setClienteSelecionadoId(c.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-alt"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-zaz-purple">
                    {initials(nomeExibicaoCliente(c)) || '—'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{nomeExibicaoCliente(c)}</p>
                    <p className="text-xs text-ink-faint">TPV atual: {formatCurrency(tpv)}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-ink-faint" />
              </button>
            );
          })}
        </div>
      ) : (
        <DashboardAnalitico clientes={clientesPosVenda} propostas={propostasPosVenda} historico={historicoPosVenda} />
      )}

      <ImportarClientesModal
        open={modalImportar}
        onClose={() => setModalImportar(false)}
        onImportado={carregar}
        modo="pos_venda"
      />
    </div>
  );
}
