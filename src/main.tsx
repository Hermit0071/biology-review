import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './model-fixes.css'
import './home-fixes.css'
import './animation-upgrades.css'
import './quick-review.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
