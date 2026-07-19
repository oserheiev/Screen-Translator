import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './contexts/AppContext';
import ThemeProvider from './components/ThemeProvider';
import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const params = new URLSearchParams(window.location.search);
const isAlertMode = params.get('mode') === 'alert';

if (isAlertMode) {
  // Dynamic import or require to avoid circular deps if any, though here it's fine
  const AlertWindow = require('./components/AlertWindow').default;
  root.render(
    <React.StrictMode>
      <AlertWindow />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <AppProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AppProvider>
    </React.StrictMode>
  );
}