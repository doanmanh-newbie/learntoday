// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
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

            {/* Dashboard.jsx tự chứa Header + Nav riêng (theme tối), nên
                không bọc thêm AppLayout ở đây để tránh 2 lớp header chồng nhau. */}
            <Route
                path="/app"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            {/* Học từ vựng mới (STT 6) và Ôn tập (STT 5) là 2 trải nghiệm
                toàn màn hình riêng biệt, không nằm trong tab của Dashboard. */}
            <Route path="/app/learn" element={<LearnRoute />} />
            <Route path="/app/review" element={<ReviewRoute />} />
        </Routes>
    );
}

export default App;
