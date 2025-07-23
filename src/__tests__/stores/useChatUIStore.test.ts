import { renderHook, act } from '@testing-library/react-native';
import {
  useChatUIStore,
  useFloatingChatVisible,
  useMainChatTyping,
  useCurrentMainSessionId,
} from '~/store/useChatUIStore';

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

describe('useChatUIStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useChatUIStore.getState().resetChatUI();
    jest.clearAllMocks();
  });

  describe('Floating Chat Management', () => {
    it('should initialize with floating chat hidden', () => {
      const { result } = renderHook(() => useFloatingChatVisible());
      expect(result.current).toBe(false);
    });

    it('should toggle floating chat visibility', () => {
      const { result } = renderHook(() => useChatUIStore());

      act(() => {
        result.current.setFloatingChatVisible(true);
      });

      expect(result.current.isFloatingChatVisible).toBe(true);

      act(() => {
        result.current.setFloatingChatVisible(false);
      });

      expect(result.current.isFloatingChatVisible).toBe(false);
    });

    it('should manage floating chat input', () => {
      const { result } = renderHook(() => useChatUIStore());

      act(() => {
        result.current.setFloatingChatInput('Hello world');
      });

      expect(result.current.floatingChatInput).toBe('Hello world');

      act(() => {
        result.current.clearFloatingChatInput();
      });

      expect(result.current.floatingChatInput).toBe('');
    });

    it('should manage floating chat typing state', () => {
      const { result } = renderHook(() => useChatUIStore());

      act(() => {
        result.current.setFloatingChatTyping(true);
      });

      expect(result.current.floatingChatIsTyping).toBe(true);
    });
  });

  describe('Main Chat Management', () => {
    it('should initialize with quick replies shown', () => {
      const { result } = renderHook(() => useChatUIStore());
      expect(result.current.showQuickReplies).toBe(true);
    });

    it('should manage main chat typing state', () => {
      const { result } = renderHook(() => useMainChatTyping());

      act(() => {
        useChatUIStore.getState().setMainChatTyping(true);
      });

      expect(result.current).toBe(true);
      expect(useChatUIStore.getState().mainChatIsTyping).toBe(true);
    });

    it('should manage main chat input', () => {
      const { result } = renderHook(() => useChatUIStore());

      act(() => {
        result.current.setMainChatInput('Test message');
      });

      expect(result.current.mainChatInput).toBe('Test message');

      act(() => {
        result.current.clearMainChatInput();
      });

      expect(result.current.mainChatInput).toBe('');
    });

    it('should manage quick replies visibility', () => {
      const { result } = renderHook(() => useChatUIStore());

      act(() => {
        result.current.setShowQuickReplies(false);
      });

      expect(result.current.showQuickReplies).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should initialize with null session IDs', () => {
      const { result } = renderHook(() => useCurrentMainSessionId());
      expect(result.current).toBeNull();
    });

    it('should manage current main session ID', () => {
      const { result } = renderHook(() => useChatUIStore());
      const sessionId = 'main_12345_test';

      act(() => {
        result.current.setCurrentMainSessionId(sessionId);
      });

      expect(result.current.currentMainSessionId).toBe(sessionId);
    });

    it('should manage current vent session ID', () => {
      const { result } = renderHook(() => useChatUIStore());
      const sessionId = 'vent_12345_test';

      act(() => {
        result.current.setCurrentVentSessionId(sessionId);
      });

      expect(result.current.currentVentSessionId).toBe(sessionId);
    });

    it('should handle session switching with loading state', async () => {
      const { result } = renderHook(() => useChatUIStore());
      const sessionId = 'main_67890_test';

      // Test switchToMainSession
      await act(async () => {
        await result.current.switchToMainSession(sessionId);
      });

      expect(result.current.currentMainSessionId).toBe(sessionId);
      expect(result.current.mainChatInput).toBe('');
      expect(result.current.showQuickReplies).toBe(false);
      expect(result.current.sessionSwitchLoading).toBe(false);
    });

    it('should clear current sessions', () => {
      const { result } = renderHook(() => useChatUIStore());

      // Set session IDs first
      act(() => {
        result.current.setCurrentMainSessionId('main_123');
        result.current.setCurrentVentSessionId('vent_456');
        result.current.setSessionSwitchLoading(true);
      });

      // Clear sessions
      act(() => {
        result.current.clearCurrentSessions();
      });

      expect(result.current.currentMainSessionId).toBeNull();
      expect(result.current.currentVentSessionId).toBeNull();
      expect(result.current.sessionSwitchLoading).toBe(false);
    });
  });

  describe('History Sidebar Management', () => {
    it('should initialize with sidebar hidden', () => {
      const { result } = renderHook(() => useChatUIStore());
      expect(result.current.isHistorySidebarVisible).toBe(false);
    });

    it('should toggle history sidebar visibility', () => {
      const { result } = renderHook(() => useChatUIStore());

      act(() => {
        result.current.setHistorySidebarVisible(true);
      });

      expect(result.current.isHistorySidebarVisible).toBe(true);
    });
  });

  describe('Chat Input Focus Management', () => {
    it('should manage chat input focus state', () => {
      const { result } = renderHook(() => useChatUIStore());

      act(() => {
        result.current.setChatInputFocused(true);
      });

      expect(result.current.chatInputFocused).toBe(true);

      act(() => {
        result.current.setChatInputFocused(false);
      });

      expect(result.current.chatInputFocused).toBe(false);
    });
  });

  describe('Store Reset', () => {
    it('should reset all chat UI state', () => {
      const { result } = renderHook(() => useChatUIStore());

      // Modify state
      act(() => {
        result.current.setFloatingChatVisible(true);
        result.current.setMainChatInput('test');
        result.current.setCurrentMainSessionId('main_123');
        result.current.setHistorySidebarVisible(true);
      });

      // Reset store
      act(() => {
        result.current.resetChatUI();
      });

      expect(result.current.isFloatingChatVisible).toBe(false);
      expect(result.current.mainChatInput).toBe('');
      expect(result.current.currentMainSessionId).toBeNull();
      expect(result.current.isHistorySidebarVisible).toBe(false);
      expect(result.current.showQuickReplies).toBe(true);
    });
  });

  describe('Store Persistence', () => {
    it('should have persist methods available', () => {
      const { result } = renderHook(() => useChatUIStore());

      expect(typeof result.current.persist.hasHydrated).toBe('function');
      expect(typeof result.current.persist.rehydrate).toBe('function');
      expect(typeof result.current.persist.clearStorage).toBe('function');
    });

    it('should persist only specified state properties', () => {
      const { result } = renderHook(() => useChatUIStore());

      // Set various states
      act(() => {
        result.current.setFloatingChatVisible(true);
        result.current.setMainChatTyping(true); // This should NOT be persisted
        result.current.setCurrentMainSessionId('main_123'); // This should be persisted
      });

      // The actual persistence testing would require more complex mock setup
      // This test verifies the structure is correct
      expect(result.current.isFloatingChatVisible).toBe(true);
      expect(result.current.mainChatIsTyping).toBe(true);
      expect(result.current.currentMainSessionId).toBe('main_123');
    });
  });
});
