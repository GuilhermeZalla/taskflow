import { Link, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/app/store';

export function Sidebar() {
  const user = useSelector(selectCurrentUser);

  return (
    <nav className="bg-gray-800 h-screen w-64 border-r border-gray-700">
      <div className="p-4 flex flex-col items-start">
        <h2 className="text-xl font-bold text-white mb-6">
          <span className="text-gray-200">TaskFlow</span>
        </h2>

        <nav className="flex flex-col gap-2">
          <Link to="/" className="group flex items-center px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 group-hover:text-white transition-colors">
            <span className="mr-2 flex-shrink-0 w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 1v10a1 1 0 01-1 1h-3m6-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-7 7h7m-7 7h7m-4-2a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1z" />
              </svg>
            </span>
            <span>Dashboard</span>
          </Link>

          <Link to="/workspaces" className="group flex items-center px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 group-hover:text-white transition-colors">
            <span className="mr-2 flex-shrink-0 w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span>Workspaces</span>
          </Link>

          <Link to="/projects" className="group flex items-center px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 group-hover:text-white transition-colors">
            <span className="mr-2 flex-shrink-0 w-6 h-6 bg-green-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h3.14M15 5a2 2 0 002-2H5a2 2 0 00-2 2v3.55m6.414-1.414a2 2 0 112.828 2.828L15 10.828" />
              </svg>
            </span>
            <span>Projects</span>
          </Link>

          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="group flex items-center px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 group-hover:text-white transition-colors">
              <span className="mr-2 flex-shrink-0 w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18" />
                </svg>
              </span>
              <span>Admin</span>
            </Link>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-700 mt-auto">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <span className="text-sm text-gray-300">{user?.fullName || 'Usuário'}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}