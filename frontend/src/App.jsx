// src/App.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Mỗi trang là một "chunk" riêng: người vào Landing/Đăng nhập không phải tải code của Dashboard, màn học, biểu đồ...
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/app/Dashboard'));
const LearnRoute = lazy(() => import('./pages/LearnRoute'));
const ReviewRoute = lazy(() => import('./pages/ReviewRoute'));

function PageLoading() {
    return (
        <div role="status" aria-live="polite"
            style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg)', color: 'var(--color-ink-muted)', fontSize: 14 }}>
            Đang tải…
        </div>
    );
}

function App() {
    return (
        <Suspense fallback={<PageLoading />}>
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

                {/* Dashboard.jsx tự chứa Header + Nav riêng (theme tối), nên không bọc thêm AppLayout.
                    "/app/*" bao gồm cả "/app" (trang chủ) lẫn mọi tab con. */}
                <Route
                    path="/app/*"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Suspense>
    );
}

export default App;
