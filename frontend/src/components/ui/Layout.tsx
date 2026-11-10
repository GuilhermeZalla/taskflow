import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/app/store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    // Verificar autenticação
    if (!user && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <div className="flex">
        {/* Sidebar - apenas em telas maiores */}
        <Sidebar />

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}