import { useEffect, useState } from 'react';
import { IconUserPlus } from '@tabler/icons-react'; // Remove IconUserMinus
import {
  ActionIcon,
  Avatar,
  Badge,
  CloseButton,
  Group,
  HoverCard,
  Indicator,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Tooltip, // Add this
} from '@mantine/core';
import { useChatContext } from '@/contexts/ChatContext';
import { useUserContext } from '@/contexts/UserContext';
import { UserSearch } from '../UserSearch/UserSearch';
import classes from './ParticipantManager.module.css';

export const ParticipantManager = ({ chatId }: { chatId: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { chats, participantStatuses, handleParticipantUpdate } = useChatContext();
  const { user: currentUser, users, fetchUsers } = useUserContext();

  const chat = chats.find((c) => c.id === chatId);
  const isOwner = chat?.ownerId === currentUser?.id;

  // Add this effect to fetch participants data
  useEffect(() => {
    if (chat?.participantIds.length) {
      fetchUsers(chat.participantIds);
    }
  }, [chat?.participantIds, fetchUsers]);

  const handleAddParticipant = async (userId: string) => {
    await handleParticipantUpdate(chatId, userId, 'add');
    setIsModalOpen(false);
  };

  return (
    <>
      <Group gap={2} className={classes.container}>
        {isOwner && (
          <Tooltip withArrow label="View and add participants" position="left">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              radius="md"
              onClick={() => setIsModalOpen(true)}
            >
              <IconUserPlus size={14} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        )}
        <Avatar.Group spacing="sm">
          {chat?.participantIds.slice(0, 3).map((id) => (
            <HoverCard
              key={`avatar-${id}`}
              shadow="md"
              withArrow
              radius="lg"
              openDelay={200}
              closeDelay={100}
            >
              <HoverCard.Target>
                <Indicator
                  inline
                  size={8}
                  offset={4}
                  position="top-end"
                  color={participantStatuses[id] === 'online' ? 'green' : 'gray'}
                  withBorder
                  processing={participantStatuses[id] === 'online'}
                  className={classes.participantIndicator}
                >
                  <Avatar
                    size={32} // Slightly larger avatars
                    radius="xl"
                    name={users[id]?.name}
                    src={users[id]?.avatarUrl}
                    color={chat.ownerId === id ? 'blue' : 'gray'}
                    className={classes.participantAvatar}
                  />
                </Indicator>
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <Stack gap="sm" className={classes.hoverCardContent}>
                  <Group wrap="nowrap" gap="md">
                    <Avatar
                      size="lg"
                      radius="xl"
                      name={users[id]?.name}
                      src={users[id]?.avatarUrl}
                      color={chat.ownerId === id ? 'blue' : 'gray'}
                      className={classes.hoverCardAvatar}
                    />
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={600} className={classes.userName}>
                        {users[id]?.name}
                      </Text>
                      {users[id]?.title && (
                        <Text size="sm" c="dimmed" className={classes.userTitle}>
                          {users[id]?.title}
                        </Text>
                      )}
                      <Group gap={6} mt={4}>
                        {chat.ownerId === id && (
                          <Badge size="xs" variant="light" color="blue" radius="sm">
                            Owner
                          </Badge>
                        )}
                        <Badge
                          size="xs"
                          variant={participantStatuses[id] === 'online' ? 'dot' : 'light'}
                          color={participantStatuses[id] === 'online' ? 'green' : 'gray'}
                          className={classes.statusBadge}
                        >
                          {participantStatuses[id] === 'online' ? 'Active now' : 'Inactive'}
                        </Badge>
                      </Group>
                    </div>
                  </Group>
                </Stack>
              </HoverCard.Dropdown>
            </HoverCard>
          ))}

          {(chat?.participantIds ?? []).length > 3 && (
            <HoverCard width={280} shadow="md" withArrow>
              <HoverCard.Target>
                <Avatar size={28} radius="xl" className={classes.moreAvatarBadge}>
                  +{(chat?.participantIds?.length ?? 0) - 3}
                </Avatar>
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <Stack gap="xs">
                  {chat?.participantIds.slice(3).map((id) => (
                    <Group key={id} wrap="nowrap" p={4}>
                      <Indicator
                        inline
                        size={8}
                        offset={2}
                        position="bottom-end"
                        color={participantStatuses[id] === 'online' ? 'green' : 'gray'}
                        withBorder
                        processing={participantStatuses[id] === 'online'}
                      >
                        <Avatar
                          size="sm"
                          radius="xl"
                          name={users[id]?.name}
                          src={users[id]?.avatarUrl}
                          color={chat.ownerId === id ? 'blue' : 'gray'}
                        />
                      </Indicator>
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                          {users[id]?.name}
                        </Text>
                        <Text
                          size="xs"
                          c={participantStatuses[id] === 'online' ? 'green' : 'dimmed'}
                        >
                          {participantStatuses[id] === 'online' ? 'Active now' : 'Offline'}
                        </Text>
                      </div>
                    </Group>
                  ))}
                </Stack>
              </HoverCard.Dropdown>
            </HoverCard>
          )}
        </Avatar.Group>
      </Group>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        radius="md"
        padding={0}
        className={classes.membersModal}
        withCloseButton
        title={
          <Group justify="space-between" align="center">
            <Text size="lg" fw={600}>
              Chat Members
            </Text>
            <Badge size="sm" variant="light" radius="xl" mr={8}>
              {chat?.participantIds.length}{' '}
              {chat?.participantIds.length === 1 ? 'person' : 'people'}
            </Badge>
          </Group>
        }
      >
        <div className={classes.modalInner}>
          {isOwner && (
            <div className={classes.searchSection}>
              <UserSearch onSelect={handleAddParticipant} excludeIds={chat?.participantIds} />
            </div>
          )}

          <ScrollArea className={classes.membersList} scrollbarSize={8} px="sm" py="xs">
            {/* Online Members */}
            {(chat?.participantIds ?? []).filter((id) => participantStatuses[id] === 'online')
              .length > 0 && (
              <div className={classes.membersGroup}>
                <Text className={classes.membersGroupLabel}>
                  Online •{' '}
                  {chat?.participantIds.filter((id) => participantStatuses[id] === 'online').length}
                </Text>
                {chat?.participantIds
                  .filter((id) => participantStatuses[id] === 'online')
                  .map((id) => (
                    <div key={`online-${id}`} className={classes.memberItem}>
                      <Group wrap="nowrap" gap="sm">
                        <div className={classes.avatarWrapper}>
                          <Avatar
                            src={users[id]?.avatarUrl}
                            name={users[id]?.name}
                            radius="xl"
                            size={36}
                            className={classes.memberAvatar}
                          />
                          <div className={`${classes.statusDot} ${classes.online}`} />
                        </div>
                        <div className={classes.memberDetails}>
                          <Group gap={6} wrap="nowrap">
                            <Text size="sm" fw={500} className={classes.memberName}>
                              {users[id]?.name}
                            </Text>
                            {chat.ownerId === id && (
                              <Badge size="xs" radius="sm" className={classes.ownerBadge}>
                                Owner
                              </Badge>
                            )}
                          </Group>
                          {users[id]?.title && (
                            <Text size="xs" c="dimmed" className={classes.memberTitle}>
                              {users[id]?.title}
                            </Text>
                          )}
                        </div>
                      </Group>
                      {isOwner && id !== currentUser?.id && (
                        <Tooltip label="Remove" withArrow position="left">
                          <CloseButton
                            size="md"
                            onClick={() => handleParticipantUpdate(chatId, id, 'remove')}
                            className={classes.removeButton}
                            variant="transparent"
                            color="red"
                            aria-label="Remove member"
                          />
                        </Tooltip>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Offline Members */}
            {(chat?.participantIds ?? []).filter((id) => participantStatuses[id] !== 'online')
              .length > 0 && (
              <div className={classes.membersGroup}>
                <Text className={classes.membersGroupLabel}>
                  Offline •{' '}
                  {chat?.participantIds.filter((id) => participantStatuses[id] !== 'online').length}
                </Text>
                {chat?.participantIds
                  .filter((id) => participantStatuses[id] !== 'online')
                  .map((id) => (
                    <div key={`offline-${id}`} className={classes.memberItem}>
                      <Group wrap="nowrap" gap="sm">
                        <div className={classes.avatarWrapper}>
                          <Avatar
                            src={users[id]?.avatarUrl}
                            name={users[id]?.name}
                            radius="xl"
                            size={36}
                            className={classes.memberAvatar}
                          />
                          <div className={`${classes.statusDot} ${classes.offline}`} />
                        </div>
                        <div className={classes.memberDetails}>
                          <Group gap={6} wrap="nowrap">
                            <Text size="sm" fw={500} className={classes.memberName}>
                              {users[id]?.name}
                            </Text>
                            {chat.ownerId === id && (
                              <Badge size="xs" radius="sm" className={classes.ownerBadge}>
                                Owner
                              </Badge>
                            )}
                          </Group>
                          {users[id]?.title && (
                            <Text size="xs" c="dimmed" className={classes.memberTitle}>
                              {users[id]?.title}
                            </Text>
                          )}
                        </div>
                      </Group>
                      {isOwner && id !== currentUser?.id && (
                        <Tooltip label="Remove" withArrow position="bottom">
                          <CloseButton
                            size="md"
                            onClick={() => handleParticipantUpdate(chatId, id, 'remove')}
                            className={classes.removeButton}
                            variant="subtle"
                            color="red"
                            aria-label="Remove member"
                          />
                        </Tooltip>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </Modal>
    </>
  );
};
