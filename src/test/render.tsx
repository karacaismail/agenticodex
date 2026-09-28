import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { cssResolver, theme } from '@/theme';

export function renderUI(ui: ReactElement, opts: { route?: string; path?: string } = {}) {
  const { route = '/', path = '*' } = opts;
  return render(
    <MantineProvider theme={theme} defaultColorScheme="dark" cssVariablesResolver={cssResolver}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}
