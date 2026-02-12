import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole } from '@/types/database';

interface RoleRouteProps {
  requiredRoles: AppRole[];
  redirectTo?: string;
  children: React.ReactNode;
}

export default function RoleRoute({
  requiredRoles,
  redirectTo = '/dashboard',
  children,
}: RoleRouteProps) {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const hasRequiredRole = hasRole(requiredRoles);

  useEffect(() => {
    if (!hasRequiredRole) {
      navigate(redirectTo, { replace: true });
    }
  }, [hasRequiredRole, navigate, redirectTo]);

  if (!hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
}
