import { IconMessage, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

export const NotificationService = {
  showNewMessage(senderName: string, chatName: string) {
    notifications.show({
      title: `New message in ${chatName}`,
      message: `${senderName} sent a new message`,
      icon: <IconMessage size="1.1rem" />,
      autoClose: 3000,
      color: 'blue',
    });
  },

  showParticipantJoined(participantName: string, chatName: string) {
    notifications.show({
      title: 'New participant',
      message: `${participantName} joined ${chatName}`,
      color: 'green',
      autoClose: 3000,
    });
  },

  showUserOnline(userName: string) {
    notifications.show({
      title: 'User Online',
      message: `${userName} is now online`,
      color: 'green',
      autoClose: 3000,
    });
  },

  showUserOffline(userName: string) {
    notifications.show({
      title: 'User Offline',
      message: `${userName} has gone offline`,
      color: 'gray',
      autoClose: 3000,
    });
  },

  showRepositoryChange(changedBy: string, repoName: string) {
    notifications.show({
      title: 'Repository Changed',
      message: `${changedBy} switched to repository: ${repoName}`,
      color: 'blue',
      autoClose: 3000,
    });
  },

  showError: (message: string) => {
    notifications.show({
      title: 'Error',
      message,
      color: 'red',
      icon: <IconX size={20} color="#fff" />,
    });
  },

  showRepositoryStatus(status: string, message: string) {
    notifications.show({
      title:
        status === 'Success'
          ? 'Repository Ready'
          : status === 'Error'
            ? 'Repository Error'
            : 'Repository Processing',
      message,
      color: status === 'Success' ? 'green' : status === 'Error' ? 'red' : 'blue',
      autoClose: status === 'Success' ? 5000 : 3000,
    });
  },
};
