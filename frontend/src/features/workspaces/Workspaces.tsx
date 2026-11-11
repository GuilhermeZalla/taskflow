import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Workspace } from '@/types';

export function Workspaces() {
  const { data: workspaces, isLoading, error } = useQuery({
    queryKey: ['/api/workspaces'],
    queryFn: async () => {
      const res = await api.get<Workspace[]>('/api/workspaces');
      return res.data;
    },
  });

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <Link to="/workspaces/create" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700">
          Criar Workspace
        </Link>
      </div>

      {isLoading && <p className="text-gray-600">Carregando...</p>}
      {error && <p className="text-red-600">Erro ao carregar workspaces.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(workspaces ?? []).map((w) => (
          <div key={w.id} className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-800">{w.name}</h3>
            <p className="text-gray-600 text-sm mt-2">{w.description || 'Sem descrição'}</p>
          </div>
        ))}
        {!isLoading && !error && (workspaces?.length ?? 0) === 0 && (
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Nenhum workspace encontrado</h3>
            <p className="text-gray-400 text-sm mt-2">Clique em "Criar Workspace" para adicionar o primeiro.</p>
          </div>
        )}
      </div>
    </div>
  );
}