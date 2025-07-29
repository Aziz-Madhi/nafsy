export function getTimeBasedGreeting(locale: 'en' | 'ar'): string {
  const hour = new Date().getHours();

  if (locale === 'ar') {
    if (hour < 5) return 'تصبح على خير';
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    if (hour < 21) return 'مساء الخير';
    return 'تصبح على خير';
  }

  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function getMotivationalMessage(
  category: string,
  locale: 'en' | 'ar'
): string {
  const messages = {
    en: {
      mindfulness: [
        'Find your center, one breath at a time',
        'Be present in this moment',
        'Your peace begins with a single mindful breath',
        'Cultivate awareness, embrace serenity',
      ],
      breathing: [
        'Breathe in calm, breathe out tension',
        'Your breath is your anchor to peace',
        'Each breath is a new beginning',
        'Let your breath guide you home',
      ],
      movement: [
        'Move your body, free your mind',
        'Every step is progress',
        'Your body is ready to support you',
        'Motion is emotion in action',
      ],
      journaling: [
        'Your thoughts deserve to be heard',
        'Write your way to clarity',
        'The page is your safe space',
        'Transform thoughts into understanding',
      ],
      relaxation: [
        'Permission to pause and rest',
        'Relaxation is productive self-care',
        'Let go and let peace in',
        'Your calm is waiting for you',
      ],
    },
    ar: {
      mindfulness: [
        'اعثر على مركزك، نفساً تلو الآخر',
        'كن حاضراً في هذه اللحظة',
        'سلامك يبدأ بنفس واحد واعٍ',
        'ازرع الوعي، احتضن السكينة',
      ],
      breathing: [
        'تنفس الهدوء، ازفر التوتر',
        'أنفاسك هي مرساتك للسلام',
        'كل نفس هو بداية جديدة',
        'دع أنفاسك تقودك إلى الوطن',
      ],
      movement: [
        'حرك جسدك، حرر عقلك',
        'كل خطوة هي تقدم',
        'جسدك مستعد لدعمك',
        'الحركة هي العاطفة في العمل',
      ],
      journaling: [
        'أفكارك تستحق أن تُسمع',
        'اكتب طريقك إلى الوضوح',
        'الصفحة هي مساحتك الآمنة',
        'حوّل الأفكار إلى فهم',
      ],
      relaxation: [
        'الإذن بالتوقف والراحة',
        'الاسترخاء هو رعاية ذاتية مثمرة',
        'اترك واسمح للسلام بالدخول',
        'هدوءك في انتظارك',
      ],
    },
  };

  const categoryMessages =
    messages[locale][category as keyof typeof messages.en] ||
    messages[locale].mindfulness;
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
}

export function getDailyExerciseIndex(
  exercises: any[],
  userId: string
): number {
  if (!exercises.length) return 0;

  // Use a combination of date and userId to create a stable daily index
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      1000 /
      60 /
      60 /
      24
  );

  // Simple hash function to combine userId with day
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Combine day and user hash for personalized daily selection
  const seed = dayOfYear + Math.abs(hash);
  return seed % exercises.length;
}
