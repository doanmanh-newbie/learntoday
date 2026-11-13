import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext';
import { applyTheme, readTheme } from './utils/theme';

applyTheme(readTheme());   // áp chế độ sáng/tối TRƯỚC khi render để không nháy sai màu


ReactDOM.createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);