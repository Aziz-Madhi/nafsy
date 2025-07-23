import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createMMKVPersist } from '~/lib/mmkv-zustand';

interface ChatUIState {
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

  // Chat History Sidebar State
  isHistorySidebarVisible: boolean;

  // Shared UI State
  chatInputFocused: boolean;

  // Actions
  setFloatingChatVisible: (visible: boolean) => void;
  setFloatingChatInput: (input: string) => void;
  setFloatingChatTyping: (typing: boolean) => void;
  setMainChatInput: (input: string) => void;
  setMainChatTyping: (typing: boolean) => void;
  setShowQuickReplies: (show: boolean) => void;
  setHistorySidebarVisible: (visible: boolean) => void;
  setChatInputFocused: (focused: boolean) => void;
  clearFloatingChatInput: () => void;
  clearMainChatInput: () => void;
  resetChatUI: () => void;

  // Session Management Actions
  setCurrentMainSessionId: (sessionId: string | null) => void;
  setCurrentVentSessionId: (sessionId: string | null) => void;
  setSessionSwitchLoading: (loading: boolean) => void;
  switchToMainSession: (sessionId: string) => Promise<void>;
  switchToVentSession: (sessionId: string) => Promise<void>;
  clearCurrentSessions: () => void;

  // Persist methods (added by middleware)
  persist: {
    hasHydrated: () => boolean;
    rehydrate: () => Promise<void>;
    clearStorage: () => void;
    getHydrationState: () => any;
  };
}

export const useChatUIStore = create<ChatUIState>()(
  subscribeWithSelector(
    createMMKVPersist(
      (set) => ({
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
        isHistorySidebarVisible: false,
        chatInputFocused: false,

        // Actions
        setFloatingChatVisible: (visible) =>
          set({ isFloatingChatVisible: visible }),

        setFloatingChatInput: (input) => set({ floatingChatInput: input }),

        setFloatingChatTyping: (typing) =>
          set({ floatingChatIsTyping: typing }),

        setMainChatInput: (input) => set({ mainChatInput: input }),

        setMainChatTyping: (typing) => set({ mainChatIsTyping: typing }),

        setShowQuickReplies: (show) => set({ showQuickReplies: show }),

        setHistorySidebarVisible: (visible) =>
          set({ isHistorySidebarVisible: visible }),

        setChatInputFocused: (focused) => set({ chatInputFocused: focused }),

        clearFloatingChatInput: () => set({ floatingChatInput: '' }),

        clearMainChatInput: () => set({ mainChatInput: '' }),

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

        // Session Management Actions
        setCurrentMainSessionId: (sessionId) =>
          set({ currentMainSessionId: sessionId }),

        setCurrentVentSessionId: (sessionId) =>
          set({ currentVentSessionId: sessionId }),

        setSessionSwitchLoading: (loading) =>
          set({ sessionSwitchLoading: loading }),

        switchToMainSession: async (sessionId) => {
          set({ sessionSwitchLoading: true });
          try {
            // Reset UI state for session switch
            set({
              currentMainSessionId: sessionId,
              mainChatInput: '',
              mainChatIsTyping: false,
              showQuickReplies: false, // Hide quick replies when switching sessions
            });
          } finally {
            set({ sessionSwitchLoading: false });
          }
        },

        switchToVentSession: async (sessionId) => {
          set({ sessionSwitchLoading: true });
          try {
            set({
              currentVentSessionId: sessionId,
              floatingChatInput: '',
              floatingChatIsTyping: false,
            });
          } finally {
            set({ sessionSwitchLoading: false });
          }
        },

        clearCurrentSessions: () =>
          set({
            currentMainSessionId: null,
            currentVentSessionId: null,
            sessionSwitchLoading: false,
          }),
      }),
      {
        name: 'chat-ui-store',
        // Only persist certain UI states, not typing indicators
        partialize: (state) => ({
          isFloatingChatVisible: state.isFloatingChatVisible,
          showQuickReplies: state.showQuickReplies,
          currentMainSessionId: state.currentMainSessionId,
          currentVentSessionId: state.currentVentSessionId,
          // Don't persist typing states, loading states, or input values
        }),
      }
    )
  )
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

// Individual session action selectors to avoid object recreation
export const useSetCurrentMainSessionId = () =>
  useChatUIStore((state) => state.setCurrentMainSessionId);
export const useSetCurrentVentSessionId = () =>
  useChatUIStore((state) => state.setCurrentVentSessionId);
export const useSetSessionSwitchLoading = () =>
  useChatUIStore((state) => state.setSessionSwitchLoading);
export const useSwitchToMainSession = () =>
  useChatUIStore((state) => state.switchToMainSession);
export const useSwitchToVentSession = () =>
  useChatUIStore((state) => state.switchToVentSession);
export const useClearCurrentSessions = () =>
  useChatUIStore((state) => state.clearCurrentSessions);
