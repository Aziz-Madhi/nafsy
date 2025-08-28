# Mood Rating System Implementation Plan: 1-10 Scale

## Overview

Transition from emoji-based mood selection (5 moods) to a numerical 1-10 rating system while maintaining the existing minimalist design, tag system, notes, and all other functionality.

## Design Philosophy

- **Maintain minimalist aesthetic**: Clean, uncluttered interface
- **Progressive disclosure**: Show tags and notes only after rating selection
- **Smooth transitions**: Use existing animation patterns
- **Color mapping**: Map rating values to existing mood colors
- **Accessibility**: Clear labels and haptic feedback

## Rating Scale Mapping

### Numerical to Emotional State Mapping

```
1-2: Very Sad (Deep sadness, despair) → moodSad color
3-4: Sad/Low (Feeling down, melancholic) → moodSad color (lighter)
5-6: Neutral/Okay (Balanced, stable) → moodNeutral color
7-8: Good/Happy (Positive, content) → moodHappy color
9-10: Very Happy (Joyful, euphoric) → moodHappy color (vibrant)
```

### Mood Category Determination (for tags and exercises)

```typescript
function getMoodCategoryFromRating(rating: number): MoodType {
  if (rating <= 2) return 'sad';
  if (rating <= 4) return 'anxious';
  if (rating <= 6) return 'neutral';
  if (rating <= 8) return 'happy';
  return 'happy'; // 9-10
}
```

## Implementation Steps

### Phase 1: Backend Updates

#### 1.1 Update Convex Schema (`convex/schema.ts`)

```typescript
moods: defineTable({
  userId: v.id('users'),
  // KEEP OLD FIELD for backward compatibility
  mood: v.optional(
    v.union(
      v.literal('happy'),
      v.literal('neutral'),
      v.literal('sad'),
      v.literal('anxious'),
      v.literal('angry')
    )
  ),
  // ADD NEW FIELDS
  rating: v.optional(v.number()), // 1-10 scale
  moodCategory: v.optional(v.string()), // derived from rating
  note: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  createdAt: v.number(),
});
```

#### 1.2 Update Mood Mutations (`convex/moods.ts`)

- Add `rating` parameter to `createMood`
- Auto-derive `moodCategory` from rating
- Maintain backward compatibility by keeping `mood` field

### Phase 2: UI Component Design

#### 2.1 Rating Selector Component

**Design Elements:**

- **Horizontal slider**: Interactive 1-10 scale
- **Visual feedback**: Number highlights on selection
- **Descriptive labels**: Show emotional state for current rating
- **Color gradient**: Transition from sad colors (1) to happy colors (10)

**Component Structure:**

```tsx
<RatingSelector>
  <RatingSlider /> // Interactive slider 1-10
  <RatingDisplay /> // Shows selected number prominently
  <RatingDescription /> // Dynamic text: "Very Sad", "Neutral", etc.
  <ColorIndicator /> // Visual mood color based on rating
</RatingSelector>
```

#### 2.2 Visual Design Specifications

```css
/* Slider Track */
- Height: 8px
- Border radius: 4px
- Background: Linear gradient from moodSad → moodNeutral → moodHappy
- Dark mode: Add subtle glow effect

/* Slider Thumb */
- Size: 32px × 32px
- Shape: Circle with subtle shadow
- Color: Dynamic based on current rating
- Animation: Spring animation on drag

/* Rating Number Display */
- Font: CrimsonPro-Bold
- Size: 48px
- Color: Matches mood category color
- Animation: Fade and scale on change

/* Description Text */
- Font: CrimsonPro-Regular
- Size: 18px
- Updates dynamically with rating
```

### Phase 3: Component Implementation

#### 3.1 Create New Components

**`src/components/mood/RatingSelector.tsx`**

- Interactive slider component
- Haptic feedback on value change
- Animated number display
- Dynamic color transitions

**`src/components/mood/RatingDescription.tsx`**

- Maps rating to descriptive text
- Supports i18n translations
- Smooth text transitions

#### 3.2 Update Existing Components

**`src/app/(app)/tabs/mood/index.tsx`**

- Replace `AnimatedMoodButton` grid with `RatingSelector`
- Keep `TagsSection` component (update to use rating-based categories)
- Maintain note input and save functionality
- Update save handler to include rating

### Phase 4: Data Migration Strategy

#### 4.1 Backward Compatibility

