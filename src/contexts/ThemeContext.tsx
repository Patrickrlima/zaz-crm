import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Tema = 'claro' | 'escuro';
export type EstiloDashboard = 'padrao' | 'analitico';

const STORAGE_KEY_TEMA = 'zaz_crm_tema';
const STORAGE_KEY_DASHBOARD = 'zaz_crm_estilo_dashboard';
const STORAGE_KEY_COR = 'zaz_crm_cor_destaque';

/** Cores de destaque prontas para escolher em Configurações → Aparência. */
export const CORES_DESTAQUE_PRESET: { nome: string; cor: string }[] = [
  { nome: 'Azul (padrão)', cor: '#2F6FED' },
  { nome: 'Laranja', cor: '#D9622F' },
  { nome: 'Verde', cor: '#16A34A' },
  { nome: 'Roxo', cor: '#7C4DA8' },
  { nome: 'Rosa', cor: '#D4537E' },
  { nome: 'Vermelho', cor: '#DC2626' },
];

const COR_PADRAO = '#2F6FED';

interface ThemeContextValue {
  tema: Tema;
  setTema: (tema: Tema) => void;
  alternarTema: () => void;
  estiloDashboard: EstiloDashboard;
  setEstiloDashboard: (estilo: EstiloDashboard) => void;
  corDestaque: string;
  setCorDestaque: (cor: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function lerTemaSalvo(): Tema {
  const salvo = window.localStorage.getItem(STORAGE_KEY_TEMA);
  if (salvo === 'claro' || salvo === 'escuro') return salvo;
  const prefereEscuro = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefereEscuro ? 'escuro' : 'claro';
}

function lerEstiloDashboardSalvo(): EstiloDashboard {
  const salvo = window.localStorage.getItem(STORAGE_KEY_DASHBOARD);
  return salvo === 'analitico' ? 'analitico' : 'padrao';
}

function lerCorSalva(): string {
  return window.localStorage.getItem(STORAGE_KEY_COR) || COR_PADRAO;
}

function aplicarTemaNoDocumento(tema: Tema) {
  document.documentElement.classList.toggle('dark', tema === 'escuro');
}

/** Clareia (percent > 0) ou escurece (percent < 0) uma cor hex. */
function ajustarCor(hex: string, percent: number): string {
  const limpo = hex.replace('#', '');
  const num = parseInt(limpo, 16);
  const ajustar = (canal: number) => Math.max(0, Math.min(255, Math.round(canal + 255 * percent)));
  const r = ajustar((num >> 16) & 0xff);
  const g = ajustar((num >> 8) & 0xff);
  const b = ajustar(num & 0xff);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function aplicarCorNoDocumento(cor: string) {
  const root = document.documentElement.style;
  root.setProperty('--color-zaz-purple', cor);
  root.setProperty('--color-zaz-purple-dark', ajustarCor(cor, -0.18));
  root.setProperty('--color-zaz-purple-light', ajustarCor(cor, 0.22));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(() => lerTemaSalvo());
  const [estiloDashboard, setEstiloDashboardState] = useState<EstiloDashboard>(() => lerEstiloDashboardSalvo());
  const [corDestaque, setCorDestaqueState] = useState<string>(() => lerCorSalva());

  useEffect(() => {
    aplicarTemaNoDocumento(tema);
  }, [tema]);

  useEffect(() => {
    aplicarCorNoDocumento(corDestaque);
  }, [corDestaque]);

  function setTema(novoTema: Tema) {
    setTemaState(novoTema);
    window.localStorage.setItem(STORAGE_KEY_TEMA, novoTema);
  }

  function alternarTema() {
    setTema(tema === 'claro' ? 'escuro' : 'claro');
  }

  function setEstiloDashboard(estilo: EstiloDashboard) {
    setEstiloDashboardState(estilo);
    window.localStorage.setItem(STORAGE_KEY_DASHBOARD, estilo);
  }

  function setCorDestaque(cor: string) {
    setCorDestaqueState(cor);
    window.localStorage.setItem(STORAGE_KEY_COR, cor);
  }

  return (
    <ThemeContext.Provider
      value={{ tema, setTema, alternarTema, estiloDashboard, setEstiloDashboard, corDestaque, setCorDestaque }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de um ThemeProvider.');
  return ctx;
}
