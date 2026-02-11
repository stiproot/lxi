// src/components/NoChatHistory/NoChatHistory.tsx
import React, { useState } from 'react';
import { IconAlertTriangle, IconBulb, IconRocket } from '@tabler/icons-react';
import {
  Center,
  Container,
  Group,
  rem,
  SegmentedControl,
  Text,
  useMantineColorScheme,
} from '@mantine/core';
import Logo from '../../assets/lxi-name-logo.svg?react';
import FeatureCard from '../FeatureCard/FeatureCard';
import classes from './NoChatHistory.module.css';

const NoChatHistory: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [value, setValue] = useState('capabilities');

  const examples = [
    '"What framework is used in this repository?"',
    '"How do I implement feature X in this codebase?"',
    '"Explain the purpose of this function."',
  ];

  const capabilities = [
    'Displays code info in a simple format.',
    'Queries codebase using natural language.',
    'Provides code based implementations.',
  ];

  const limitations = [
    'No commit/branch/pull request info.',
    'Limited to single codebase queries.',
  ];

  const iconProps = { style: { width: rem(20), height: rem(20) } };

  return (
    <Container className={classes.container} data-theme={isDark ? 'dark' : 'light'}>
      <Logo className={classes.logo} aria-label="lxi-name-logo" />
      <Text className={classes.text} size="md">
        Hi there! I'm Lxi, your collaborative guide to exploring Git repositories.
      </Text>
      <Text className={classes.text} size="md" style={{ marginBottom: '8px' }}>
        <Text
          variant="gradient"
          component="span"
          fw={400}
          fz={30}
          gradient={{ from: 'blue', to: 'grape', deg: 166 }}
        >
          Select a repository{' '}
        </Text>{' '}
        and discuss topics/implementations with teammates.
      </Text>
      <SegmentedControl
        className={classes.segmentedControl}
        value={value}
        radius="xl"
        size="lg"
        withItemsBorders={false}
        fullWidth
        onChange={setValue}
        styles={(theme) => ({
          indicator: {
            backgroundImage: isDark
              ? 'linear-gradient(166deg, var(--mantine-color-blue-filled), var(--mantine-color-grape-filled))'
              : 'linear-gradient(166deg, var(--mantine-color-blue-2), var(--mantine-color-grape-3))',
          },
          label: {
            fontSize: '1rem', // Default font size
            [`@media (maxWidth: ${theme.breakpoints.md}px)`]: {
              fontSize: '0.875rem', // Font size for medium screens
            },
            [`@media (maxWidth: ${theme.breakpoints.sm}px)`]: {
              fontSize: '0.75rem', // Font size for small screens
            },
          },
          control: {
            padding: '0.1rem', // Default padding
            [`@media (maxWidth: ${theme.breakpoints.md}px)`]: {
              padding: '0.5rem', // Padding for medium screens
            },
            [`@media (maxWidth: ${theme.breakpoints.sm}px)`]: {
              padding: '0.25rem', // Padding for small screens
            },
          },
        })}
        data={[
          {
            value: 'examples',
            label: (
              <Center>
                <Group>
                  <IconBulb {...iconProps} />
                  <span>Examples</span>
                </Group>
              </Center>
            ),
          },
          {
            value: 'capabilities',
            label: (
              <Center>
                <Group>
                  <IconRocket {...iconProps} />
                  <span>Capabilities</span>
                </Group>
              </Center>
            ),
          },
          {
            value: 'limitations',
            label: (
              <Center>
                <Group>
                  <IconAlertTriangle {...iconProps} />
                  <span>Limitations</span>
                </Group>
              </Center>
            ),
          },
        ]}
      />
      <div className={classes.content}>
        {value === 'examples' && <FeatureCard content={examples} />}
        {value === 'capabilities' && <FeatureCard content={capabilities} />}
        {value === 'limitations' && <FeatureCard content={limitations} />}
      </div>
    </Container>
  );
};

export default NoChatHistory;
