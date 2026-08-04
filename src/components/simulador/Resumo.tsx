import type { TaxasSimulador } from '../../types';
import { calcular } from '../../services/simuladorService';
import { formatCurrency } from '../../utils/format';

const LABELS: Record<keyof TaxasSimulador, string> = {
  debito: 'Débito',
  credito: 'Crédito à vista',
  pix: 'Pix',
  voucher: 'Voucher',
  banricompras: 'Banricompras',
  antecipacao: 'Antecipação',
  personalizada: 'Personalizada',
};

interface ResumoProps {
  valorVenda: number;
  taxas: TaxasSimulador;
  formaSelecionada: keyof TaxasSimulador;
}

const COMPARAR: (keyof TaxasSimulador)[] = ['pix', 'debito', 'voucher', 'banricompras', 'credito'];

export function Resumo({ valorVenda, taxas, formaSelecionada }: ResumoProps) {
  if (!valorVenda) return null;

  return (
    <div className="card p-5">
      <h3 className="mb-4 font-semibold text-ink">Comparativo entre formas de pagamento</h3>
      <div className="space-y-2">
        {COMPARAR.map((forma) => {
          const r = calcular(valorVenda, 1, forma, taxas);
          const ativa = forma === formaSelecionada;
          return (
            <div
              key={forma}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm ${
                ativa ? 'bg-accent-soft ring-1 ring-zaz-purple/30' : 'bg-surface-alt'
              }`}
            >
              <span className={ativa ? 'font-medium text-zaz-purple' : 'text-ink-soft'}>{LABELS[forma]}</span>
              <div className="text-right">
                <span className={`font-semibold ${ativa ? 'text-zaz-purple' : 'text-ink'}`}>
                  {formatCurrency(r.valorLiquido)}
                </span>
                <span className="ml-2 text-xs text-ink-faint">({r.taxaAplicada.toFixed(2)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
