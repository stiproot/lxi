import React from 'react';
import { IconAlertCircle, IconMail } from '@tabler/icons-react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useUserContext } from '../contexts/UserContext';

const ProfilePage: React.FC = () => {
  const { user, loading, error } = useUserContext();

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ height: '100vh' }}>
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error.message}
        </Alert>
      </Center>
    );
  }

  if (!user) {
    return (
      <Center style={{ height: '100vh' }}>
        <Alert
          icon={<IconAlertCircle size={24} />}
          title="No User Information"
          color="yellow"
          radius="lg"
        >
          No user information available.
        </Alert>
      </Center>
    );
  }

  return (
    <Center style={{ height: '100vh', padding: '20px' }}>
      <Card
        shadow="sm"
        padding="xl"
        radius="lg"
        withBorder
        style={{ width: '100%', maxWidth: '600px' }}
      >
        <Stack align="flex-end" mb="md">
          <Avatar size="xl" radius="xl" alt={user.name} />
          <Title order={2} fw={500} mb="md">
            {user.name}
          </Title>
          <Group align="center" mb="md">
            <IconMail size={16} />
            <Text c="dimmed" size="sm">
              {user.email}
            </Text>
          </Group>
        </Stack>
        <Divider my="sm" />
        <Stack gap="md">
          <Title order={4} fw={500}>
            About Me
          </Title>
          <Text c="dimmed" size="sm">
            {/* Placeholder for future information */}
            This section can include a brief bio or description about the user.
          </Text>
          <Divider my="sm" />
          <Title order={4} fw={500}>
            Contact Information
          </Title>
          <Text c="dimmed" size="sm">
            {/* Placeholder for future information */}
            This section can include additional contact information like phone number, address, etc.
          </Text>
          <Divider my="sm" />
          <Title order={4} fw={500}>
            Additional Information
          </Title>
          <Text c="dimmed" size="sm">
            {/* Placeholder for future information */}
            This section can include any other relevant information about the user.
          </Text>
        </Stack>
        <Group align="center" mt="md">
          <Button variant="outline" color="blue">
            Edit Profile
          </Button>
        </Group>
      </Card>
    </Center>
  );
};

export default ProfilePage;
