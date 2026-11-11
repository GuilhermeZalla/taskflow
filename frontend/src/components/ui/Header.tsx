import { Link, useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('accessToken');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <header className="bg-gray-800 h-14 border-b border-gray-700 flex items-center px-6 shadow">
      <div className="flex items-center gap-4 w-full">
        <Link to="/" className="font-bold text-xl text-white">
          <span className="text-gray-200">TaskFlow</span>
        </Link>

        <div className="hidden md:flex gap-4">
          <Link to="/workspaces" className="text-gray-300 hover:text-white transition-colors">
            Workspaces
          </Link>
          <Link to="/projects" className="text-gray-300 hover:text-white transition-colors">
            Projects
          </Link>
          <Link to="/tasks" className="text-gray-300 hover:text-white transition-colors">
            Tasks
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-xs text-gray-300 hover:text-white rounded transition-colors"
            >
              Sair
            </button>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1 text-xs text-gray-300 hover:text-white rounded transition-colors">
                Entrar
              </Link>
              <Link to="/register" className="px-3 py-1 text-xs bg-blue-600 text-white rounded transition-colors">
                Registrar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}