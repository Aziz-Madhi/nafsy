/**
 * Lazy-loaded Chat History Sidebar
 * Only loads when sidebar is actually shown, reducing initial bundle size
 */

import { createLazyScreen } from '~/lib/lazy-screen';

// Lazy load the chat history sidebar
export const ChatHistorySidebarLazy = createLazyScreen(
  () =>
    import('../chat/ChatHistorySidebar').then((module) => ({
      default: module.ChatHistorySidebar,
    })),
  'Chat History'
);
