import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/jua';
import '@fontsource/fredoka/500.css';
import './ui/theme/paper.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// Service Worker 자동 업데이트 및 새 버전 감지 시 즉시 새로고침
registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload();
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
