import React from 'react';
import { IconEdit, IconPin, IconPinnedOff, IconTrash } from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';
import { ActionIcon, Box, Group, NavLink, TextInput, Tooltip } from '@mantine/core';
import { Chat } from '@/types';
import { useUserContext } from '../../contexts/UserContext';
import classes from '../SideDrawer/SideDrawer.module.css';

interface MenuChatListProps {
  chats: Chat[];
  editingChatId: string | null;
  newChatName: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;
  handleInputKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleInputClick: (e: React.MouseEvent<HTMLInputElement>) => void;
  startEditing: (chatId: string, currentName: string) => void;
  openDeleteModal: (chatId: string) => void;
  handleChatSelect: (chatId: string) => void;
  togglePinChat: (chatId: string) => void;
}

const MenuChatList: React.FC<MenuChatListProps> = ({
  chats,
  editingChatId,
  newChatName,
  handleInputChange,
  handleInputBlur,
  handleInputKeyPress,
  handleInputClick,
  startEditing,
  openDeleteModal,
  handleChatSelect,
  togglePinChat,
}) => {
  const location = useLocation();
  const { user: currentUser } = useUserContext();

  return (
    <>
      {chats.map((chat) => (
        <Box key={chat.id} className={classes.chatItemContainer}>
          <NavLink
            label={
              <div className={classes.chatNameContainer}>
                {editingChatId === chat.id ? (
                  <TextInput
                    variant="filled"
                    value={newChatName}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyPress}
                    onClick={handleInputClick}
                    size="xs"
                    autoFocus
                    styles={{
                      input: {
                        fontSize: '0.875rem',
                        lineHeight: '1.25rem',
                        padding: '0',
                        paddingLeft: '7px',
                        height: '30px',
                        width: '146px',
                        outline: 'none',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                      },
                      wrapper: {
                        height: '30px',
                        border: 'none',
                        outline: 'none',
                        borderRadius: '12px',
                      },
                    }}
                  />
                ) : (
                  <span className={classes.chatName}>{chat.name}</span>
                )}
              </div>
            }
            rightSection={
              <Group gap={0} className={classes.iconContainer}>
                {chat.ownerId !== currentUser?.id ? (
                  <Tooltip label="Only the chat owner can edit">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      size="sm"
                      radius={6}
                      className={classes.editIcon}
                      disabled
                    >
                      <IconEdit size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    size="sm"
                    radius={6}
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(chat.id, chat.name);
                    }}
                    className={classes.editIcon}
                  >
                    <IconEdit size="1rem" />
                  </ActionIcon>
                )}

                {chat.ownerId !== currentUser?.id ? (
                  <Tooltip label="Only the chat owner can delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      radius={6}
                      className={classes.deleteIcon}
                      disabled
                    >
                      <IconTrash size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    radius={6}
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(chat.id);
                    }}
                    className={classes.deleteIcon}
                  >
                    <IconTrash size="1rem" />
                  </ActionIcon>
                )}

                <ActionIcon
                  variant="subtle"
                  color="yellow"
                  size="sm"
                  radius={6}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinChat(chat.id);
                  }}
                  className={classes.pinIcon}
                >
                  {chat.isPinned ? <IconPinnedOff size="1rem" /> : <IconPin size="1rem" />}
                </ActionIcon>
              </Group>
            }
            className={`${classes.chatItem} ${
              location.pathname === `/chat/${chat.id}` ? classes.activeChatItem : ''
            }`}
            onClick={() => handleChatSelect(chat.id)}
          />
        </Box>
      ))}
    </>
  );
};

export default MenuChatList;
