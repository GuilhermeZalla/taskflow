import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from 'src/features/dashboard/Home';
import { Login } from 'src/features/auth/Login';
import { Register } from 'src/features/auth/Register';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '*',
    element: <div>Not Found</div>,
  },
]);

export { router };
export default function AppRoutes() {
  return <RouterProvider router={router} />;
}