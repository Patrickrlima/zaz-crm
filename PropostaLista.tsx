import type { Proposta } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { PropostaStatusBadge } from '../ui/StatusBadge';

export function PropostaLista({ proposta }: { proposta: Proposta }) {
  const taxaAplicada = proposta.taxas.credito;
  const valorTaxa = proposta.valor * (taxaAplicada / 100);
  const valorLiquido = proposta.valor - valorTaxa;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-faint">Cliente</p>
          <p className="font-medium text-ink">{proposta.clienteNome}</p>
        </div>
        <PropostaStatusBadge status={proposta.status} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-alt p-3">
          <p className="text-xs text-ink-faint">Valor da venda</p>
          <p className="font-semibold text-ink">{formatCurrency(proposta.valor)}</p>
        </div>
        <div className="rounded-xl bg-surface-alt p-3">
          <p className="text-xs text-ink-faint">Parcelamento</p>
          <p className="font-semibold text-ink">{proposta.parcelamento}x</p>
        </div>
        <div className="rounded-xl bg-surface-alt p-3">
          <p className="text-xs text-ink-faint">Taxa aplicada</p>
          <p className="font-semibold text-ink">{taxaAplicada.toFixed(2)}%</p>
        </div>
        <div className="rounded-xl bg-surface-alt p-3">
          <p className="text-xs text-ink-faint">Data</p>
          <p className="font-semibold text-ink">{formatDate(proposta.data)}</p>
        </div>
      </div>

      <div className="rounded-xl bg-zaz-purple p-4 text-white">
        <p className="text-xs opacity-80">Valor líquido a receber</p>
        <p className="text-xl font-semibold">{formatCurrency(valorLiquido)}</p>
      </div>

      {proposta.observacoes && (
        <div>
          <p className="mb-1 text-xs text-ink-faint">Observações</p>
          <p className="text-sm text-ink-soft">{proposta.observacoes}</p>
        </div>
      )}
    </div>
  );
}
