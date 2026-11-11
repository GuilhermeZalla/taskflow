import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Project } from '@/types';

export function Projects() {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await api.get<Project[]>('/api/projects');
      return res.data;
    },
  });

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <Link to="/projects/create" className="bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700">
          Criar Projeto
        </Link>
      </div>

      {isLoading && <p className="text-gray-600">Carregando...</p>}
      {error && <p className="text-red-600">Erro ao carregar projetos.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(projects ?? []).map((p) => (
          <div key={p.id} className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-800">{p.name}</h3>
            <p className="text-gray-600 text-sm mt-2">{p.description || 'Sem descrição'}</p>
            <p className="text-gray-500 text-xs mt-2">Status: {p.status}</p>
          </div>
        ))}
        {!isLoading && !error && (projects?.length ?? 0) === 0 && (
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Nenhum projeto encontrado</h3>
            <p className="text-gray-400 text-sm mt-2">Clique em "Criar Projeto" para adicionar o primeiro.</p>
          </div>
        )}
      </div>
    </div>
  );
}