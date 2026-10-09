import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/public-sans'
import './index.css'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { EstadoProvider } from './lib/estado'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <EstadoProvider>
        <App />
      </EstadoProvider>
    </HashRouter>
  </React.StrictMode>,
)
