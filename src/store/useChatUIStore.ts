/**
 * Simplified Chat UI Store - Fixed version
 * Uses standard Zustand patterns with MMKV persistence
 */

import { shallow } from 'zustand/shallow';
import { createPersistedStore } from '~/lib/store-factory';

// Chat UI store state and actions interface
interface ChatUIStoreState {
  // Floating Chat UI State
  isFloatingChatVisible: boolean;
  floatingChatInput: string;
  floatingChatIsTyping: boolean;

  // Main Chat UI State
  mainChatInput: string;
  mainChatIsTyping: boolean;
  showQuickReplies: boolean;

  // Chat Session Management
  currentMainSessionId: string | null;
  currentVentSessionId: string | null;
  sessionSwitchLoading: boolean;
  sessionError: string | null;

  // Chat History Sidebar State
  isHistorySidebarVisible: boolean;

  // Shared UI State
  chatInputFocused: boolean;

  // Actions
  setFloatingChatVisible: (visible: boolean) => void;
  setFloatingChatInput: (input: string) => void;
  setFloatingChatTyping: (typing: boolean) => void;
  clearFloatingChatInput: () => void;

  setMainChatInput: (input: string) => void;
  setMainChatTyping: (typing: boolean) => void;
  setShowQuickReplies: (show: boolean) => void;
  clearMainChatInput: () => void;

  setCurrentMainSessionId: (sessionId: string | null) => void;
  setCurrentVentSessionId: (sessionId: string | null) => void;
  setSessionSwitchLoading: (loading: boolean) => void;
  setSessionError: (error: string | null) => void;
  switchToMainSession: (sessionId: string) => Promise<boolean>;
  switchToVentSession: (sessionId: string) => Promise<boolean>;
  clearCurrentSessions: () => void;

  setHistorySidebarVisible: (visible: boolean) => void;
  setChatInputFocused: (focused: boolean) => void;

  resetChatUI: () => void;
}

export const useChatUIStore = createPersistedStore<ChatUIStoreState>(
  { name: 'chat-ui-store' },
  (set, get) => ({
    // Initial state
    isFloatingChatVisible: false,
    floatingChatInput: '',
    floatingChatIsTyping: false,
    mainChatInput: '',
    mainChatIsTyping: false,
    showQuickReplies: true,
    currentMainSessionId: null,
    currentVentSessionId: null,
    sessionSwitchLoading: false,
    sessionError: null,
    isHistorySidebarVisible: false,
    chatInputFocused: false,

    // Floating Chat Actions
    setFloatingChatVisible: (visible: boolean) =>
      set({ isFloatingChatVisible: visible }),
    setFloatingChatInput: (input: string) => set({ floatingChatInput: input }),
    setFloatingChatTyping: (typing: boolean) =>
      set({ floatingChatIsTyping: typing }),
    clearFloatingChatInput: () => set({ floatingChatInput: '' }),

    // Main Chat Actions
    setMainChatInput: (input: string) => set({ mainChatInput: input }),
    setMainChatTyping: (typing: boolean) => set({ mainChatIsTyping: typing }),
    setShowQuickReplies: (show: boolean) => set({ showQuickReplies: show }),
    clearMainChatInput: () => set({ mainChatInput: '' }),

    // Session Management Actions
    setCurrentMainSessionId: (sessionId: string | null) =>
      set({ currentMainSessionId: sessionId }),
    setCurrentVentSessionId: (sessionId: string | null) =>
      set({ currentVentSessionId: sessionId }),
    setSessionSwitchLoading: (loading: boolean) =>
      set({ sessionSwitchLoading: loading }),
    setSessionError: (error: string | null) => set({ sessionError: error }),

    switchToMainSession: async (sessionId: string): Promise<boolean> => {
      set({ sessionSwitchLoading: true, sessionError: null });

      try {
        // Validate input
        if (!sessionId || sessionId.trim() === '') {
          throw new Error('Session ID cannot be empty');
        }

        // Simulate potential network error (for demo purposes)
        if (sessionId === 'invalid-session') {
          throw new Error('Session not found');
        }

        // Update session state
        set({
          currentMainSessionId: sessionId,
          mainChatInput: '',
          mainChatIsTyping: false,
          showQuickReplies: false,
        });

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to switch session';
        set({ sessionError: errorMessage });
        return false;
      } finally {
        set({ sessionSwitchLoading: false });
      }
    },

    switchToVentSession: async (sessionId: string): Promise<boolean> => {
      set({ sessionSwitchLoading: true, sessionError: null });

      try {
        // Validate input
        if (!sessionId || sessionId.trim() === '') {
          throw new Error('Session ID cannot be empty');
        }

        // Update session state
        set({
          currentVentSessionId: sessionId,
          floatingChatInput: '',
          floatingChatIsTyping: false,
        });

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to switch vent session';
        set({ sessionError: errorMessage });
        return false;
      } finally {
        set({ sessionSwitchLoading: false });
      }
    },

    clearCurrentSessions: () =>
      set({
        currentMainSessionId: null,
        currentVentSessionId: null,
        sessionSwitchLoading: false,
        sessionError: null,
      }),

    // UI Actions
    setHistorySidebarVisible: (visible: boolean) =>
      set({ isHistorySidebarVisible: visible }),
    setChatInputFocused: (focused: boolean) =>
      set({ chatInputFocused: focused }),

    // Reset Action
    resetChatUI: () =>
      set({
        isFloatingChatVisible: false,
        floatingChatInput: '',
        floatingChatIsTyping: false,
        mainChatInput: '',
        mainChatIsTyping: false,
        showQuickReplies: true,
        currentMainSessionId: null,
        currentVentSessionId: null,
        sessionSwitchLoading: false,
        isHistorySidebarVisible: false,
        chatInputFocused: false,
      }),
  })
);

