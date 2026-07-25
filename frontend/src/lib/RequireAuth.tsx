import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export function RequireAuth({
  children,
  loginReason,
}: {
  children: React.ReactNode;
  loginReason?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      const next = encodeURIComponent(location.pathname + location.search);
      const reason = loginReason ? `&reason=${loginReason}` : '';
      navigate(`/login?next=${next}${reason}`, { replace: true });
    }
  }, [ready, user, navigate, location, loginReason]);

  if (!ready) return <div className="py-20 text-center text-muted">Секунду...</div>;
  if (!user) return null;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate('/login?next=/admin', { replace: true });
      return;
    }
    if (user.role !== 'admin') navigate('/', { replace: true });
  }, [ready, user, navigate]);

  if (!ready) return <div className="py-20 text-center text-muted">Секунду...</div>;
  if (!user || user.role !== 'admin') return null;
  return <>{children}</>;
}
