import { useState, type FormEvent } from 'react';
import { UserCircle, Loader2 } from 'lucide-react';
import { usuarioService } from '../../services/usuarioService';
import type { Usuario } from '../../types';

interface PrimeiroAcessoModalProps {
  usuario: Usuario;
  onConcluido: () => void;
}

export function PrimeiroAcessoModal({ usuario, onConcluido }: PrimeiroAcessoModalProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function formatarTelefone(valor: string): string {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Digite seu nome para continuar.');
      return;
    }
    setSalvando(true);
    try {
      usuarioService.salvar({ ...usuario, nome: nome.trim(), telefone: telefone.trim() });
      onConcluido();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
        <div className="mb-1 flex items-center gap-2">
          <UserCircle size={22} className="text-zaz-purple" />
          <h1 className="text-lg font-semibold text-ink">Bem-vindo(a)!</h1>
        </div>
        <p className="mb-5 text-sm text-ink-soft">
          Antes de começar, conta pra gente seu nome e telefone. Você pode alterar isso depois em Configurações.
        </p>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Seu nome</label>
            <input
              type="text"
              required
              className="input-base"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Telefone</label>
            <input
              type="tel"
              className="input-base"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        {erro && <p className="mt-3 text-xs text-brand-red">{erro}</p>}

        <button type="submit" disabled={salvando} className="btn-primary mt-5 w-full">
          {salvando ? <Loader2 size={16} className="animate-spin" /> : null}
          Começar a usar
        </button>
      </form>
    </div>
  );
}
