import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

export function CreateProject() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Buscar workspaces disponíveis (simulado - em produção viria da API)
  const workspaces = [
    { value: '1', label: 'Workspace Pessoal' },
    { value: '2', label: 'Workspace Trabalho' },
  ];

  const handleCreate = async () => {
    try {
      const response = await api.post('/api/projects', {
        name,
        description,
        workspaceId: workspaces[0]?.value || '1',
      });

      const { Id } = response.data;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      navigate(`/projects/${Id}`);
    } catch (error: any) {
      console.error('Create project failed:', error);
    }
  };

  return (
    <div className="max-w-md p-6 bg-white rounded-lg shadow max-h-screen overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Criar Projeto</h2>

      <form onSubmit={e => {
        e.preventDefault();
        handleCreate();
      }}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nome do Projeto
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent h-24 resize-y"
            placeholder="Descreva o projeto"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Workspace
          </label>
          <select
            value={workspaceId}
            onChange={e => setWorkspaceId(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">Selecione um workspace</option>
            {workspaces.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700"
        >
          Criar Projeto
        </button>
      </form>
    </div>
  );
}