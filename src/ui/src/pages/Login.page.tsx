import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Group, Text, useMantineColorScheme } from '@mantine/core';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import AppLogo from '../assets/app-icon.svg?react';
import LxiPortrait from '../assets/lxi-login-image.svg?react';
import Logo from '../assets/lxi-name-logo.svg?react';
import OktaLogo from '../assets/okta-logo.svg?react';
import { AuthService } from '../services/auth/auth.service';
import styles from './Login.page.module.css';

// Ensure SparkleEffect uses non-conflicting class names
const SparkleEffectComponent: React.FC = () => (
  <div className={styles.sparkleContainer}>
    {Array.from({ length: 50 }).map((_, i) => (
      <div
        key={i}
        className={styles.sparkle}
        style={
          {
            '--delay': `${Math.random() * 8}s`,
            '--size': `${Math.random() * 4 + 2}px`,
            '--speed': `${Math.random() * 6 + 4}s`,
            '--start-x': `${Math.random() * 100}%`,
            '--start-y': `${Math.random() * 100}%`,
            '--random-x': Math.random() * 2 - 1,
            '--random-y': Math.random() * 2 - 1,
          } as React.CSSProperties
        }
      />
    ))}
  </div>
);

const SparkleEffect = React.memo(SparkleEffectComponent);

const authService = new AuthService();

const LoginPage: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    setIsLoading(true);
    try {
      await authService.signIn();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper} data-theme={isDark ? 'dark' : 'light'}>
      <div className={styles.magicBg}>
        <div className={styles.glowOrb} />
        <div className={styles.glowOrb2} />
        <div className={styles.glowOrb3} />
        <SparkleEffect />
      </div>

      <div className={styles.themeToggle}>
        <ThemeToggle />
      </div>

      <main className={styles.mainContainer}>
        <div className={styles.content}>
          <div className={styles.leftSection}>
            <motion.div
              className={styles.welcomeText}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Logo className={styles.logo} />
              <Text component="span" className={styles.gradientText}>
                Your Intelligent Codebase Navigator
              </Text>
              <Text className={styles.subtitle}>
                Search code, chat with teammates, get instant answers
              </Text>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Button size="xl" onClick={login} className={styles.loginButton} loading={isLoading}>
                <Group align="center" justify="center" gap="xs">
                  {isLoading ? 'Connecting...' : 'Connect with'}
                  {!isLoading && <OktaLogo className={styles.oktaLogo} />}
                </Group>
              </Button>
            </motion.div>
          </div>

          <motion.div
            className={styles.rightSection}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className={styles.imageWrapper}>
              <div className={styles.magicRings}>
                <div className={styles.ring} />
                <div className={styles.ring} />
                <div className={styles.ring} />
              </div>
              <LxiPortrait className={styles.portrait} />
            </div>
          </motion.div>
        </div>
      </main>

      <footer className={styles.footer}>
        <AppLogo className={styles.footerLogo} />
      </footer>
    </div>
  );
};

export default LoginPage;
