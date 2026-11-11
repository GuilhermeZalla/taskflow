import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Workspace } from '@/types';

export function CreateProject() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: workspaces } = useQuery({
    queryKey: ['/api/workspaces'],
    queryFn: async () => {
      const res = await api.get<Workspace[]>('/api/workspaces');
      return res.data;
    },
  });

  const handleCreate = async () => {
    try {
      await api.post('/api/projects', {
        name,
        description,
        workspaceId,
        status: 'Active',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      navigate('/projects');
    } catch (error) {
      console.error('Create project failed:', error);
    }
  };

  return (
    <div className="max-w-md p-6 bg-white rounded-lg shadow max-h-screen overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Criar Projeto</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreate();
        }}
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Nome do Projeto</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent h-24 resize-y"
            placeholder="Descreva o projeto"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Workspace</label>
          <select
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">Selecione um workspace</option>
            {(workspaces ?? []).map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700">
          Criar Projeto
        </button>
      </form>
    </div>
  );
}