```typescript
// In mood display components
const displayRating = mood.rating || mapMoodToRating(mood.mood);
const displayCategory = mood.moodCategory || mood.mood;
```

#### 4.2 Rating Mapping for Old Data

```typescript
const mapMoodToRating = (mood: string): number => {
  switch (mood) {
    case 'sad':
      return 2;
    case 'anxious':
      return 4;
    case 'neutral':
      return 6;
    case 'happy':
      return 8;
    case 'angry':
      return 3;
    default:
      return 5;
  }
};
```

### Phase 5: Calendar & Analytics Updates

#### 5.1 Update Color Mapping

- Pixel calendar: Map 1-10 ratings to color intensity
- Week view: Use gradient colors based on rating
- Analytics: Show rating distribution charts

#### 5.2 New Visualizations

- Add average rating display
- Show rating trends over time
- Mood improvement indicators

## UI/UX Flow

### User Journey

1. **Open mood tab** → See week view + rating card
2. **Interact with slider** → See real-time number/color/description updates
3. **Select rating** → Tags appear based on rating category
4. **Select tags** (optional) → Contextual factors
5. **Add note** (optional) → Personal reflection
6. **Save mood** → Show encouraging message
7. **View suggestion** → Exercise based on rating category

### Animation Sequence

```
1. Initial state: Slider at center (5), neutral colors
2. User drags: Number scales up, color transitions, haptic feedback
3. Release: Spring animation to nearest integer
4. Tags appear: Fade in with slight upward motion
5. Save: Button pulses, then transitions to success state
```

## Localization Updates

### Translation Keys (`src/locales/`)

```json
{
  "mood": {
    "rating": {
      "title": "How are you feeling?",
      "description": "Rate your mood from 1 to 10",
      "labels": {
        "1": "Very Sad",
        "2": "Sad",
        "3": "Down",
        "4": "Low",
        "5": "Okay",
        "6": "Fine",
        "7": "Good",
        "8": "Happy",
        "9": "Very Happy",
        "10": "Euphoric"
      }
    }
  }
}
```

## Testing Checklist

### Functionality

- [ ] Rating selection works (1-10)
- [ ] Tags appear for appropriate rating ranges
- [ ] Save functionality with rating
- [ ] Backward compatibility with old mood data
- [ ] Exercise suggestions based on rating

### Visual

- [ ] Smooth color transitions
- [ ] Responsive slider interaction
- [ ] Dark mode compatibility
- [ ] Animation performance
- [ ] Accessibility (VoiceOver support)

### Data

- [ ] Rating saves correctly to database
- [ ] Category derivation is accurate
- [ ] Calendar displays rating-based colors
- [ ] Analytics show rating data

## Implementation Priority

### MVP (Phase 1)

1. Create `RatingSelector` component
2. Update mood screen to use rating
3. Modify save function for rating
4. Basic color mapping

### Enhancement (Phase 2)

1. Advanced animations
2. Gradient colors in calendar
3. Rating trends in analytics
4. Migration of old data

### Polish (Phase 3)

1. Haptic feedback refinement
2. Advanced visualizations
3. Predictive insights
4. Mood improvement tracking

## Code Examples

### Rating Selector Component (Simplified)

```tsx
const RatingSelector = ({ value, onChange }) => {
  const colors = useColors();
  const { t } = useTranslation();

  const getRatingColor = (rating: number) => {
    if (rating <= 3) return colors.moodSad;
    if (rating <= 5) return colors.moodAnxious;
    if (rating <= 7) return colors.moodNeutral;
    return colors.moodHappy;
  };

  return (
    <View className="items-center">
      <Text variant="h3" style={{ color: getRatingColor(value) }}>
        {value}
      </Text>
      <Slider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={(val) => {
          impactAsync(ImpactFeedbackStyle.Light);
          onChange(Math.round(val));
        }}
        minimumTrackTintColor={getRatingColor(value)}
        maximumTrackTintColor={colors.border}
        thumbTintColor={getRatingColor(value)}
      />
      <Text variant="body">{t(`mood.rating.labels.${value}`)}</Text>
    </View>
  );
};
```

## Success Metrics

- User engagement: Track if users log moods more frequently
- Data richness: More nuanced mood data (1-10 vs 5 categories)
- User satisfaction: Feedback on new system
- Performance: No degradation in app performance

## Rollback Plan

- Keep old `mood` field in database
- Feature flag to switch between systems
- Export/backup user data before migration
- Quick revert capability in case of issues
