import { Link } from 'react-router-dom';

export function Sidebar() {
  return (
    <nav className="bg-gray-800 min-h-[calc(100vh-3.5rem)] w-64 border-r border-gray-700">
      <div className="p-4 flex flex-col items-start">
        <div className="flex flex-col gap-2 w-full">
          <Link to="/" className="px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link to="/workspaces" className="px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors">
            Workspaces
          </Link>
          <Link to="/projects" className="px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors">
            Projects
          </Link>
          <Link to="/tasks" className="px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors">
            Tasks
          </Link>
        </div>
      </div>
    </nav>
  );
}