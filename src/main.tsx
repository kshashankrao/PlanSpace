import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import { seedSampleData } from './utils/seedData.ts'

// Auto-seed if requested or on initial load
if (window.location.search.includes('seed=true')) {
  seedSampleData(true);
} else {
  seedSampleData(false);
}
(window as any).seedSampleData = seedSampleData;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

