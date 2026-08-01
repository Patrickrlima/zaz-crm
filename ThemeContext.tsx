import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Tema = 'claro' | 'escuro';

const STORAGE_KEY = 'zaz_crm_tema';

interface ThemeContextValue {
  tema: Tema;
  setTema: (tema: Tema) => void;
  alternarTema: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function lerTemaSalvo(): Tema {
  const salvo = window.localStorage.getItem(STORAGE_KEY);
  if (salvo === 'claro' || salvo === 'escuro') return salvo;
  // Se não houver preferência salva, respeita a preferência do sistema.
  const prefereEscuro = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefereEscuro ? 'escuro' : 'claro';
}

function aplicarTemaNoDocumento(tema: Tema) {
  document.documentElement.classList.toggle('dark', tema === 'escuro');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(() => lerTemaSalvo());

  useEffect(() => {
    aplicarTemaNoDocumento(tema);
  }, [tema]);

  function setTema(novoTema: Tema) {
    setTemaState(novoTema);
    window.localStorage.setItem(STORAGE_KEY, novoTema);
  }

  function alternarTema() {
    setTema(tema === 'claro' ? 'escuro' : 'claro');
  }

  return <ThemeContext.Provider value={{ tema, setTema, alternarTema }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de um ThemeProvider.');
  return ctx;
}
