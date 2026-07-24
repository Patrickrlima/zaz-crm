import { Eye, Copy, FileDown, Trash2, Pencil } from 'lucide-react';
import type { Proposta } from '../../types';
import { PropostaStatusBadge } from '../ui/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

interface PropostaCardProps {
  proposta: Proposta;
  onVisualizar: (p: Proposta) => void;
  onDuplicar: (id: string) => void;
  onGerarPdf: (p: Proposta) => void;
  onRemover: (id: string) => void;
  onEditarStatus: (id: string, status: Proposta['status']) => void;
}

export function PropostaCard({
  proposta,
  onVisualizar,
  onDuplicar,
  onGerarPdf,
  onRemover,
  onEditarStatus,
}: PropostaCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{proposta.clienteNome}</p>
          <p className="text-xs text-ink-faint">{formatDate(proposta.data)} · {proposta.parcelamento}x</p>
        </div>
        <PropostaStatusBadge status={proposta.status} />
      </div>

      <p className="mt-3 text-2xl font-semibold text-ink">{formatCurrency(proposta.valor)}</p>

      <div className="mt-3">
        <select
          value={proposta.status}
          onChange={(e) => onEditarStatus(proposta.id, e.target.value as Proposta['status'])}
          className="input-base py-1.5 text-xs"
        >
          <option value="enviada">Enviada</option>
          <option value="aceita">Aceita</option>
          <option value="recusada">Recusada</option>
          <option value="expirada">Expirada</option>
        </select>
      </div>

      <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-3">
        <button onClick={() => onVisualizar(proposta)} className="flex-1 rounded-lg p-2 text-ink-soft hover:bg-surface-alt" title="Visualizar">
          <Eye size={16} className="mx-auto" />
        </button>
        <button onClick={() => onDuplicar(proposta.id)} className="flex-1 rounded-lg p-2 text-ink-soft hover:bg-surface-alt" title="Duplicar">
          <Copy size={16} className="mx-auto" />
        </button>
        <button onClick={() => onGerarPdf(proposta)} className="flex-1 rounded-lg p-2 text-ink-soft hover:bg-surface-alt" title="Gerar PDF">
          <FileDown size={16} className="mx-auto" />
        </button>
        <button onClick={() => onVisualizar(proposta)} className="flex-1 rounded-lg p-2 text-ink-soft hover:bg-surface-alt" title="Editar">
          <Pencil size={16} className="mx-auto" />
        </button>
        <button onClick={() => onRemover(proposta.id)} className="flex-1 rounded-lg p-2 text-brand-red hover:bg-red-50" title="Excluir">
          <Trash2 size={16} className="mx-auto" />
        </button>
      </div>
    </div>
  );
}
