import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';

// jsdom can't navigate, so tests assert on redirectTo calls instead
vi.mock('./navigation');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterAll(() => server.close());
