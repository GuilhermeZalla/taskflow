import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/app/store';

export function Tasks() {
  useEffect(() => {
    const user = useSelector(selectCurrentUser);
    if (!user && window.location.pathname.includes('/tasks')) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>

      <div className="bg-white rounded-lg p-6 shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Minhas Tarefas</h2>
        <p className="text-gray-600">
          Suas tarefas aparecerão aqui após criar projetos e tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder cards for tasks */}
        <div className="bg-white rounded-lg p-6 shadow hover:translate-y-1 transition-transform">
          <h3 className="text-sm font-medium text-gray-500">Nenhuma tarefa encontrada</h3>
          <p className="text-gray-400 text-sm">Crie um projeto e adicione tarefas para começar.</p>
        </div>
      </div>
    </div>
  );
}