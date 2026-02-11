// src/ProtectedRoute.tsx
import React, { ComponentType, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthService } from './services/auth/auth.service';

const authService = new AuthService();

interface ProtectedRouteProps {
  component: ComponentType<any>;
  [key: string]: any;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, ...rest }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      await authService.ensureTokensAreValid();
      setIsAuthenticated(authService.isAuthenticated());
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <Component {...rest} />;
};

export default ProtectedRoute;
