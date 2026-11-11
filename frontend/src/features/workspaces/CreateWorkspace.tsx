import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

export function CreateWorkspace() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleCreate = async () => {
    try {
      await api.post('/api/workspaces', { name, description });
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
      navigate('/workspaces');
    } catch (error) {
      console.error('Create workspace failed:', error);
    }
  };

  return (
    <div className="max-w-md p-6 bg-white rounded-lg shadow max-h-screen overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Criar Workspace</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreate();
        }}
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-y"
            placeholder="Descreva o objetivo do workspace"
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700">
          Criar Workspace
        </button>
      </form>
    </div>
  );
}