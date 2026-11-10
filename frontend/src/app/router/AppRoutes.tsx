import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from 'src/features/dashboard/Home';
import { Login } from 'src/features/auth/Login';
import { Register } from 'src/features/auth/Register';
import { Layout } from 'src/components/ui/Layout';
import { Workspaces } from 'src/features/workspaces/Workspaces';
import { Projects } from 'src/features/projects/Projects';
import { Tasks } from 'src/features/tasks/Tasks';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '',
        element: <Home />,
      },
      {
        path: 'workspaces',
        element: <Workspaces />,
      },
      {
        path: 'projects',
        element: <Projects />,
      },
      {
        path: 'tasks',
        element: <Tasks />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: '*',
        element: <div>Not Found</div>,
      },
    ],
  },
);

export { router };
export default function AppRoutes() {
  return <RouterProvider router={router} />;
}