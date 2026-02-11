import { useEffect, useState } from 'react';
import { IconMoon, IconMoonFilled, IconSun, IconSunFilled } from '@tabler/icons-react';
import { FloatingIndicator, Group, Text, UnstyledButton } from '@mantine/core';
import classes from './ThemeSelector.module.css';

const data = [
  { label: 'Light', icon: IconSun, filledIcon: IconSunFilled },
  { label: 'Dark', icon: IconMoon, filledIcon: IconMoonFilled },
];

export function ThemeSelector() {
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
  const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});
  const [active, setActive] = useState(0);
  const [delayedActive, setDelayedActive] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDelayedActive(active);
    }, 30); // Adjust the delay as needed

    return () => clearTimeout(timeout);
  }, [active]);

  const setControlRef = (index: number) => (node: HTMLButtonElement) => {
    controlsRefs[index] = node;
    setControlsRefs(controlsRefs);
  };

  const controls = data.map((item, index) => {
    const IconComponent = delayedActive === index ? item.filledIcon : item.icon;
    return (
      <UnstyledButton
        key={item.label}
        className={classes.control}
        ref={setControlRef(index)}
        onClick={() => setActive(index)}
        mod={{ active: active === index }}
      >
        <Group gap="xs" className={classes.controlLabel}>
          <IconComponent size={16} />
          <Text>{item.label}</Text>
        </Group>
      </UnstyledButton>
    );
  });

  return (
    <div className={classes.root} ref={setRootRef}>
      {controls}

      <FloatingIndicator
        target={controlsRefs[active]}
        parent={rootRef}
        className={classes.indicator}
      />
    </div>
  );
}
