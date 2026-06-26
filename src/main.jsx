import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './Root';
import LoginGate from './components/LoginGate';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LoginGate>
      <Root />
    </LoginGate>
  </React.StrictMode>
);
