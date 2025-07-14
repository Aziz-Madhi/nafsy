import { mutation } from "./_generated/server";

export const seedExercises = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if exercises already exist
    const existingExercises = await ctx.db.query("exercises").first();
    if (existingExercises) {
      return { message: "Exercises already seeded" };
    }

    const exercises = [
      {
        title: "Box Breathing",
        titleAr: "تنفس الصندوق",
        description: "A simple technique to reduce stress and anxiety",
        descriptionAr: "تقنية بسيطة لتقليل التوتر والقلق",
        category: "breathing" as const,
        duration: 5,
        difficulty: "beginner" as const,
        instructions: [
          "Sit comfortably with your back straight",
          "Breathe in slowly for 4 counts",
          "Hold your breath for 4 counts",
          "Breathe out slowly for 4 counts",
          "Hold empty for 4 counts",
          "Repeat for 5-10 cycles"
        ],
        instructionsAr: [
          "اجلس بشكل مريح مع ظهر مستقيم",
          "استنشق ببطء لمدة 4 عدات",
          "احبس أنفاسك لمدة 4 عدات",
          "ازفر ببطء لمدة 4 عدات",
          "احبس نفسك فارغًا لمدة 4 عدات",
          "كرر لمدة 5-10 دورات"
        ],
      },
      {
        title: "Body Scan Meditation",
        titleAr: "تأمل مسح الجسم",
        description: "Mindful awareness of physical sensations",
        descriptionAr: "الوعي الذهني بالأحاسيس الجسدية",
        category: "mindfulness" as const,
        duration: 10,
        difficulty: "beginner" as const,
        instructions: [
          "Lie down comfortably on your back",
          "Close your eyes and take deep breaths",
          "Focus on your toes, notice any sensations",
          "Slowly move your attention up through your body",
          "Notice without judgment any tension or relaxation",
          "End at the top of your head"
        ],
        instructionsAr: [
          "استلقِ بشكل مريح على ظهرك",
          "أغلق عينيك وخذ أنفاسًا عميقة",
          "ركز على أصابع قدميك، لاحظ أي أحاسيس",
          "حرك انتباهك ببطء عبر جسمك",
          "لاحظ دون حكم أي توتر أو استرخاء",
          "انتهِ عند قمة رأسك"
        ],
      },
      {
        title: "Progressive Muscle Relaxation",
        titleAr: "الاسترخاء العضلي التدريجي",
        description: "Systematically tense and relax muscle groups",
        descriptionAr: "شد واسترخاء مجموعات العضلات بشكل منهجي",
        category: "relaxation" as const,
        duration: 15,
        difficulty: "intermediate" as const,
        instructions: [
          "Start with your feet and toes",
          "Tense the muscles for 5 seconds",
          "Release and notice the relaxation",
          "Move up to calves, thighs, and so on",
          "Continue through all muscle groups",
          "End with full body relaxation"
        ],
        instructionsAr: [
          "ابدأ بقدميك وأصابع قدميك",
          "شد العضلات لمدة 5 ثوان",
          "أطلق ولاحظ الاسترخاء",
          "انتقل إلى الساقين والفخذين وهكذا",
          "استمر عبر جميع مجموعات العضلات",
          "انتهِ بالاسترخاء الكامل للجسم"
        ],
      },
      {
        title: "Gratitude Journal",
        titleAr: "يوميات الامتنان",
        description: "Write down things you're grateful for",
        descriptionAr: "اكتب الأشياء التي أنت ممتن لها",
        category: "journaling" as const,
        duration: 10,
        difficulty: "beginner" as const,
        instructions: [
          "Find a quiet space with pen and paper",
          "Think about your day or week",
          "Write down 3-5 things you're grateful for",
          "Be specific and detailed",
          "Reflect on why you're grateful for each",
          "Notice how you feel after writing"
        ],
        instructionsAr: [
          "ابحث عن مكان هادئ مع قلم وورقة",
          "فكر في يومك أو أسبوعك",
          "اكتب 3-5 أشياء أنت ممتن لها",
          "كن محددًا ومفصلاً",
          "تأمل في سبب امتنانك لكل منها",
          "لاحظ كيف تشعر بعد الكتابة"
        ],
      },
      {
        title: "4-7-8 Breathing",
        titleAr: "تنفس 4-7-8",
        description: "Natural tranquilizer for the nervous system",
        descriptionAr: "مهدئ طبيعي للجهاز العصبي",
        category: "breathing" as const,
        duration: 5,
        difficulty: "beginner" as const,
        instructions: [
          "Exhale completely through your mouth",
          "Close mouth, inhale through nose for 4",
          "Hold your breath for 7 counts",
          "Exhale through mouth for 8 counts",
          "This is one cycle, repeat 3-4 times",
          "Practice twice daily"
        ],
        instructionsAr: [
          "ازفر بالكامل من فمك",
          "أغلق فمك، استنشق من أنفك لمدة 4",
          "احبس أنفاسك لمدة 7 عدات",
          "ازفر من فمك لمدة 8 عدات",
          "هذه دورة واحدة، كرر 3-4 مرات",
          "مارس مرتين يوميًا"
        ],
      },
      {
        title: "Mindful Walking",
        titleAr: "المشي الواعي",
        description: "Combine movement with present-moment awareness",
        descriptionAr: "اجمع بين الحركة والوعي باللحظة الحالية",
        category: "movement" as const,
        duration: 20,
        difficulty: "beginner" as const,
        instructions: [
          "Find a quiet path or space",
          "Walk at a natural pace",
          "Focus on the sensation of walking",
          "Notice your breath and surroundings",
          "When mind wanders, return to walking",
          "End with gratitude"
        ],
        instructionsAr: [
          "ابحث عن مسار أو مساحة هادئة",
          "امشِ بوتيرة طبيعية",
          "ركز على إحساس المشي",
          "لاحظ تنفسك ومحيطك",
          "عندما يشرد ذهنك، ارجع إلى المشي",
          "انتهِ بالامتنان"
        ],
      },
    ];

    // Insert all exercises
    for (const exercise of exercises) {
      await ctx.db.insert("exercises", exercise);
    }

    return { message: "Successfully seeded exercises", count: exercises.length };
  },
});