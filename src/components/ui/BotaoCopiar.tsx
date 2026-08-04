import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface BotaoCopiarProps {
  valor: string;
  titulo?: string;
  tamanho?: number;
  className?: string;
}

/** Botãozinho de copiar para a área de transferência, com feedback visual rápido (ícone vira check). */
export function BotaoCopiar({ valor, titulo = 'Copiar', tamanho = 13, className = '' }: BotaoCopiarProps) {
  const [copiado, setCopiado] = useState(false);

  async function handleCopiar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!valor) return;
    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      // Fallback para navegadores/contextos sem permissão de clipboard.
      const area = document.createElement('textarea');
      area.value = valor;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  if (!valor) return null;

  return (
    <button
      type="button"
      onClick={handleCopiar}
      className={`shrink-0 rounded p-1 text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink-soft ${className}`}
      title={copiado ? 'Copiado!' : titulo}
      aria-label={copiado ? 'Copiado' : titulo}
    >
      {copiado ? <Check size={tamanho} className="text-brand-green" /> : <Copy size={tamanho} />}
    </button>
  );
}
