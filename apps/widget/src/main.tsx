import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/theme.css';

// Initialize the widget
const initWidget = () => {
  const container = document.getElementById('tazkartak-widget');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}

// Export for external use
export { App };
