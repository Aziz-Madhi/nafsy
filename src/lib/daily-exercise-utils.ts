export function getTimeBasedGreeting(t?: (key: string) => string): string {
  const hour = new Date().getHours();

  if (!t) {
    // Fallback to English if no translation function provided
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }

  if (hour < 5) return t('exercises.greeting.night');
  if (hour < 12) return t('exercises.greeting.morning');
  if (hour < 17) return t('exercises.greeting.afternoon');
  if (hour < 21) return t('exercises.greeting.evening');
  return t('exercises.greeting.night');
}

export function getMotivationalMessage(
  category: string,
  t?: (key: string) => string
): string {
  if (!t) {
    // Fallback to English if no translation function provided
    const messages = {
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
    };

    const categoryMessages =
      messages[category as keyof typeof messages] || messages.mindfulness;
    return categoryMessages[
      Math.floor(Math.random() * categoryMessages.length)
    ];
  }

  const messageKeys = {
    mindfulness: [
      'exercises.motivational.mindfulness.0',
      'exercises.motivational.mindfulness.1',
      'exercises.motivational.mindfulness.2',
      'exercises.motivational.mindfulness.3',
    ],
    breathing: [
      'exercises.motivational.breathing.0',
      'exercises.motivational.breathing.1',
      'exercises.motivational.breathing.2',
      'exercises.motivational.breathing.3',
    ],
    movement: [
      'exercises.motivational.movement.0',
      'exercises.motivational.movement.1',
      'exercises.motivational.movement.2',
      'exercises.motivational.movement.3',
    ],
    journaling: [
      'exercises.motivational.journaling.0',
      'exercises.motivational.journaling.1',
      'exercises.motivational.journaling.2',
      'exercises.motivational.journaling.3',
    ],
    relaxation: [
      'exercises.motivational.relaxation.0',
      'exercises.motivational.relaxation.1',
      'exercises.motivational.relaxation.2',
      'exercises.motivational.relaxation.3',
    ],
  };

  const categoryKeys =
    messageKeys[category as keyof typeof messageKeys] ||
    messageKeys.mindfulness;
  const randomKey =
    categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
  return t(randomKey);
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
