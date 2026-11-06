import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';

const TOKENS = [
  'bg', 'card', 'border', 'subtle', 'muted', 'text',
  'primary', 'button', 'accent', 'secondary', 'highlight',
  'ok', 'warn', 'danger',
] as const;

export type ThemeColors = Record<(typeof TOKENS)[number], string>;

/** Mesma chave lida pelo script inline do index.html. */
const STORAGE_KEY = 'theme';

// As cores vivem em variáveis CSS (index.css), fonte única da paleta. SVGs e
// Recharts recebem cor por atributo, então aqui elas são lidas já resolvidas.
function readColors(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  const toHex = (channels: string) =>
    '#' + channels.trim().split(/\s+/).map(c => Number(c).toString(16).padStart(2, '0')).join('');
  return Object.fromEntries(
    TOKENS.map(token => [token, toHex(style.getPropertyValue(`--c-${token}`))])
  ) as ThemeColors;
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => ({ theme: currentTheme(), colors: readColors() }));

  // No Safari o JS pode rodar antes do CSS terminar de carregar: as variáveis
  // vêm vazias e os SVGs ficam com texto preto. Relê quando a página carrega.
  useEffect(() => {
    const refresh = () => setState(s => ({ ...s, colors: readColors() }));
    refresh();
    if (document.readyState === 'complete') return;
    window.addEventListener('load', refresh, { once: true });
    return () => window.removeEventListener('load', refresh);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage bloqueado (aba anônima etc.): a escolha vale só pra esta visita
    }
    const colors = readColors();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.bg);
    setState({ theme: next, colors });
  }, []);

  return (
    <ThemeContext.Provider value={{ ...state, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme precisa estar dentro de <ThemeProvider>');
  return ctx;
}
