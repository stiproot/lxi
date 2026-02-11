import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Container, Loader, Paper, Text, useMantineColorScheme } from '@mantine/core';
import { AuthService } from '../services/auth/auth.service';
import { handleError } from '../utils/errorHandler';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const authService = new AuthService();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const initState = async () => {
      try {
        await authService.login();
        navigate('/');
      } catch (error) {
        handleError(error, 'Login failed');
      }
    };

    initState();
  }, [authService, navigate]);

  return (
    <Center style={{ height: '100vh' }} data-theme={isDark ? 'dark' : 'light'}>
      <Container size="xs">
        <Paper shadow="xs" p="md" radius="md">
          <Center>
            <Loader size="lg" />
          </Center>
          <Text mt="md">Authenticating... Please wait.</Text>
        </Paper>
      </Container>
    </Center>
  );
};

export default AuthCallbackPage;
