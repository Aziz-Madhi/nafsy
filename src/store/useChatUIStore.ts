/**
 * Simplified Chat UI Store - Fixed version
 * Uses standard Zustand patterns with MMKV persistence
 */

import { createPersistedStore } from '~/lib/store-factory';

// Chat types
export type ChatType = 'coach' | 'event' | 'companion';

// Chat UI store state and actions interface
interface ChatUIStoreState {
  // Active Chat Type
  activeChatType: ChatType;

  // Coach Chat (formerly mainChat) - Professional therapy sessions
  coachChatInput: string;
  currentCoachSessionId: string | null;

  // Event Chat (overlay-only) - Private quick emotional releases
  isEventChatVisible: boolean;
  currentEventMessage: string | null;
  eventChatLoading: boolean;

  // Companion Chat - Friendly daily check-ins
  companionChatInput: string;
  currentCompanionSessionId: string | null;

  // Shared Session Management
  sessionSwitchLoading: boolean;
  sessionError: string | null;

  // Chat History Sidebar State
  isHistorySidebarVisible: boolean;

  // Shared UI State
  chatInputFocused: boolean;

  // Chat Type Actions
  setActiveChatType: (type: ChatType) => void;
  switchChatType: (type: ChatType) => Promise<void>;

  // Coach Chat Actions (formerly mainChat)
  setCoachChatInput: (input: string) => void;
  clearCoachChatInput: () => void;
  setCurrentCoachSessionId: (sessionId: string | null) => void;
  switchToCoachSession: (sessionId: string) => Promise<boolean>;

  // Event Chat Actions (overlay-only, no session tracking)
  setEventChatVisible: (visible: boolean) => void;
  setCurrentEventMessage: (message: string | null) => void;
  setEventChatLoading: (loading: boolean) => void;
  clearEventChat: () => void;

  // Companion Chat Actions
  setCompanionChatInput: (input: string) => void;
  clearCompanionChatInput: () => void;
  setCurrentCompanionSessionId: (sessionId: string | null) => void;
  switchToCompanionSession: (sessionId: string) => Promise<boolean>;

  // Shared Actions
  setSessionSwitchLoading: (loading: boolean) => void;
  setSessionError: (error: string | null) => void;
  clearCurrentSessions: () => void;
  setHistorySidebarVisible: (visible: boolean) => void;
  setChatInputFocused: (focused: boolean) => void;
  resetChatUI: () => void;
  initializeEmptyChat: () => void;

  // Legacy support (for backward compatibility during migration)
  mainChatInput: string;
  currentMainSessionId: string | null;
  currentVentSessionId: string | null;
  ventChatInput: string;
  isVentChatVisible: boolean;
  currentVentMessage: string | null;
  ventChatLoading: boolean;
  setMainChatInput: (input: string) => void;
  clearMainChatInput: () => void;
  setCurrentMainSessionId: (sessionId: string | null) => void;
  setCurrentVentSessionId: (sessionId: string | null) => void;
  switchToMainSession: (sessionId: string) => Promise<boolean>;
  switchToVentSession: (sessionId: string) => Promise<boolean>;
  setVentChatVisible: (visible: boolean) => void;
  setCurrentVentMessage: (message: string | null) => void;
  setVentChatInput: (input: string) => void;
  setVentChatLoading: (loading: boolean) => void;
  clearVentChat: () => void;
}

