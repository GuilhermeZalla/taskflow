import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Bem-vindo ao TaskFlow</h1>
      <div className="max-w-md">
        <p className="text-gray-700 mb-4">
          Plataforma colaborativa de gestão de projetos e tarefas.
        </p>
        <Link to="/login" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700">
          Entrar
        </Link>
        <Link to="/register" className="ml-4 bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700">
          Registrar
        </Link>
      </div>
    </div>
  );
}