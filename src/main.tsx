import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/geist-sans/400.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/geist-mono/400.css'
import './index.css'
import App from './App';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { authClient } from './lib/neonClient';
import { NeonAuthUIProvider } from '@neondatabase/auth-ui'
import { Toaster } from 'sonner'

const AppProviders = ({ children }: { children: React.ReactNode }) => {
  const content = (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  )

  if (!authClient) {
    return content
  }

  return (
    <NeonAuthUIProvider authClient={authClient as any} redirectTo="/">
      {content}
    </NeonAuthUIProvider>
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <AppProviders>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '9999px',
          fontFamily: 'var(--font-sans)',
        }
      }} />
      <App />
    </AppProviders>
  </StrictMode>,
)
