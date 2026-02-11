// src/router.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ChatbotPage from './components/Chatbot/Chatbot';
import Layout from './Layout';
import AuthCallbackPage from './pages/AuthCallback.page';
import LoginPage from './pages/Login.page';
import ProfilePage from './pages/Profile.page'; // Import the ProfilePage
import ProtectedRoute from './ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <ProtectedRoute component={ChatbotPage} />,
      },
      {
        path: 'chat/:chatId',
        element: <ProtectedRoute component={ChatbotPage} />,
      },
      {
        path: 'profile',
        element: <ProtectedRoute component={ProfilePage} />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/authorization-code/callback',
    element: <AuthCallbackPage />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
