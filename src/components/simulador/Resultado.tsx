import { TrendingDown, TrendingUp } from 'lucide-react';
import type { ResultadoSimulacao } from '../../services/simuladorService';
import { formatCurrency } from '../../utils/format';

export function Resultado({ resultado }: { resultado: ResultadoSimulacao | null }) {
  if (!resultado) {
    return (
      <div className="card flex flex-col items-center justify-center p-10 text-center">
        <p className="text-sm text-ink-faint">Preencha os dados da venda para ver o resultado.</p>
      </div>
    );
  }

  const positivo = resultado.economiaVsCredito >= 0;

  return (
    <div className="card p-5">
      <h3 className="mb-4 font-semibold text-ink">Resultado</h3>

      <div className="rounded-xl bg-purple-50 p-4 text-center">
        <p className="text-xs font-medium text-zaz-purple">Valor líquido a receber</p>
        <p className="mt-1 text-3xl font-semibold text-zaz-purple">{formatCurrency(resultado.valorLiquido)}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-alt p-3">
          <p className="text-xs text-ink-faint">Taxa aplicada</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{resultado.taxaAplicada.toFixed(2)}%</p>
        </div>
        <div className="rounded-xl bg-surface-alt p-3">
          <p className="text-xs text-ink-faint">Valor da taxa</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{formatCurrency(resultado.valorTaxa)}</p>
        </div>
        <div className="rounded-xl bg-surface-alt p-3">
          <p className="text-xs text-ink-faint">Valor bruto</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{formatCurrency(resultado.valorBruto)}</p>
        </div>
        <div className="rounded-xl bg-surface-alt p-3">
          <p className="text-xs text-ink-faint">Valor por parcela</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{formatCurrency(resultado.valorPorParcela)}</p>
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-3 rounded-xl p-3.5 ${
          positivo ? 'bg-green-50' : 'bg-red-50'
        }`}
      >
        {positivo ? (
          <TrendingDown size={18} className="shrink-0 text-brand-green" />
        ) : (
          <TrendingUp size={18} className="shrink-0 text-brand-red" />
        )}
        <div>
          <p className={`text-sm font-semibold ${positivo ? 'text-brand-green' : 'text-brand-red'}`}>
            {positivo ? 'Economia' : 'Custo adicional'} de {formatCurrency(Math.abs(resultado.economiaVsCredito))}
          </p>
          <p className="text-xs text-ink-soft">
            {Math.abs(resultado.economiaPercentual).toFixed(2)}% comparado ao crédito à vista
          </p>
        </div>
      </div>
    </div>
  );
}
