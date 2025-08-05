
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { DemoControlService } from '@/services/demoControlService';

// Initialize demo control service to check demo data status
DemoControlService.initialize();

createRoot(document.getElementById("root")!).render(
  <App />
);
