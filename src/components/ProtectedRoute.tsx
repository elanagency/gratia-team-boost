
import { Navigate, Outlet } from 'react-router-dom';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};