export const useChatUIStore = createPersistedStore<ChatUIStoreState>(
  { name: 'chat-ui-store' },
  (set, get) => ({
    // Initial state
    activeChatType: 'coach' as ChatType,

    // Coach Chat State
    coachChatInput: '',
    currentCoachSessionId: null,

    // Event Chat State (overlay-only)
    isEventChatVisible: false,
    currentEventMessage: null,
    eventChatLoading: false,

    // Companion Chat State
    companionChatInput: '',
    currentCompanionSessionId: null,

    // Shared State
    sessionSwitchLoading: false,
    sessionError: null,
    isHistorySidebarVisible: false,
    chatInputFocused: false,

    // Legacy state (for backward compatibility)
    mainChatInput: '',
    currentMainSessionId: null,
    currentVentSessionId: null,
    isVentChatVisible: false,
    currentVentMessage: null,
    ventChatInput: '',
    ventChatLoading: false,

    // Chat Type Actions
    setActiveChatType: (type: ChatType) => set({ activeChatType: type }),
    switchChatType: async (type: ChatType) => {
      const { activeChatType } = get();

      // No-op if switching to the same type
      if (activeChatType === type) return;

      // Only update the active type. Do not clear session IDs.
      // Sessions are created lazily on first message send, and existing
      // sessions should be preserved across personality switches.
      set({ activeChatType: type });

      // Optional: clear transient inputs only (they are not persisted/used by UI)
      set({
        coachChatInput: '',
        companionChatInput: '',
        // Legacy fields
        mainChatInput: '',
        ventChatInput: '',
      });

      console.log(`🔄 Switched to ${type} personality without clearing sessions`);
    },

    // Coach Chat Actions
    setCoachChatInput: (input: string) =>
      set({ coachChatInput: input, mainChatInput: input }),
    clearCoachChatInput: () => set({ coachChatInput: '', mainChatInput: '' }),
    setCurrentCoachSessionId: (sessionId: string | null) =>
      set({
        currentCoachSessionId: sessionId,
        currentMainSessionId: sessionId,
      }),
    switchToCoachSession: async (sessionId: string): Promise<boolean> => {
      set({ sessionSwitchLoading: true, sessionError: null });
      try {
        if (!sessionId || sessionId.trim() === '') {
          throw new Error('Session ID cannot be empty');
        }
        set({
          currentCoachSessionId: sessionId,
          currentMainSessionId: sessionId,
          coachChatInput: '',
          mainChatInput: '',
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

    // Event Chat Actions (overlay-only, no session management)
    setEventChatVisible: (visible: boolean) =>
      set({ isEventChatVisible: visible, isVentChatVisible: visible }),
    setCurrentEventMessage: (message: string | null) =>
      set({ currentEventMessage: message, currentVentMessage: message }),
    setEventChatLoading: (loading: boolean) =>
      set({ eventChatLoading: loading, ventChatLoading: loading }),
    clearEventChat: () =>
      set({
        currentEventMessage: null,
        currentVentMessage: null,
        eventChatLoading: false,
        ventChatLoading: false,
      }),

    // Companion Chat Actions
    setCompanionChatInput: (input: string) =>
      set({ companionChatInput: input }),
    clearCompanionChatInput: () => set({ companionChatInput: '' }),
    setCurrentCompanionSessionId: (sessionId: string | null) =>
      set({ currentCompanionSessionId: sessionId }),
    switchToCompanionSession: async (sessionId: string): Promise<boolean> => {
      set({ sessionSwitchLoading: true, sessionError: null });
      try {
        if (!sessionId || sessionId.trim() === '') {
          throw new Error('Session ID cannot be empty');
        }
        set({
          currentCompanionSessionId: sessionId,
          companionChatInput: '',
        });
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to switch companion session';
        set({ sessionError: errorMessage });
        return false;
      } finally {
        set({ sessionSwitchLoading: false });
      }
    },

    // Legacy Main Chat Actions (for backward compatibility)
    setMainChatInput: (input: string) =>
      set({ mainChatInput: input, coachChatInput: input }),
    clearMainChatInput: () => set({ mainChatInput: '', coachChatInput: '' }),

    // Shared Session Management Actions
    setSessionSwitchLoading: (loading: boolean) =>
      set({ sessionSwitchLoading: loading }),
    setSessionError: (error: string | null) => set({ sessionError: error }),

    // Legacy Session Actions (for backward compatibility)
    setCurrentMainSessionId: (sessionId: string | null) =>
      set({
        currentMainSessionId: sessionId,
        currentCoachSessionId: sessionId,
      }),
    setCurrentVentSessionId: (sessionId: string | null) =>
      set({
        currentVentSessionId: sessionId,
        currentEventSessionId: sessionId,
      }),

    switchToMainSession: async (sessionId: string): Promise<boolean> => {
      // Delegate to coach session
      const actions = get();
      return actions.switchToCoachSession(sessionId);
    },

    switchToVentSession: async (sessionId: string): Promise<boolean> => {
      // Event sessions no longer exist - this is for legacy compatibility only
      console.warn(
        'switchToVentSession called but event sessions are no longer stored'
      );
      return false;
    },

    clearCurrentSessions: () =>
      set({
        currentCoachSessionId: null,
        currentCompanionSessionId: null,
        currentMainSessionId: null,
        currentVentSessionId: null,
        sessionSwitchLoading: false,
        sessionError: null,
        // Also clear inputs
        coachChatInput: '',
        companionChatInput: '',
        mainChatInput: '',
        ventChatInput: '',
      }),

    // UI Actions
    setHistorySidebarVisible: (visible: boolean) =>
      set({ isHistorySidebarVisible: visible }),
    setChatInputFocused: (focused: boolean) =>
      set({ chatInputFocused: focused }),

    // Legacy Vent Chat Actions (for backward compatibility)
    setVentChatVisible: (visible: boolean) =>
      set({ isVentChatVisible: visible, isEventChatVisible: visible }),
    setCurrentVentMessage: (message: string | null) =>
      set({ currentVentMessage: message, currentEventMessage: message }),
    setVentChatInput: (input: string) =>
      set({ ventChatInput: input, eventChatInput: input }),
    setVentChatLoading: (loading: boolean) =>
      set({ ventChatLoading: loading, eventChatLoading: loading }),
    clearVentChat: () => {
      const actions = get();
      actions.clearEventChat();
    },

    // Reset Action - start with empty state
    resetChatUI: () =>
      set({
        activeChatType: 'coach',
        coachChatInput: '',
        currentCoachSessionId: null,
        isEventChatVisible: false,
        currentEventMessage: null,
        eventChatLoading: false,
        companionChatInput: '',
        currentCompanionSessionId: null,
        sessionSwitchLoading: false,
        sessionError: null,
        isHistorySidebarVisible: false,
        chatInputFocused: false,
        // Legacy fields
        mainChatInput: '',
        currentMainSessionId: null,
        currentVentSessionId: null,
        isVentChatVisible: false,
        currentVentMessage: null,
        ventChatInput: '',
        ventChatLoading: false,
      }),

    // Force start with empty sessions (for app initialization)
    initializeEmptyChat: () => {
      const actions = get();
      actions.resetChatUI();
      console.log('🆕 Initialized with empty chat sessions');
    },
  })
);

// Chat Type Selectors
export const useActiveChatType = () =>
  useChatUIStore((state) => state.activeChatType);

// Coach Chat Selectors
export const useCoachChatInput = () =>
  useChatUIStore((state) => state.coachChatInput);
export const useCurrentCoachSessionId = () =>
  useChatUIStore((state) => state.currentCoachSessionId);

// Event Chat Selectors (overlay-only)
export const useEventChatVisible = () =>
  useChatUIStore((state) => state.isEventChatVisible);
export const useCurrentEventMessage = () =>
  useChatUIStore((state) => state.currentEventMessage);
export const useEventChatLoading = () =>
  useChatUIStore((state) => state.eventChatLoading);

// Companion Chat Selectors
export const useCompanionChatInput = () =>
  useChatUIStore((state) => state.companionChatInput);
export const useCurrentCompanionSessionId = () =>
  useChatUIStore((state) => state.currentCompanionSessionId);

// Shared UI Selectors
export const useChatInputFocused = () =>
  useChatUIStore((state) => state.chatInputFocused);
export const useHistorySidebarVisible = () =>
  useChatUIStore((state) => state.isHistorySidebarVisible);
export const useSessionSwitchLoading = () =>
  useChatUIStore((state) => state.sessionSwitchLoading);
export const useSessionError = () =>
  useChatUIStore((state) => state.sessionError);

// Legacy Selectors (for backward compatibility)
export const useMainChatInput = () =>
  useChatUIStore((state) => state.mainChatInput);
export const useCurrentMainSessionId = () =>
  useChatUIStore((state) => state.currentMainSessionId);
export const useCurrentVentSessionId = () =>
  useChatUIStore((state) => state.currentVentSessionId);
export const useVentChatVisible = () =>
  useChatUIStore((state) => state.isVentChatVisible);
export const useCurrentVentMessage = () =>
  useChatUIStore((state) => state.currentVentMessage);
export const useVentChatInput = () =>
  useChatUIStore((state) => state.ventChatInput);
export const useVentChatLoading = () =>
  useChatUIStore((state) => state.ventChatLoading);

// Action selectors with shallow comparison
export const useChatUIActions = () =>
  useChatUIStore((state) => ({
    // Chat Type Management
    setActiveChatType: state.setActiveChatType,
    switchChatType: state.switchChatType,

    // Coach Chat
    setCoachChatInput: state.setCoachChatInput,
    clearCoachChatInput: state.clearCoachChatInput,
    setCurrentCoachSessionId: state.setCurrentCoachSessionId,
    switchToCoachSession: state.switchToCoachSession,

    // Event Chat (overlay-only)
    setEventChatVisible: state.setEventChatVisible,
    setCurrentEventMessage: state.setCurrentEventMessage,
    setEventChatLoading: state.setEventChatLoading,
    clearEventChat: state.clearEventChat,

    // Companion Chat
    setCompanionChatInput: state.setCompanionChatInput,
    clearCompanionChatInput: state.clearCompanionChatInput,
    setCurrentCompanionSessionId: state.setCurrentCompanionSessionId,
    switchToCompanionSession: state.switchToCompanionSession,

    // Session management
    clearCurrentSessions: state.clearCurrentSessions,

    // UI state
    setHistorySidebarVisible: state.setHistorySidebarVisible,
    setChatInputFocused: state.setChatInputFocused,

    // Legacy (backward compatibility)
    setMainChatInput: state.setMainChatInput,
    clearMainChatInput: state.clearMainChatInput,
    setCurrentMainSessionId: state.setCurrentMainSessionId,
    setCurrentVentSessionId: state.setCurrentVentSessionId,
    switchToMainSession: state.switchToMainSession,
    switchToVentSession: state.switchToVentSession,
    setVentChatVisible: state.setVentChatVisible,
    setCurrentVentMessage: state.setCurrentVentMessage,
    setVentChatInput: state.setVentChatInput,
    setVentChatLoading: state.setVentChatLoading,
    clearVentChat: state.clearVentChat,

    // Utils
    resetChatUI: state.resetChatUI,
  }));
