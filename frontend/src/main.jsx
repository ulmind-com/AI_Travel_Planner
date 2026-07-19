import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx'; // Custom Firebase Auth Provider
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from 'next-themes';

import App from './App.jsx';
import './index.css';
import { AppProvider } from './context/appContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AppProvider>
            <App />
          </AppProvider>
        </ThemeProvider>
        <Analytics />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);