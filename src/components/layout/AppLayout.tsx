import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { usuarioService } from '../../services/usuarioService';
import { agendaService } from '../../services/agendaService';

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Bem-vindo de volta! 👋' },
  '/clientes': { title: 'Clientes', subtitle: 'Gerencie sua carteira de clientes' },
  '/agenda': { title: 'Agenda', subtitle: 'Suas visitas, ligações e reuniões' },
  '/prospeccoes': { title: 'Prospecções', subtitle: 'Funil de vendas em formato Kanban' },
  '/propostas': { title: 'Propostas', subtitle: 'Acompanhe as propostas enviadas' },
  '/simulador': { title: 'Simulador', subtitle: 'Calcule taxas e valores líquidos' },
  '/historico': { title: 'Histórico', subtitle: 'Linha do tempo de atividades' },
  '/relatorios': { title: 'Relatórios', subtitle: 'Indicadores e desempenho' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Preferências e dados do sistema' },
};

const SIDEBAR_COLAPSADO_KEY = 'zaz_crm_sidebar_colapsado';

function tituloParaRota(pathname: string): { title: string; subtitle?: string } {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/clientes/')) return { title: 'Detalhes do cliente' };
  return { title: 'Central do Vendedor' };
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const salvo = window.localStorage.getItem(SIDEBAR_COLAPSADO_KEY);
    return salvo !== null ? salvo === '1' : false;
  });
  const location = useLocation();
  const usuario = usuarioService.obter();
  const retornosHoje = agendaService.listarHoje().filter((e) => e.status === 'pendente').length;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Só ajusta automaticamente pelo tamanho da tela enquanto o usuário nunca
  // clicou no botão de recolher/expandir manualmente.
  useEffect(() => {
    if (window.localStorage.getItem(SIDEBAR_COLAPSADO_KEY) !== null) return;
    const handleResize = () => setCollapsed(window.innerWidth < 1280 && window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function alternarColapso() {
    setCollapsed((atual) => {
      const novo = !atual;
      window.localStorage.setItem(SIDEBAR_COLAPSADO_KEY, novo ? '1' : '0');
      return novo;
    });
  }

  const { title, subtitle } = tituloParaRota(location.pathname);

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={alternarColapso}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          title={title}
          subtitle={subtitle}
          usuario={usuario}
          notificationCount={retornosHoje}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </div>
  );
}
