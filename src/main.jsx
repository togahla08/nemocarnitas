/**
 * main.jsx - Punto de entrada de la aplicación React
 * Configuración de React 18 con StrictMode y renderizado en root
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Crear root de React 18
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);