import type { TaxasSimulador } from '../../types';

interface CalculadoraProps {
  valorVenda: number;
  parcelas: number;
  formaPagamento: keyof TaxasSimulador;
  onValorVendaChange: (v: number) => void;
  onParcelasChange: (v: number) => void;
  onFormaPagamentoChange: (v: keyof TaxasSimulador) => void;
}

const FORMAS: { key: keyof TaxasSimulador; label: string }[] = [
  { key: 'debito', label: 'Débito' },
  { key: 'credito', label: 'Crédito' },
  { key: 'pix', label: 'Pix' },
  { key: 'voucher', label: 'Voucher' },
  { key: 'banricompras', label: 'Banricompras' },
  { key: 'personalizada', label: 'Taxa personalizada' },
];

export function Calculadora({
  valorVenda,
  parcelas,
  formaPagamento,
  onValorVendaChange,
  onParcelasChange,
  onFormaPagamentoChange,
}: CalculadoraProps) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 font-semibold text-ink">Calculadora</h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Valor da venda</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-faint">R$</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={valorVenda || ''}
              onChange={(e) => onValorVendaChange(Number(e.target.value))}
              className="input-base pl-9"
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Forma de pagamento</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FORMAS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => onFormaPagamentoChange(f.key)}
                className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                  formaPagamento === f.key
                    ? 'border-zaz-purple bg-purple-50 text-zaz-purple'
                    : 'border-gray-200 text-ink-soft hover:bg-surface-alt'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Quantidade de parcelas {formaPagamento !== 'credito' && <span className="text-ink-faint">(à vista)</span>}
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={parcelas}
            disabled={formaPagamento !== 'credito'}
            onChange={(e) => onParcelasChange(Number(e.target.value))}
            className="input-base disabled:bg-surface-alt disabled:text-ink-faint"
          />
        </div>
      </div>
    </div>
  );
}
