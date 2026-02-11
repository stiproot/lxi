// src/components/FeatureCard/FeatureCard.tsx
import React from 'react';
import { Group, Paper, Text, useMantineColorScheme } from '@mantine/core';
import classes from './FeatureCard.module.css';

interface CardProps {
  content: string[];
}

const FeatureCard: React.FC<CardProps> = ({ content }) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Group className={classes.card} data-theme={isDark ? 'dark' : 'light'}>
      {content.map((item, index) => (
        <Paper className={classes.paper} shadow="none" p="xs" px="md" radius="xl" key={index}>
          <Text size="xs" className={classes.text}>
            {item}
          </Text>
        </Paper>
      ))}
    </Group>
  );
};

export default FeatureCard;
