import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const seedExercises = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if exercises already exist
    const existingExercises = await ctx.db.query('exercises').first();
    if (existingExercises) {
      return { message: 'Exercises already seeded' };
    }

    const exercises = [
      {
        title: 'Box Breathing',
        titleAr: 'تنفس الصندوق',
        description: 'A simple technique to reduce stress and anxiety',
        descriptionAr: 'تقنية بسيطة لتقليل التوتر والقلق',
        category: 'breathing' as const,
        duration: 5,
        difficulty: 'beginner' as const,
        instructions: [
          'Sit comfortably with your back straight',
          'Breathe in slowly for 4 counts',
          'Hold your breath for 4 counts',
          'Breathe out slowly for 4 counts',
          'Hold empty for 4 counts',
          'Repeat for 5-10 cycles',
        ],
        instructionsAr: [
          'اجلس بشكل مريح مع ظهر مستقيم',
          'استنشق ببطء لمدة 4 عدات',
          'احبس أنفاسك لمدة 4 عدات',
          'ازفر ببطء لمدة 4 عدات',
          'احبس نفسك فارغًا لمدة 4 عدات',
          'كرر لمدة 5-10 دورات',
        ],
      },
      {
        title: 'Body Scan Meditation',
        titleAr: 'تأمل مسح الجسم',
        description: 'Mindful awareness of physical sensations',
        descriptionAr: 'الوعي الذهني بالأحاسيس الجسدية',
        category: 'mindfulness' as const,
        duration: 10,
        difficulty: 'beginner' as const,
        instructions: [
          'Lie down comfortably on your back',
          'Close your eyes and take deep breaths',
          'Focus on your toes, notice any sensations',
          'Slowly move your attention up through your body',
          'Notice without judgment any tension or relaxation',
          'End at the top of your head',
        ],
        instructionsAr: [
          'استلقِ بشكل مريح على ظهرك',
          'أغلق عينيك وخذ أنفاسًا عميقة',
          'ركز على أصابع قدميك، لاحظ أي أحاسيس',
          'حرك انتباهك ببطء عبر جسمك',
          'لاحظ دون حكم أي توتر أو استرخاء',
          'انتهِ عند قمة رأسك',
        ],
      },
      {
        title: 'Progressive Muscle Relaxation',
        titleAr: 'الاسترخاء العضلي التدريجي',
        description: 'Systematically tense and relax muscle groups',
        descriptionAr: 'شد واسترخاء مجموعات العضلات بشكل منهجي',
        category: 'relaxation' as const,
        duration: 15,
        difficulty: 'intermediate' as const,
        instructions: [
          'Start with your feet and toes',
          'Tense the muscles for 5 seconds',
          'Release and notice the relaxation',
          'Move up to calves, thighs, and so on',
          'Continue through all muscle groups',
          'End with full body relaxation',
        ],
        instructionsAr: [
          'ابدأ بقدميك وأصابع قدميك',
          'شد العضلات لمدة 5 ثوان',
          'أطلق ولاحظ الاسترخاء',
          'انتقل إلى الساقين والفخذين وهكذا',
          'استمر عبر جميع مجموعات العضلات',
          'انتهِ بالاسترخاء الكامل للجسم',
        ],
      },
      {
        title: 'Gratitude Journal',
        titleAr: 'يوميات الامتنان',
        description: "Write down things you're grateful for",
        descriptionAr: 'اكتب الأشياء التي أنت ممتن لها',
        category: 'journaling' as const,
        duration: 10,
        difficulty: 'beginner' as const,
        instructions: [
          'Find a quiet space with pen and paper',
          'Think about your day or week',
          "Write down 3-5 things you're grateful for",
          'Be specific and detailed',
          "Reflect on why you're grateful for each",
          'Notice how you feel after writing',
        ],
        instructionsAr: [
          'ابحث عن مكان هادئ مع قلم وورقة',
          'فكر في يومك أو أسبوعك',
          'اكتب 3-5 أشياء أنت ممتن لها',
          'كن محددًا ومفصلاً',
          'تأمل في سبب امتنانك لكل منها',
          'لاحظ كيف تشعر بعد الكتابة',
        ],
      },
      {
        title: '4-7-8 Breathing',
        titleAr: 'تنفس 4-7-8',
        description: 'Natural tranquilizer for the nervous system',
        descriptionAr: 'مهدئ طبيعي للجهاز العصبي',
        category: 'breathing' as const,
        duration: 5,
        difficulty: 'beginner' as const,
        instructions: [
          'Exhale completely through your mouth',
          'Close mouth, inhale through nose for 4',
          'Hold your breath for 7 counts',
          'Exhale through mouth for 8 counts',
          'This is one cycle, repeat 3-4 times',
          'Practice twice daily',
        ],
        instructionsAr: [
          'ازفر بالكامل من فمك',
          'أغلق فمك، استنشق من أنفك لمدة 4',
          'احبس أنفاسك لمدة 7 عدات',
          'ازفر من فمك لمدة 8 عدات',
          'هذه دورة واحدة، كرر 3-4 مرات',
          'مارس مرتين يوميًا',
        ],
      },
      {
        title: 'Mindful Walking',
        titleAr: 'المشي الواعي',
        description: 'Combine movement with present-moment awareness',
        descriptionAr: 'اجمع بين الحركة والوعي باللحظة الحالية',
        category: 'movement' as const,
        duration: 20,
        difficulty: 'beginner' as const,
        instructions: [
          'Find a quiet path or space',
          'Walk at a natural pace',
          'Focus on the sensation of walking',
          'Notice your breath and surroundings',
          'When mind wanders, return to walking',
          'End with gratitude',
        ],
        instructionsAr: [
          'ابحث عن مسار أو مساحة هادئة',
          'امشِ بوتيرة طبيعية',
          'ركز على إحساس المشي',
          'لاحظ تنفسك ومحيطك',
          'عندما يشرد ذهنك، ارجع إلى المشي',
          'انتهِ بالامتنان',
        ],
      },
    ];

    // Insert all exercises
    for (const exercise of exercises) {
      await ctx.db.insert('exercises', exercise);
    }

    return {
      message: 'Successfully seeded exercises',
      count: exercises.length,
    };
  },
});

