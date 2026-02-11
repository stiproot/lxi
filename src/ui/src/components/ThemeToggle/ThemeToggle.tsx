import { IconMoon, IconSun } from '@tabler/icons-react';
import cx from 'clsx';
import { ActionIcon, Group, useMantineColorScheme } from '@mantine/core';
import classes from './ThemeToggle.module.css';

const ThemeToggle: React.FC = () => {
  const { toggleColorScheme } = useMantineColorScheme();
  // const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  return (
    <Group justify="center">
      <ActionIcon onClick={() => toggleColorScheme()} variant="default" size={30} radius="md">
        <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
        <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
      </ActionIcon>
    </Group>
  );
};

export default ThemeToggle;
