import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthProvider.tsx'
import { appwriteClient } from './features/auth/appwrite-client.ts'

void appwriteClient.ping().then(
  () => console.info('Appwrite connection confirmed.'),
  (error: unknown) => console.error('Appwrite connection failed.', error),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
