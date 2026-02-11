// src/components/MessageListSkeletons/MessageListSkeletons.tsx
import React from 'react';
import { Skeleton } from '@mantine/core';
import styles from './MessageListSkeletons.module.css';

const MessageListSkeletons: React.FC = () => {
  return (
    <div className={styles.skeletonContainer}>
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className={`${styles.skeletonMessage} ${index % 2 === 0 ? styles.skeletonUser : styles.skeletonAI}`}
        >
          <Skeleton height={30} circle mb="sm" className={styles.skeletonAvatar} />
          <div className={styles.skeletonText}>
            <Skeleton height={8} radius="xl" />
            <Skeleton height={8} mt={6} radius="xl" />
            <Skeleton height={8} mt={6} width="70%" radius="xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageListSkeletons;
