import { renderHook, act } from '@testing-library/react-native';
import {
  useAppStore,
  useTheme,
  useCurrentTheme,
  useLanguage,
  useActiveTab,
} from '~/store/useAppStore';
import { MMKV } from 'react-native-mmkv';

// Mock MMKV
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
}));

// Mock react-native Appearance
jest.mock('react-native', () => ({
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

describe('useAppStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useAppStore.getState().resetStore();
    jest.clearAllMocks();
  });

  describe('Theme Management', () => {
    it('should initialize with system theme', () => {
      const { result } = renderHook(() => ({
        theme: useTheme(),
        currentTheme: useCurrentTheme(),
      }));

      expect(result.current.theme).toBe('system');
      expect(result.current.currentTheme).toBe('light');
    });

    it('should toggle between light and dark themes', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.currentTheme).toBe('dark');
      expect(result.current.isSystemTheme).toBe(false);

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.settings.theme).toBe('light');
      expect(result.current.currentTheme).toBe('light');
    });

    it('should set specific theme', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.currentTheme).toBe('dark');
      expect(result.current.isSystemTheme).toBe(false);
    });

    it('should handle system theme changes', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.isSystemTheme).toBe(true);

      // Mock system theme change
      require('react-native').Appearance.getColorScheme.mockReturnValue('dark');

      act(() => {
        result.current.applySystemTheme();
      });

      expect(result.current.currentTheme).toBe('dark');
    });
  });

  describe('Language Management', () => {
    it('should initialize with English', () => {
      const { result } = renderHook(() => useLanguage());
      expect(result.current).toBe('en');
    });

    it('should update language settings', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateSettings({ language: 'ar' });
      });

      expect(result.current.settings.language).toBe('ar');
    });

    it('should handle language updates with i18n integration', async () => {
      // Mock i18n module
      const mockSetLocale = jest.fn();
      jest.doMock('~/lib/i18n', () => ({
        setLocale: mockSetLocale,
      }));

      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateSettings({ language: 'ar' });
      });

      // Wait for async i18n update
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.settings.language).toBe('ar');
    });
  });

  describe('Active Tab Management', () => {
    it('should initialize with mood tab', () => {
      const { result } = renderHook(() => useActiveTab());
      expect(result.current).toBe('mood');
    });

    it('should update active tab', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setActiveTab('chat');
      });

      expect(result.current.activeTab).toBe('chat');
    });
  });

  describe('Store Persistence', () => {
    it('should have persist methods available', () => {
      const { result } = renderHook(() => useAppStore());

      expect(typeof result.current.persist.hasHydrated).toBe('function');
      expect(typeof result.current.persist.rehydrate).toBe('function');
      expect(typeof result.current.persist.clearStorage).toBe('function');
    });

    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useAppStore());

      // Modify state
      act(() => {
        result.current.setTheme('dark');
        result.current.setActiveTab('exercises');
        result.current.updateSettings({ language: 'ar' });
      });

      // Reset store
      act(() => {
        result.current.resetStore();
      });

      expect(result.current.settings.theme).toBe('system');
      expect(result.current.activeTab).toBe('mood');
      expect(result.current.settings.language).toBe('en');
    });
  });

  describe('Loading States', () => {
    it('should manage loading state', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
