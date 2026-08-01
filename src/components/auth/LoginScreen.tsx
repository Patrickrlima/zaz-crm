import { useState, type FormEvent } from 'react';
import { Loader2, LogIn, CloudOff, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';

function traduzErro(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).';
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde um instante e tente novamente.';
  if (m.includes('network') || m.includes('fetch')) return 'Falha de conexão. Verifique sua internet.';
  if (m.includes('user not found')) return 'Não encontramos uma conta com esse e-mail.';
  return 'Não foi possível concluir. Tente novamente.';
}

export function LoginScreen() {
  const [tela, setTela] = useState<'login' | 'recuperar'>('login');

  if (!authService.configurado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted p-4">
        <div className="card w-full max-w-sm p-6 text-center">
          <CloudOff className="mx-auto mb-3 text-ink-faint" size={28} />
          <h2 className="font-semibold text-ink">Sincronização em nuvem não configurada</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Preencha o arquivo <code className="rounded bg-surface-alt px-1 py-0.5">.env</code> com as chaves do seu
            projeto Supabase (veja <code className="rounded bg-surface-alt px-1 py-0.5">.env.example</code>) e recarregue
            a página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted p-4">
      {tela === 'login' ? (
        <FormularioLogin aoEsquecerSenha={() => setTela('recuperar')} />
      ) : (
        <FormularioRecuperarSenha aoVoltar={() => setTela('login')} />
      )}
    </div>
  );
}

function FormularioLogin({ aoEsquecerSenha }: { aoEsquecerSenha: () => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await authService.entrar(email.trim(), senha);
    } catch (err) {
      const mensagem = (err as { message?: string })?.message ?? '';
      setErro(traduzErro(mensagem));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
      <h1 className="mb-1 text-lg font-semibold text-ink">Central do Vendedor</h1>
      <p className="mb-5 text-sm text-ink-soft">Entre para sincronizar seus dados entre dispositivos.</p>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
          <input
            type="email"
            required
            className="input-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Senha</label>
          <input
            type="password"
            required
            className="input-base"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
      </div>

      {erro && <p className="mt-3 text-xs text-brand-red">{erro}</p>}

      <button type="submit" disabled={carregando} className="btn-primary mt-5 w-full">
        {carregando ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
        Entrar
      </button>

      <button
        type="button"
        onClick={aoEsquecerSenha}
        className="mt-3 w-full text-center text-xs font-medium text-zaz-purple hover:underline"
      >
        Esqueci minha senha
      </button>

      <p className="mt-4 text-center text-xs text-ink-faint">
        Use o mesmo e-mail e senha em todos os seus dispositivos para manter os dados sincronizados.
      </p>
    </form>
  );
}

function FormularioRecuperarSenha({ aoVoltar }: { aoVoltar: () => void }) {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await authService.enviarEmailRecuperacao(email.trim());
      setEnviado(true);
    } catch (err) {
      const mensagem = (err as { message?: string })?.message ?? '';
      setErro(traduzErro(mensagem));
    } finally {
      setCarregando(false);
    }
  }

  if (enviado) {
    return (
      <div className="card w-full max-w-sm p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 text-brand-green" size={28} />
        <h2 className="font-semibold text-ink">E-mail enviado</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Enviamos um link de recuperação para <strong>{email}</strong>. Abra o e-mail neste mesmo dispositivo e
          clique no link para criar uma nova senha.
        </p>
        <button type="button" onClick={aoVoltar} className="btn-secondary mt-5 w-full">
          <ArrowLeft size={15} /> Voltar para o login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
      <button
        type="button"
        onClick={aoVoltar}
        className="mb-3 flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={14} /> Voltar
      </button>
      <h1 className="mb-1 text-lg font-semibold text-ink">Recuperar senha</h1>
      <p className="mb-5 text-sm text-ink-soft">Digite seu e-mail e enviaremos um link para você criar uma nova senha.</p>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
        <input
          type="email"
          required
          className="input-base"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
      </div>

      {erro && <p className="mt-3 text-xs text-brand-red">{erro}</p>}

      <button type="submit" disabled={carregando} className="btn-primary mt-5 w-full">
        {carregando ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
        Enviar link de recuperação
      </button>
    </form>
  );
}