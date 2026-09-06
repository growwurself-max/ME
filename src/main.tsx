import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { configureModelLoaders } from './lib/modelLoader'

// Configure DRACO + KTX2 + Meshopt decoders before any GLB loads
// Place decoders in /public/draco and /public/basis (see lib/modelLoader.ts)
configureModelLoaders()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
