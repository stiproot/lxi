import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, getUserById } from '../services/api';
import { StorageKeys, StorageService } from '../services/storage.service';

export interface User {
  avatarUrl: string | null | undefined;
  id: string;
  email: string;
  name: string;
  title: string | null; // Add title property
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  users: Record<string, User>; // Add this
  fetchUser: () => Promise<void>;
  getUser: (userId: string) => Promise<User>;
  fetchUsers: (userIds: string[]) => Promise<void>; // Add this
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [userCache, setUserCache] = useState<Record<string, User>>({});

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await getCurrentUser();
      setUser(user);
      StorageService.item(StorageKeys.LEXI_USR_DATA_KEY, user); // Cache user data
    } catch (err: any) {
      setError(new Error(err.message || 'An unknown error occurred'));
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUser = async (userId: string) => {
    try {
      // Check cache first
      if (userCache[userId]) {
        return userCache[userId];
      }

      const user = await getUserById(userId);
      // Update cache
      setUserCache((prev) => ({
        ...prev,
        [userId]: user,
      }));
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  };

  const fetchUsers = async (userIds: string[]) => {
    const newUsers: Record<string, User> = {};
    const fetchPromises = userIds
      .filter((id) => !userCache[id]) // Only fetch users not in cache
      .map(async (id) => {
        try {
          const user = await getUserById(id);
          newUsers[id] = user;
        } catch (error) {
          console.error(`Error fetching user ${id}:`, error);
        }
      });

    await Promise.all(fetchPromises);

    // Update cache with new users
    setUserCache((prev) => ({
      ...prev,
      ...newUsers,
    }));
  };

  useEffect(() => {
    const token = StorageService.accessToken();
    if (token) {
      const cachedUser = StorageService.item<User>(StorageKeys.LEXI_USR_DATA_KEY);
      if (cachedUser) {
        setUser(cachedUser);
      } else {
        fetchUser();
      }
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        users: userCache, // Add this
        fetchUser,
        getUser,
        fetchUsers, // Add this new method
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
