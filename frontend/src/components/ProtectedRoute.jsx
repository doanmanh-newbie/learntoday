import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const shell = {
  display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
  flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center', background: '#07091a',
};

export default function ProtectedRoute({ children }) {
  const { user, loading, connectionError, retryConnection } = useAuth();

  if (loading) {
    return (
      <div style={shell}>
        <p style={{ color: '#8892b0', fontSize: 14 }}>Đang tải...</p>
      </div>
    );
  }

  // Có phiên đăng nhập nhưng chưa nói chuyện được với máy chủ/database: đừng đá về trang đăng nhập.
  if (!user && connectionError) {
    return (
      <div style={shell}>
        <div style={{ fontSize: 44 }}>📡</div>
        <p style={{ color: '#f8faff', fontSize: 16, fontWeight: 700, margin: 0 }}>Chưa kết nối được máy chủ</p>
        <p style={{ color: '#8892b0', fontSize: 14, maxWidth: 420, margin: 0 }}>{connectionError}</p>
        <button
          onClick={retryConnection}
          style={{
            padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none',
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
