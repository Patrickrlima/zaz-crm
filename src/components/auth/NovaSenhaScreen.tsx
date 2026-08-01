import { useState, type FormEvent } from 'react';
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';

export function NovaSenhaScreen({ onConcluido }: { onConcluido: () => void }) {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);
    try {
      await authService.definirNovaSenha(senha);
      setSucesso(true);
    } catch {
      setErro('Não foi possível salvar a nova senha. O link pode ter expirado — solicite um novo.');
    } finally {
      setCarregando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted p-4">
        <div className="card w-full max-w-sm p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 text-brand-green" size={28} />
          <h2 className="font-semibold text-ink">Senha atualizada</h2>
          <p className="mt-2 text-sm text-ink-soft">Sua nova senha já está ativa. Use-a a partir de agora em todos os seus dispositivos.</p>
          <button type="button" onClick={onConcluido} className="btn-primary mt-5 w-full">
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
        <h1 className="mb-1 text-lg font-semibold text-ink">Criar nova senha</h1>
        <p className="mb-5 text-sm text-ink-soft">Escolha uma nova senha para sua conta.</p>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Nova senha</label>
            <input
              type="password"
              required
              minLength={6}
              className="input-base"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Confirmar nova senha</label>
            <input
              type="password"
              required
              minLength={6}
              className="input-base"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
          </div>
        </div>

        {erro && <p className="mt-3 text-xs text-brand-red">{erro}</p>}

        <button type="submit" disabled={carregando} className="btn-primary mt-5 w-full">
          {carregando ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          Salvar nova senha
        </button>
      </form>
    </div>
  );
}
