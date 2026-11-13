// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/app/Dashboard';
import LearnRoute from './pages/LearnRoute';
import ReviewRoute from './pages/ReviewRoute';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            

            {/* Học từ vựng mới (STT 6) và Ôn tập (STT 5) là 2 trải nghiệm
                toàn màn hình riêng biệt, không nằm trong tab của Dashboard.
                Khai báo TRƯỚC "/app/*" để không bị wildcard nuốt mất. */}
            <Route path="/app/learn/:folderId" element={<LearnRoute />} />
            <Route path="/app/review" element={<ReviewRoute />} />

            {/* Dashboard.jsx tự chứa Header + Nav riêng (theme tối), nên
                không bọc thêm AppLayout ở đây để tránh 2 lớp header chồng nhau.
                "/app/*" bao gồm cả "/app" (trang chủ) lẫn mọi tab con
                (/app/on-tap, /app/thongke, /app/thuvien, /app/datcau,
                /app/dictionary...) - không cần khai riêng route "/app" nữa. */}
            <Route
                path="/app/*"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
   
        </Routes>
    );
}

export default App;