// Optimized selectors for UI state
export const useFloatingChatVisible = () =>
  useChatUIStore((state) => state.isFloatingChatVisible);
export const useFloatingChatInput = () =>
  useChatUIStore((state) => state.floatingChatInput);
export const useFloatingChatTyping = () =>
  useChatUIStore((state) => state.floatingChatIsTyping);
export const useMainChatInput = () =>
  useChatUIStore((state) => state.mainChatInput);
export const useMainChatTyping = () =>
  useChatUIStore((state) => state.mainChatIsTyping);
export const useShowQuickReplies = () =>
  useChatUIStore((state) => state.showQuickReplies);
export const useChatInputFocused = () =>
  useChatUIStore((state) => state.chatInputFocused);
export const useHistorySidebarVisible = () =>
  useChatUIStore((state) => state.isHistorySidebarVisible);

// Session Management Selectors
export const useCurrentMainSessionId = () =>
  useChatUIStore((state) => state.currentMainSessionId);
export const useCurrentVentSessionId = () =>
  useChatUIStore((state) => state.currentVentSessionId);
export const useSessionSwitchLoading = () =>
  useChatUIStore((state) => state.sessionSwitchLoading);
export const useSessionError = () =>
  useChatUIStore((state) => state.sessionError);

// Action selectors with shallow comparison
export const useChatUIActions = () =>
  useChatUIStore(
    (state) => ({
      // Floating chat
      setFloatingChatVisible: state.setFloatingChatVisible,
      setFloatingChatInput: state.setFloatingChatInput,
      setFloatingChatTyping: state.setFloatingChatTyping,
      clearFloatingChatInput: state.clearFloatingChatInput,

      // Main chat
      setMainChatInput: state.setMainChatInput,
      setMainChatTyping: state.setMainChatTyping,
      setShowQuickReplies: state.setShowQuickReplies,
      clearMainChatInput: state.clearMainChatInput,

      // Session management
      setCurrentMainSessionId: state.setCurrentMainSessionId,
      setCurrentVentSessionId: state.setCurrentVentSessionId,
      switchToMainSession: state.switchToMainSession,
      switchToVentSession: state.switchToVentSession,
      clearCurrentSessions: state.clearCurrentSessions,

      // UI state
      setHistorySidebarVisible: state.setHistorySidebarVisible,
      setChatInputFocused: state.setChatInputFocused,

      // Utils
      resetChatUI: state.resetChatUI,
    }),
    shallow
  );
