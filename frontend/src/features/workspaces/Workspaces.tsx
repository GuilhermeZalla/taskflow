import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/app/store';

export function Workspaces() {
  useEffect(() => {
    // Verificar autenticação
    const user = useSelector(selectCurrentUser);
    if (!user && window.location.pathname.includes('/workspaces')) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Workspaces</h1>

      <div className="bg-white rounded-lg p-6 shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Meus Workspaces</h2>
        <p className="text-gray-600">
          Ainda não há workspaces criados. Crie um workspace para começar a organizar seus projetos.
        </p>
        <Link to="/workspaces/create" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 mt-4">
          Criar Workspace
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder cards for workspaces */}
        <div className="bg-white rounded-lg p-6 shadow hover:translate-y-1 transition-transform">
          <h3 className="text-sm font-medium text-gray-500">Nenhum workspace encontrado</h3>
          <p className="text-gray-400 text-sm mt-2">Clique em "Criar Workspace" acima para adicionar seu primeiro workspace.</p>
        </div>
      </div>
    </div>
  );
}