import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  LogIn,
  CloudOff,
  Mail,
  ArrowLeft,
  CheckCircle2,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeftRight,
} from 'lucide-react';
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

/** Fundo com manchas de cor desfocadas (glassmorphism), atrás do cartão de login. */
function FundoGradiente() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-surface-muted">
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-zaz-purple/40 blur-3xl" />
      <div className="absolute -right-20 top-1/4 h-80 w-80 rounded-full bg-violet-400/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-teal-300/25 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-amber-300/25 blur-3xl" />
    </div>
  );
}

export function LoginScreen() {
  const [tela, setTela] = useState<'login' | 'recuperar'>('login');

  if (!authService.configurado) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <FundoGradiente />
        <div className="card relative w-full max-w-sm p-6 text-center">
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
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <FundoGradiente />

      <div className="relative grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-2xl backdrop-blur-xl sm:grid-cols-2">
        {/* Painel de boas-vindas */}
        <div className="relative flex flex-col justify-center gap-4 bg-gradient-to-br from-zaz-purple/90 via-violet-600/80 to-fuchsia-600/80 p-8 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Bem-vindo</p>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Central do Vendedor</h1>
          <p className="text-sm text-white/80">
            {tela === 'login'
              ? 'Entre para acompanhar clientes, propostas e vendas sincronizados em todos os seus dispositivos.'
              : 'Sem problema — te ajudamos a voltar a acessar sua conta em poucos passos.'}
          </p>

          <button
            type="button"
            onClick={() => setTela(tela === 'login' ? 'recuperar' : 'login')}
            className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20"
          >
            <ArrowLeftRight size={14} />
            {tela === 'login' ? 'Esqueci minha senha' : 'Voltar para o login'}
          </button>
        </div>

        {/* Painel do formulário */}
        <div className="flex items-center p-6 sm:p-10">
          <AnimatePresence mode="wait">
            {tela === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="w-full"
              >
                <FormularioLogin aoEsquecerSenha={() => setTela('recuperar')} />
              </motion.div>
            ) : (
              <motion.div
                key="recuperar"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="w-full"
              >
                <FormularioRecuperarSenha aoVoltar={() => setTela('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function FormularioLogin({ aoEsquecerSenha }: { aoEsquecerSenha: () => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
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
    <form onSubmit={handleSubmit}>
      <h2 className="mb-1 text-xl font-semibold tracking-tight text-ink">Faça login</h2>
      <p className="mb-6 text-sm text-ink-soft">Use o mesmo e-mail em todos os seus dispositivos.</p>

      <div className="space-y-3">
        <div className="relative">
          <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="email"
            required
            className="input-base pl-10"
            style={{ borderRadius: 999 }}
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type={mostrarSenha ? 'text' : 'password'}
            required
            className="input-base pl-10 pr-10"
            style={{ borderRadius: 999 }}
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft"
            tabIndex={-1}
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={aoEsquecerSenha}
        className="mt-3 text-xs font-medium text-zaz-purple hover:underline"
      >
        Esqueceu a senha?
      </button>

      {erro && <p className="mt-3 text-xs text-brand-red">{erro}</p>}

      <button
        type="submit"
        disabled={carregando}
        className="btn-primary mt-5 w-full justify-center"
        style={{ borderRadius: 999 }}
      >
        {carregando ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
        Entrar
      </button>
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
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-3 text-brand-green" size={32} />
        <h2 className="font-semibold text-ink">E-mail enviado</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Enviamos um link de recuperação para <strong>{email}</strong>. Abra o e-mail neste mesmo dispositivo e
          clique no link para criar uma nova senha.
        </p>
        <button type="button" onClick={aoVoltar} className="btn-secondary mt-5 w-full justify-center" style={{ borderRadius: 999 }}>
          <ArrowLeft size={15} /> Voltar para o login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-1 text-xl font-semibold tracking-tight text-ink">Recuperar senha</h2>
      <p className="mb-6 text-sm text-ink-soft">Digite seu e-mail e enviaremos um link para criar uma nova senha.</p>

      <div className="relative">
        <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="email"
          required
          className="input-base pl-10"
          style={{ borderRadius: 999 }}
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
      </div>

      {erro && <p className="mt-3 text-xs text-brand-red">{erro}</p>}

      <button
        type="submit"
        disabled={carregando}
        className="btn-primary mt-5 w-full justify-center"
        style={{ borderRadius: 999 }}
      >
        {carregando ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
        Enviar link de recuperação
      </button>

      <button
        type="button"
        onClick={aoVoltar}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={14} /> Voltar para o login
      </button>
    </form>
  );
}
