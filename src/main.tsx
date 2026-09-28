import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { RouterProvider } from 'react-router-dom';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
import '@mantine/charts/styles.css';
import './styles/global.css';
import { cssResolver, theme } from './theme';
import { router } from './router';

const colorSchemeManager = localStorageColorSchemeManager({ key: 'genui-atlas-renk' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark" colorSchemeManager={colorSchemeManager} cssVariablesResolver={cssResolver}>
      <Notifications position="bottom-right" />
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>,
);
