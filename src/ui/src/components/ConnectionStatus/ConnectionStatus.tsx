import React from 'react';
import { Badge } from '@mantine/core';

interface ConnectionStatusProps {
  isOnline: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isOnline }) => (
  <Badge color={isOnline ? 'green' : 'gray'} variant="dot" size="sm">
    {isOnline ? 'Online' : 'Offline'}
  </Badge>
);
