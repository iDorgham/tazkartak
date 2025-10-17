import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock crypto for webhook signature generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr: any) => arr.map(() => Math.floor(Math.random() * 256))),
    subtle: {
      digest: vi.fn(),
    },
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
    readText: vi.fn(),
  },
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://test-app.com',
    origin: 'https://test-app.com',
    protocol: 'https:',
    host: 'test-app.com',
    hostname: 'test-app.com',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
});

// Mock postMessage
window.postMessage = vi.fn();

// Mock addEventListener and removeEventListener
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

window.addEventListener = vi.fn().mockImplementation((event, callback) => {
  if (typeof originalAddEventListener === 'function') {
    originalAddEventListener.call(window, event, callback);
  }
});

window.removeEventListener = vi.fn().mockImplementation((event, callback) => {
  if (typeof originalRemoveEventListener === 'function') {
    originalRemoveEventListener.call(window, event, callback);
  }
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
