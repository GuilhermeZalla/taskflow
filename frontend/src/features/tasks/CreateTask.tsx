import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

export function CreateTask() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('ToDo');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const statuses = ['ToDo', 'InProgress', 'Done'];

  const handleCreate = async () => {
    try {
      const response = await api.post('/api/tasks', {
        title,
        description,
        priority,
        status,
      });

      const { Id } = response.data;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      navigate(`/tasks/${Id}`);
    } catch (error: any) {
      console.error('Create task failed:', error);
    }
  };

  return (
    <div className="max-w-md p-6 bg-white rounded-lg shadow max-h-screen overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Criar Tarefa</h2>

      <form onSubmit={e => {
        e.preventDefault();
        handleCreate();
      }}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Título
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-y"
            placeholder="Descreva a tarefa"
            required
          />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Prioridade
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 mt-4"
        >
          Criar Tarefa
        </button>
      </form>
    </div>
  );
}