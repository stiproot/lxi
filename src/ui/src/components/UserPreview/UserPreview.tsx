import { Avatar, Badge, Group, Stack, Text } from '@mantine/core';
import { User } from '@/types';

interface UserPreviewProps {
  user: User;
  isOwner?: boolean;
}

export const UserPreview = ({ user, isOwner }: UserPreviewProps) => {
  if (!user) {
    return null;
  }

  return (
    <Stack gap="md">
      <Group wrap="nowrap" gap="md">
        <Avatar src={user.avatarUrl} name={user.name} size="xl" radius="xl" />
        <Stack gap={4}>
          <Group gap={6}>
            <Text fw={600}>{user.name}</Text>
            {isOwner && (
              <Badge size="xs" variant="light" color="blue">
                Owner
              </Badge>
            )}
          </Group>
          {user.title && (
            <Text size="sm" c="dimmed">
              {user.title}
            </Text>
          )}
        </Stack>
      </Group>
    </Stack>
  );
};
