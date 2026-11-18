import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext';
import { applyTheme, readTheme } from './utils/theme';
import { registerPwa, scheduleReminder } from './utils/pwa';
import { startEmojiIcons } from './utils/emojiIcons';

applyTheme(readTheme());   // áp chế độ sáng/tối TRƯỚC khi render để không nháy sai màu
registerPwa();             // service worker (chỉ bản build) + bắt sự kiện "cài lên màn hình chính"
scheduleReminder();        // hẹn thông báo nhắc học nếu người dùng đã bật
startEmojiIcons();         // chế độ sáng: giữ emoji đúng màu gốc


ReactDOM.createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);