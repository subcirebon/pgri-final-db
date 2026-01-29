import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Import BrowserRouter dari react-router-dom
import { BrowserRouter } from 'react-router-dom' 
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* APP HARUS DIBUNGKUS BROWSER ROUTER AGAR MENU BISA DIKLIK */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)