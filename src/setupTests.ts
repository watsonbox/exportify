// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock TextEncoder/TextDecoder for tests
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

// Mock Web Crypto API for tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      // Fill with deterministic values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i % 256;
      }
      return arr;
    },
    subtle: {
      digest: async (algorithm: string, data: ArrayBuffer) => {
        // Return a mock hash
        return new ArrayBuffer(32);
      }
    }
  }
});
