// src/GradientBackground.tsx
import React from 'react';
import { useMantineColorScheme } from '@mantine/core';

const GradientBackground: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const gradientStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1, // Ensure the overlay is behind other content
    backgroundColor: isDark ? '#1a1b1e' : '#f0f4f8', // Dark background for dark mode, light background for light mode
    backgroundImage: isDark
      ? `
        radial-gradient(at 20% 80%, hsla(0, 0%, 30%, 0.3) 0px, transparent 50%),
        radial-gradient(at 60% 40%, hsla(0, 0%, 25%, 0.3) 0px, transparent 50%), 
        radial-gradient(at 80% 90%, hsla(0, 0%, 20%, 0.3) 0px, transparent 50%),
        radial-gradient(at 30% 20%, hsla(0, 0%, 15%, 0.3) 0px, transparent 50%) 
      `
      : `
        radial-gradient(at 20% 80%, hsla(210, 50%, 90%, 0.3) 0px, transparent 50%),
        radial-gradient(at 60% 40%, hsla(220, 50%, 85%, 0.3) 0px, transparent 50%), 
        radial-gradient(at 80% 90%, hsla(230, 50%, 80%, 0.3) 0px, transparent 50%),
        radial-gradient(at 30% 20%, hsla(240, 50%, 75%, 0.3) 0px, transparent 50%) 
      `,
  };

  return <div style={gradientStyle} />;
};

export default GradientBackground;
