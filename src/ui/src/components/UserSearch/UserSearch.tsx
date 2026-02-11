import { useCallback, useEffect, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import {
  Avatar,
  Loader,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  UnstyledButton, // Add this
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { searchUsers } from '@/services/api';
import { User } from '@/types';
import classes from './UserSearch.module.css';

interface UserSearchProps {
  onSelect: (userId: string) => void;
  excludeIds?: string[];
}

export const UserSearch = ({ onSelect, excludeIds = [] }: UserSearchProps) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await searchUsers(query);
        setSearchResults(
          results
            .filter((user) => !excludeIds.includes(user.id))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (err) {
        console.error('Error searching users:', err);
        setError('Failed to search users');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [excludeIds]
  );

  // Effect to trigger search when debounced value changes
  useEffect(() => {
    handleSearch(debouncedSearch);
  }, [debouncedSearch, handleSearch]);

  return (
    <Stack gap="xs" className={classes.searchContainer}>
      <TextInput
        placeholder="Type a name to add someone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftSection={<IconSearch size={16} stroke={1.5} />}
        rightSection={loading && <Loader size="xs" className={classes.loader} />}
        className={classes.searchInput}
      />

      {searchResults.length > 0 ? (
        <ScrollArea scrollbarSize={6} className={classes.searchResults}>
          {searchResults.map((user) => (
            <UnstyledButton
              key={user.id}
              className={classes.searchResult}
              onClick={() => onSelect(user.id)}
            >
              <div className={classes.userInfo}>
                <Avatar
                  size={36}
                  radius="xl"
                  name={user.name}
                  src={user.avatarUrl}
                  className={classes.userAvatar}
                />
                <div className={classes.userDetails}>
                  <Text className={classes.userName}>{user.name}</Text>
                  {user.title && <Text className={classes.userTitle}>{user.title}</Text>}
                </div>
              </div>
            </UnstyledButton>
          ))}
        </ScrollArea>
      ) : (
        search && !loading && <Text className={classes.noResults}>No matching users found</Text>
      )}
    </Stack>
  );
};
