import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Tarayıcıda kalmış eski Service Worker kayıtlarını otomatik temizle
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);