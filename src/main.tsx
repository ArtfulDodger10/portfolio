import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './magic.css'
import './letter.css'
import './wand.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
