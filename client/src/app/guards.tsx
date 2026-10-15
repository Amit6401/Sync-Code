import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function RequireAuth() {
  const { user, initialized, fetchMe } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!initialized) fetchMe();
  }, [initialized, fetchMe]);

  if (!initialized) {
    return <div className='flex h-screen items-center justify-center bg-gray-950 text-white'>Loading...</div>;
  }

  if (!user) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function RedirectIfAuthed() {
  const { user, initialized, fetchMe } = useAuthStore();

  useEffect(() => {
    if (!initialized) fetchMe();
  }, [initialized, fetchMe]);

  if (!initialized) {
    return <div className='flex h-screen items-center justify-center bg-gray-950 text-white'>Loading...</div>;
  }

  return user ? <Navigate to='/' replace /> : <Outlet />;
}
