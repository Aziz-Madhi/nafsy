require('@testing-library/jest-native/extend-expect');

// Mock react-native with proper module structure
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  return {
    ...reactNative,
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
    },
    Alert: {
      alert: jest.fn(),
    },
    Appearance: {
      getColorScheme: jest.fn(() => 'light'),
      addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
      removeChangeListener: jest.fn(),
    },
  };
});

// Create a shared mock MMKV instance
const createMockMMKV = () => {
  const storage = new Map();
  return {
    getString: jest.fn((key) => storage.get(key) || null),
    getNumber: jest.fn((key) => {
      const val = storage.get(key);
      return val ? parseFloat(val) : null;
    }),
    getBoolean: jest.fn((key) => {
      const val = storage.get(key);
      return val ? val === 'true' : null;
    }),
    set: jest.fn((key, value) => {
      storage.set(key, String(value));
    }),
    delete: jest.fn((key) => storage.delete(key)),
    clearAll: jest.fn(() => storage.clear()),
    getAllKeys: jest.fn(() => Array.from(storage.keys())),
    contains: jest.fn((key) => storage.has(key)),
  };
};

const mockMMKVInstance = createMockMMKV();

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => mockMMKVInstance),
}));

// Mock expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        convexUrl: 'test-convex-url',
      },
    },
  },
}));

jest.mock('@clerk/clerk-expo', () => ({
  useUser: jest.fn(() => ({ user: null })),
  useAuth: jest.fn(() => ({ isSignedIn: false })),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

// Mock react-native-i18n
jest.mock('react-native-i18n', () => ({
  t: jest.fn((key) => key),
  locale: 'en',
  fallbacks: true,
}));

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useAction: jest.fn(),
}));

// Silence the warning about act()
global.console = {
  ...console,
  warn: jest.fn(),
};
