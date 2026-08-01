import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { registerSW } from 'virtual:pwa-register'

// Verifica automaticamente por uma versão nova a cada 60s e, assim que
// encontrar, recarrega a página sozinho — sem precisar limpar cache manual.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => registration.update(), 60_000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
