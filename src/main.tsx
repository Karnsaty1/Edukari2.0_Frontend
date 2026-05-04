import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './modules/auth'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      ) : (
        <App />
      )}
    </AuthProvider>
  </StrictMode>,
)
