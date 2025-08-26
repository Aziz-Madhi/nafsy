import { ChatType } from '~/store/useChatUIStore';

export interface ChatStyles {
  bubbleUserClass: string;
  bubbleAIClass: string;
  headerClass: string;
  inputContainerClass: string;
  sendButtonClass: string;
  borderColorClass: string;
  accentClass: string;
  primaryColor: string;
  bubbleColor: string;
  accentColor: string;
}

/**
 * Get chat-specific styling classes based on the active chat type
 */
export function getChatStyles(type: ChatType): ChatStyles {
  switch (type) {
    case 'coach':
      return {
        bubbleUserClass: 'bg-chat-coach-primary text-white',
        bubbleAIClass: 'bg-chat-coach-primary/10 text-foreground',
        headerClass:
          'bg-gradient-to-b from-chat-coach-primary/5 to-transparent',
        inputContainerClass:
          'border-chat-coach-primary/20 bg-chat-coach-primary/5',
        sendButtonClass: 'bg-chat-coach-primary',
        borderColorClass: 'border-l-chat-coach-primary',
        accentClass: 'text-chat-coach-primary',
        primaryColor: '#2F6A8D',
        bubbleColor: '#2F6A8D',
        accentColor: '#23526E',
      };

    case 'event':
      return {
        bubbleUserClass: 'bg-chat-event-primary text-white',
        bubbleAIClass: 'bg-chat-event-primary/10 text-foreground',
        headerClass:
          'bg-gradient-to-b from-chat-event-primary/5 to-transparent',
        inputContainerClass:
          'border-chat-event-primary/20 bg-chat-event-primary/5',
        sendButtonClass: 'bg-chat-event-primary',
        borderColorClass: 'border-l-chat-event-primary',
        accentClass: 'text-chat-event-primary',
        primaryColor: '#B45F74',
        bubbleColor: '#B45F74',
        accentColor: '#964F61',
      };

    case 'companion':
      return {
        bubbleUserClass: 'bg-chat-companion-primary text-white',
        bubbleAIClass: 'bg-chat-companion-primary/10 text-foreground',
        headerClass:
          'bg-gradient-to-b from-chat-companion-primary/5 to-transparent',
        inputContainerClass:
          'border-chat-companion-primary/20 bg-chat-companion-primary/5',
        sendButtonClass: 'bg-chat-companion-primary',
        borderColorClass: 'border-l-chat-companion-primary',
        accentClass: 'text-chat-companion-primary',
        primaryColor: '#7BA05B',
        bubbleColor: '#7BA05B',
        accentColor: '#628049',
      };

    default:
      // Default to coach style
      return getChatStyles('coach');
  }
}

/**
 * Get placeholder text for chat input based on chat type
 */
export function getChatPlaceholder(
  type: ChatType,
  isArabic: boolean = false
): string {
  const placeholders = {
    coach: {
      en: 'Share your thoughts...',
      ar: 'شارك أفكارك...',
    },
    event: {
      en: "What's on your mind?",
      ar: 'ما الذي يدور في ذهنك؟',
    },
    companion: {
      en: 'How are you feeling?',
      ar: 'كيف تشعر؟',
    },
  };

  return isArabic
    ? placeholders[type]?.ar || placeholders.coach.ar
    : placeholders[type]?.en || placeholders.coach.en;
}

/**
 * Get welcome message for chat type
 */
export function getChatWelcomeMessage(
  type: ChatType,
  userName?: string,
  isArabic: boolean = false
): string {
  const name = userName || (isArabic ? 'صديق' : 'friend');

  const messages = {
    coach: {
      en: `Welcome back, ${name}. I'm here to support your mental wellness journey.`,
      ar: `مرحباً بعودتك، ${name}. أنا هنا لدعم رحلتك نحو العافية النفسية.`,
    },
    event: {
      en: `Hey ${name}! Need a quick emotional release? Let it out here.`,
      ar: `مرحباً ${name}! تحتاج إلى إطلاق عاطفي سريع؟ أطلق العنان هنا.`,
    },
    companion: {
      en: `Hi ${name}! I'm your daily companion. How's your day going?`,
      ar: `مرحباً ${name}! أنا رفيقك اليومي. كيف يسير يومك؟`,
    },
  };

  return isArabic
    ? messages[type]?.ar || messages.coach.ar
    : messages[type]?.en || messages.coach.en;
}

/**
 * Get session title prefix based on chat type
 */
export function getSessionTitlePrefix(
  type: ChatType,
  isArabic: boolean = false
): string {
  const prefixes = {
    coach: {
      en: 'Therapy Session',
      ar: 'جلسة علاجية',
    },
    event: {
      en: 'Quick Vent',
      ar: 'تنفيس سريع',
    },
    companion: {
      en: 'Daily Check-in',
      ar: 'تسجيل يومي',
    },
  };

  return isArabic
    ? prefixes[type]?.ar || prefixes.coach.ar
    : prefixes[type]?.en || prefixes.coach.en;
}