export const seedMoods = mutation({
  args: {
    userId: v.optional(v.id('users')), // Optional user ID, if not provided, use first user
  },
  handler: async (ctx, args) => {
    // Get user ID - use provided one or find the first user
    let userId = args.userId;
    if (!userId) {
      const firstUser = await ctx.db.query('users').first();
      if (!firstUser) {
        throw new Error('No users found. Please create a user first.');
      }
      userId = firstUser._id;
    }

    // Generate mood data for the last 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const moodEntries = [
      // Recent entries (last week)
      {
        mood: 'happy' as const,
        note: 'Had a great workout session today!',
        tags: ['Exercise', 'Energy', 'Achievement'],
        createdAt: now - (1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        mood: 'anxious' as const,
        note: 'Big presentation tomorrow',
        tags: ['Work', 'Stress', 'Presentation'],
        createdAt: now - (2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        mood: 'neutral' as const,
        note: 'Regular day, nothing special',
        tags: ['Routine', 'Stable'],
        createdAt: now - (3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        mood: 'sad' as const,
        note: 'Missing my family today',
        tags: ['Family', 'Loneliness', 'Missing'],
        createdAt: now - (4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        mood: 'angry' as const,
        note: 'Traffic was terrible this morning',
        tags: ['Traffic', 'Frustration', 'Morning'],
        createdAt: now - (5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        mood: 'happy' as const,
        note: 'Got promoted at work!',
        tags: ['Work', 'Achievement', 'Success', 'Career'],
        createdAt: now - (6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
      {
        mood: 'neutral' as const,
        note: 'Quiet weekend, reading books',
        tags: ['Reading', 'Relaxation', 'Weekend'],
        createdAt: now - (7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      
      // Second week
      {
        mood: 'anxious' as const,
        note: 'Worried about upcoming medical appointment',
        tags: ['Health', 'Medical', 'Worry'],
        createdAt: now - (8 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'happy' as const,
        note: 'Wonderful dinner with friends',
        tags: ['Friends', 'Social', 'Food', 'Connection'],
        createdAt: now - (9 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'sad' as const,
        note: 'Feeling overwhelmed with responsibilities',
        tags: ['Overwhelmed', 'Responsibility', 'Stress'],
        createdAt: now - (10 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'neutral' as const,
        note: 'Productive day at work',
        tags: ['Work', 'Productive', 'Focus'],
        createdAt: now - (11 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'happy' as const,
        note: 'Beautiful sunset walk',
        tags: ['Nature', 'Walking', 'Beauty', 'Peace'],
        createdAt: now - (12 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'angry' as const,
        note: 'Frustrated with technical issues',
        tags: ['Technology', 'Frustration', 'Work'],
        createdAt: now - (13 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'anxious' as const,
        note: 'Financial concerns keeping me up',
        tags: ['Money', 'Finance', 'Sleep', 'Worry'],
        createdAt: now - (14 * 24 * 60 * 60 * 1000),
      },
      
      // Third week
      {
        mood: 'happy' as const,
        note: 'Finished a challenging project',
        tags: ['Achievement', 'Project', 'Completion', 'Pride'],
        createdAt: now - (15 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'neutral' as const,
        note: 'Regular gym session',
        tags: ['Exercise', 'Routine', 'Health'],
        createdAt: now - (16 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'sad' as const,
        note: 'Feeling lonely today',
        tags: ['Loneliness', 'Isolation', 'Emotional'],
        createdAt: now - (17 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'happy' as const,
        note: 'Video call with family made my day',
        tags: ['Family', 'Connection', 'Love', 'Support'],
        createdAt: now - (18 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'anxious' as const,
        note: 'Job interview preparation stress',
        tags: ['Job', 'Interview', 'Career', 'Preparation'],
        createdAt: now - (19 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'neutral' as const,
        note: 'Rainy day, staying indoors',
        tags: ['Weather', 'Indoor', 'Calm'],
        createdAt: now - (20 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'angry' as const,
        note: 'Argument with roommate',
        tags: ['Conflict', 'Living', 'Communication'],
        createdAt: now - (21 * 24 * 60 * 60 * 1000),
      },
      
      // Fourth week
      {
        mood: 'happy' as const,
        note: 'Started learning a new hobby',
        tags: ['Learning', 'Hobby', 'Growth', 'Excitement'],
        createdAt: now - (22 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'sad' as const,
        note: 'Pet is sick, very worried',
        tags: ['Pet', 'Health', 'Worry', 'Care'],
        createdAt: now - (23 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'neutral' as const,
        note: 'Busy day with errands',
        tags: ['Errands', 'Busy', 'Tasks'],
        createdAt: now - (24 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'anxious' as const,
        note: 'Upcoming travel plans causing stress',
        tags: ['Travel', 'Planning', 'Logistics'],
        createdAt: now - (25 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'happy' as const,
        note: 'Great conversation with mentor',
        tags: ['Mentorship', 'Guidance', 'Growth', 'Career'],
        createdAt: now - (26 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'neutral' as const,
        note: 'Peaceful morning meditation',
        tags: ['Meditation', 'Peace', 'Morning', 'Mindfulness'],
        createdAt: now - (27 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'angry' as const,
        note: 'Delivery was delayed again',
        tags: ['Delivery', 'Disappointment', 'Service'],
        createdAt: now - (28 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'sad' as const,
        note: 'Anniversary of a difficult loss',
        tags: ['Loss', 'Memory', 'Grief', 'Anniversary'],
        createdAt: now - (29 * 24 * 60 * 60 * 1000),
      },
      {
        mood: 'happy' as const,
        note: 'Started using this mood tracking app!',
        tags: ['New Beginning', 'Self-care', 'Mental Health', 'App'],
        createdAt: now - (30 * 24 * 60 * 60 * 1000),
      },
    ];

    // Insert all mood entries
    for (const entry of moodEntries) {
      await ctx.db.insert('moods', {
        ...entry,
        userId,
      });
    }

    return {
      message: 'Successfully seeded mood data',
      count: moodEntries.length,
      userId,
    };
  },
});
