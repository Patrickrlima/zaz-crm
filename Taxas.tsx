import type { TaxasSimulador } from '../../types';

const CAMPOS: { key: keyof TaxasSimulador; label: string }[] = [
  { key: 'debito', label: 'Débito (%)' },
  { key: 'credito', label: 'Crédito à vista (%)' },
  { key: 'pix', label: 'Pix (%)' },
  { key: 'voucher', label: 'Voucher (%)' },
  { key: 'banricompras', label: 'Banricompras (%)' },
  { key: 'antecipacao', label: 'Antecipação por parcela (%)' },
  { key: 'personalizada', label: 'Taxa personalizada (%)' },
];

interface TaxasProps {
  taxas: TaxasSimulador;
  onChange: (taxas: TaxasSimulador) => void;
  onSalvar: () => void;
}

export function Taxas({ taxas, onChange, onSalvar }: TaxasProps) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 font-semibold text-ink">Taxas configuradas</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CAMPOS.map((campo) => (
          <div key={campo.key}>
            <label className="mb-1 block text-xs font-medium text-ink-soft">{campo.label}</label>
            <input
              type="number"
              step="0.01"
              className="input-base"
              value={taxas[campo.key]}
              onChange={(e) => onChange({ ...taxas, [campo.key]: Number(e.target.value) })}
            />
          </div>
        ))}
      </div>
      <button onClick={onSalvar} className="btn-primary mt-4 w-full sm:w-auto">
        Salvar taxas
      </button>
    </div>
  );
}
