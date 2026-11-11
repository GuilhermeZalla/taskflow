import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from 'src/features/dashboard/Home';
import { Login } from 'src/features/auth/Login';
import { Register } from 'src/features/auth/Register';
import { Layout } from 'src/components/ui/Layout';
import { Workspaces } from 'src/features/workspaces/Workspaces';
import { Projects } from 'src/features/projects/Projects';
import { Tasks } from 'src/features/tasks/Tasks';
import { CreateWorkspace } from 'src/features/workspaces/CreateWorkspace';
import { CreateProject } from 'src/features/projects/CreateProject';
import { CreateTask } from 'src/features/tasks/CreateTask';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '', element: <Home /> },
      { path: 'workspaces', element: <Workspaces /> },
      { path: 'workspaces/create', element: <CreateWorkspace /> },
      { path: 'projects', element: <Projects /> },
      { path: 'projects/create', element: <CreateProject /> },
      { path: 'tasks', element: <Tasks /> },
      { path: 'tasks/create', element: <CreateTask /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: '*', element: <div>Not Found</div> },
    ],
  },
]);

export { router };
export default function AppRoutes() {
  return <RouterProvider router={router} />;
}