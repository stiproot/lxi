import { Text } from '@mantine/core';
import styles from './DateSeparator.module.css';

interface DateSeparatorProps {
  date: Date;
}

const DateSeparator = ({ date }: DateSeparatorProps) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let formattedDate;
  if (date.toDateString() === today.toDateString()) {
    formattedDate = 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    formattedDate = 'Yesterday';
  } else {
    formattedDate = date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <div className={styles.dateSeparator}>
      <Text size="xs" c="dimmed">
        {formattedDate}
      </Text>
      {/* ...existing code... */}
    </div>
  );
};

export default DateSeparator;
