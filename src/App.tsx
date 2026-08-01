import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AppLayout } from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteDetalhes from './pages/ClienteDetalhes';
import Agenda from './pages/Agenda';
import Prospeccoes from './pages/Prospeccoes';
import Propostas from './pages/Propostas';
import Simulador from './pages/Simulador';
import Historico from './pages/Historico';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import { seedIfEmpty } from './services/seedService';
import { authService } from './services/authService';
import { iniciarSincronizacao, pararSincronizacao } from './services/cloudSync';
import { LoginScreen } from './components/auth/LoginScreen';
import { NovaSenhaScreen } from './components/auth/NovaSenhaScreen';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [usuario, setUsuario] = useState<User | null | undefined>(undefined);
  const [modoRecuperacaoSenha, setModoRecuperacaoSenha] = useState(false);

  useEffect(() => {
    // Sem Supabase configurado: segue funcionando 100% local (sem tela de login).
    if (!authService.configurado) {
      seedIfEmpty();
      setUsuario(null);
      return;
    }
    const unsubscribe = authService.observar((user, evento) => {
      setUsuario(user);
      // O usuário chegou aqui pelo link de "esqueci minha senha" no e-mail.
      if (evento === 'PASSWORD_RECOVERY') {
        setModoRecuperacaoSenha(true);
        return;
      }
      if (user) {
        iniciarSincronizacao(user.id);
      } else {
        pararSincronizacao();
      }
    });
    return unsubscribe;
  }, []);

  // Ainda verificando se há sessão ativa.
  if (usuario === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted">
        <Loader2 className="animate-spin text-zaz-purple" size={28} />
      </div>
    );
  }

  // Veio do link de recuperação de senha por e-mail: pede a nova senha antes de tudo.
  if (modoRecuperacaoSenha) {
    return (
      <NovaSenhaScreen
        onConcluido={() => {
          setModoRecuperacaoSenha(false);
          if (usuario) iniciarSincronizacao(usuario.id);
        }}
      />
    );
  }

  // Supabase configurado, mas ninguém logado ainda.
  if (authService.configurado && !usuario) {
    return <LoginScreen />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalhes />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/prospeccoes" element={<Prospeccoes />} />
          <Route path="/propostas" element={<Propostas />} />
          <Route path="/simulador" element={<Simulador />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
