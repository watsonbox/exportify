import '@testing-library/jest-dom/vitest';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
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

// jest-dom 6 augments @vitest/expect, which Vitest 5 merged into vitest
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> extends TestingLibraryMatchers<any, R> {}
}
