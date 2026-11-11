import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Task } from '@/types';

export function Tasks() {
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: async () => {
      const res = await api.get<Task[]>('/api/tasks');
      return res.data;
    },
  });

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <Link to="/tasks/create" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700">
          Criar Tarefa
        </Link>
      </div>

      {isLoading && <p className="text-gray-600">Carregando...</p>}
      {error && <p className="text-red-600">Erro ao carregar tarefas.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(tasks ?? []).map((t) => (
          <div key={t.id} className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-800">{t.title}</h3>
            <p className="text-gray-600 text-sm mt-2">{t.description || 'Sem descrição'}</p>
            <p className="text-gray-500 text-xs mt-2">
              Status: {t.status} | Prioridade: {t.priority}
            </p>
          </div>
        ))}
        {!isLoading && !error && (tasks?.length ?? 0) === 0 && (
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Nenhuma tarefa encontrada</h3>
            <p className="text-gray-400 text-sm mt-2">Crie um projeto e adicione tarefas para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}