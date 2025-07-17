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
  
  // Shared UI State
  chatInputFocused: boolean;
  
  // Actions
  setFloatingChatVisible: (visible: boolean) => void;
  setFloatingChatInput: (input: string) => void;
  setFloatingChatTyping: (typing: boolean) => void;
  setMainChatInput: (input: string) => void;
  setMainChatTyping: (typing: boolean) => void;
  setShowQuickReplies: (show: boolean) => void;
  setChatInputFocused: (focused: boolean) => void;
  clearFloatingChatInput: () => void;
  clearMainChatInput: () => void;
  resetChatUI: () => void;
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
        chatInputFocused: false,

        // Actions
        setFloatingChatVisible: (visible) =>
          set({ isFloatingChatVisible: visible }),

        setFloatingChatInput: (input) =>
          set({ floatingChatInput: input }),

        setFloatingChatTyping: (typing) =>
          set({ floatingChatIsTyping: typing }),

        setMainChatInput: (input) =>
          set({ mainChatInput: input }),

        setMainChatTyping: (typing) =>
          set({ mainChatIsTyping: typing }),

        setShowQuickReplies: (show) =>
          set({ showQuickReplies: show }),

        setChatInputFocused: (focused) =>
          set({ chatInputFocused: focused }),

        clearFloatingChatInput: () =>
          set({ floatingChatInput: '' }),

        clearMainChatInput: () =>
          set({ mainChatInput: '' }),

        resetChatUI: () =>
          set({
            isFloatingChatVisible: false,
            floatingChatInput: '',
            floatingChatIsTyping: false,
            mainChatInput: '',
            mainChatIsTyping: false,
            showQuickReplies: true,
            chatInputFocused: false,
          }),
      }),
      {
        name: 'chat-ui-store',
        // Only persist certain UI states, not typing indicators
        partialize: (state) => ({
          isFloatingChatVisible: state.isFloatingChatVisible,
          showQuickReplies: state.showQuickReplies,
          // Don't persist typing states or input values
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