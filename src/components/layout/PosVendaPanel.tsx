import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { ImportarClientesModal } from '../clientes/ImportarClientesModal';
import { EmptyState } from '../ui/EmptyState';
import { clienteService } from '../../services/clienteService';
import { propostaService } from '../../services/propostaService';
import { formatCurrency } from '../../utils/format';
import { nomeExibicaoCliente } from '../../utils/format';
import type { Cliente, Proposta } from '../../types';

interface PosVendaPanelProps {
  open: boolean;
  onClose: () => void;
}

export function PosVendaPanel({ open, onClose }: PosVendaPanelProps) {
  const [modalImportar, setModalImportar] = useState(false);
  const [versao, setVersao] = useState(0);

  const clientes = useMemo<Cliente[]>(() => clienteService.listar().filter((c) => c.posVenda), [open, versao]);
  const propostas = useMemo<Proposta[]>(() => propostaService.listar(), [open, versao]);

  const linhas = useMemo(() => {
    return clientes.map((c) => {
      const mcv = c.mcvComprometido ?? 0;
      const tpvAtual = propostas
        .filter((p) => p.clienteId === c.id && p.status === 'aceita')
        .reduce((acc, p) => acc + p.valor, 0);
      const percentual = mcv > 0 ? (tpvAtual / mcv) * 100 : 0;
      return { cliente: c, mcv, tpvAtual, percentual };
    });
  }, [clientes, propostas]);

  const totalMcv = linhas.reduce((acc, l) => acc + l.mcv, 0);
  const totalTpv = linhas.reduce((acc, l) => acc + l.tpvAtual, 0);

  return (
    <>
      <Modal open={open} onClose={onClose} title="Pós-venda" size="xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft">
            Clientes já fechados acompanhados pelo pós-venda. Esses dados também contam no{' '}
            <Link to="/" onClick={onClose} className="text-zaz-purple hover:underline">
              Dashboard Analítico
            </Link>
            .
          </p>
          <button onClick={() => setModalImportar(true)} className="btn-primary shrink-0">
            <Upload size={15} /> Importar planilha
          </button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <Users size={14} /> Clientes de pós-venda
            </div>
            <p className="mt-1 text-lg font-semibold text-ink">{clientes.length}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <DollarSign size={14} /> MCV comprometido
            </div>
            <p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(totalMcv)}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <TrendingUp size={14} /> TPV atual
            </div>
            <p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(totalTpv)}</p>
          </div>
        </div>

        {linhas.length === 0 ? (
          <EmptyState
            icon={<Upload size={20} />}
            title="Nenhum cliente de pós-venda ainda"
            description="Importe a planilha de pós-venda para começar a acompanhar esses clientes aqui e no Dashboard Analítico."
            action={
              <button onClick={() => setModalImportar(true)} className="btn-primary">
                <Upload size={16} /> Importar planilha
              </button>
            }
          />
        ) : (
          <div className="max-h-96 overflow-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-surface-alt">
                <tr>
                  <th className="px-3 py-2 font-medium text-ink-soft">Cliente</th>
                  <th className="px-3 py-2 font-medium text-ink-soft">MCV</th>
                  <th className="px-3 py-2 font-medium text-ink-soft">TPV atual</th>
                  <th className="px-3 py-2 font-medium text-ink-soft">%</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.cliente.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      <Link to={`/clientes/${l.cliente.id}`} onClick={onClose} className="text-ink hover:text-zaz-purple">
                        {nomeExibicaoCliente(l.cliente)}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-ink-soft">{formatCurrency(l.mcv)}</td>
                    <td className="px-3 py-2 text-ink-soft">{formatCurrency(l.tpvAtual)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`badge ${
                          l.percentual >= 80 ? 'bg-green-50 text-brand-green' : l.percentual >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-brand-red'
                        }`}
                      >
                        {l.percentual.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ImportarClientesModal
        open={modalImportar}
        onClose={() => setModalImportar(false)}
        onImportado={() => setVersao((v) => v + 1)}
        modo="pos_venda"
      />
    </>
  );
}
