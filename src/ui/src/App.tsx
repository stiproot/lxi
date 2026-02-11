// src/App.tsx
import '@mantine/core/styles.css';
import '@mantine/spotlight/styles.css';
import '@mantine/notifications/styles.css';

import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { Security } from '@okta/okta-react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import GradientBackground from './components/GradientBackground/GradientBackground';
import { ChatProvider } from './contexts/ChatContext';
import { RepositoryProvider } from './contexts/RepositoryContext';
import { UserProvider } from './contexts/UserContext';
import { Router } from './Router';
import { OktaAuthService } from './services/auth/oktaAuth.service';
import { theme } from './theme';

const oktaAuthService = new OktaAuthService();

function restoreOriginalUri(_oktaAuth: OktaAuth, originalUri: string) {
  window.location.replace(toRelativeUrl(originalUri || '/', window.location.origin));
}

export default function App() {
  return (
    <Security oktaAuth={oktaAuthService._authClient} restoreOriginalUri={restoreOriginalUri}>
      <MantineProvider theme={theme}>
        <UserProvider>
          <ChatProvider>
            <RepositoryProvider>
              <Notifications />
              <GradientBackground />
              <Router />
            </RepositoryProvider>
          </ChatProvider>
        </UserProvider>
      </MantineProvider>
    </Security>
  );
}
