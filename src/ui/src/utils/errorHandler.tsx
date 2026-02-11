// src/utils/errorHandler.ts
import { IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

export const handleError = (error: any, title: string) => {
  const errorMessage = error.message || 'An unknown error occurred';
  notifications.show({
    title,
    message: errorMessage,
    color: 'red',
    radius: 'md',
    icon: <IconX size={20} color="#fff" />,
  });
};
