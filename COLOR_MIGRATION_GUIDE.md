# Color System Migration Guide

## Overview

This guide helps migrate from the old scattered color system to the new unified Tailwind-based color system.

## Quick Migration Reference

### Common Color Replacements

| Old Value                  | New Tailwind Class                         | Notes                    |
| -------------------------- | ------------------------------------------ | ------------------------ |
| `#2196F3`                  | `text-primary` or `bg-primary`             | Primary brand blue       |
| `#5A4A3A`                  | `text-foreground` or `text-brand-brownish` | Main text color          |
| `#F4F1ED`                  | `bg-background`                            | Main app background      |
| `#EEEBE7`                  | `bg-card`                                  | Card background          |
| `rgba(90, 74, 58, 0.12)`   | `bg-card`                                  | Already calculated value |
| `rgba(255, 255, 255, 0.2)` | `bg-white/20`                              | Using Tailwind opacity   |
| `rgba(0, 0, 0, 0.1)`       | `bg-black/10`                              | Using Tailwind opacity   |
| `#FF3B30`                  | `text-error` or `bg-error`                 | Error/destructive color  |
| `#007AFF`                  | `text-info` or `bg-info`                   | Info/accent blue         |
| `#34C759`                  | `text-success` or `bg-success`             | Success green            |
| `#6B7280`                  | `text-muted-foreground`                    | Muted text               |
| `#E5E7EB`                  | `bg-gray-200`                              | Light gray background    |
| `#9CA3AF`                  | `text-gray-400`                            | Gray text                |
| `#2F6A8D`                  | `text-chat-bubble-user`                    | Chat user bubble         |

### Mood Colors

| Old Usage                     | New Tailwind Class                       |
| ----------------------------- | ---------------------------------------- |
| `colors.mood.happy.primary`   | `text-mood-happy` or `bg-mood-happy`     |
| `colors.mood.sad.primary`     | `text-mood-sad` or `bg-mood-sad`         |
| `colors.mood.anxious.primary` | `text-mood-anxious` or `bg-mood-anxious` |
| `colors.mood.neutral.primary` | `text-mood-neutral` or `bg-mood-neutral` |
| `colors.mood.angry.primary`   | `text-mood-angry` or `bg-mood-angry`     |

### Opacity Patterns

| Old Pattern                             | New Pattern                         |
| --------------------------------------- | ----------------------------------- |
| `rgba(255, 255, 255, 0.85)`             | `text-white/85`                     |
| `backgroundColor: 'rgba(0, 0, 0, 0.4)'` | `className="bg-black/40"`           |
| `'#FF3B30' + '15'`                      | `bg-error/15`                       |
| `withOpacity(color, 0.3)`               | Use Tailwind opacity modifier `/30` |

## Migration Steps

### Step 1: Replace Direct Hex/RGBA Values

#### Before:

```tsx
<View style={{ backgroundColor: '#F4F1ED' }}>
  <Text style={{ color: '#5A4A3A' }}>Hello</Text>
</View>
```

#### After:

```tsx
<View className="bg-background">
  <Text className="text-foreground">Hello</Text>
</View>
```

### Step 2: Replace Inline Styles with Classes

#### Before:

```tsx
<View
  style={{
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#E5E7EB',
  }}
>
```

#### After:

```tsx
<View className="bg-white/20 border-gray-200">
```

### Step 3: Update Color Helper Usage

#### Before:

```tsx
import { colors } from '~/lib/design-tokens';

const buttonColor = colors.mood.happy.primary;
const bgColor = withOpacity(colors.wellness.mindfulness.primary, 0.3);
```

#### After:

```tsx
// Use Tailwind classes directly
<Button className="bg-mood-happy">
<View className="bg-wellness-mindfulness/30">
```

### Step 4: Handle Dynamic Colors

#### Before:

```tsx
const moodColor = colors.mood[moodType].primary;
<View style={{ backgroundColor: moodColor }}>
```

#### After:

```tsx
// Option 1: Use conditional classes
<View className={cn(
  moodType === 'happy' && 'bg-mood-happy',
  moodType === 'sad' && 'bg-mood-sad',
  // etc...
)}>

// Option 2: Use CSS variables directly for truly dynamic values
<View style={{
  backgroundColor: `rgb(var(--mood-${moodType}))`
}}>
```

### Step 5: Update Component Files

1. Remove imports of `colors` from `design-tokens.ts`
2. Remove `withOpacity` and other color helper imports
3. Replace all color values with Tailwind classes
4. Use `cn()` helper for conditional classes

### Step 6: Dark Mode Support

#### Before:

```tsx
const textColor = isDark ? '#FFFFFF' : '#5A4A3A';
```

#### After:

```tsx
// Automatic with CSS variables
<Text className="text-foreground">
  This text automatically adapts to dark mode
</Text>

// Or use dark: modifier for specific overrides
<View className="bg-white dark:bg-gray-800">
```

## Component-Specific Migrations

### Navigation (MorphingTabBar)

```tsx
// Before
const iconColor = focused ? '#2F6A8D' : '#9CA3AF';

// After
const iconClass = focused ? 'text-tab-active' : 'text-tab-inactive';
```

### Chat Components

```tsx
// Before
backgroundColor: isUser ? 'rgba(47, 106, 141, 1)' : 'rgba(32, 32, 32, 1)'

// After
className={isUser ? 'bg-chat-bubble-user' : 'bg-chat-bubble-ai'}
```

### Mood Tracking

```tsx
// Before
backgroundColor: colors.mood[mood.mood].primary

// After
className={`bg-mood-${mood.mood}`}
```

## Testing Checklist

After migration, verify:

- [ ] Colors appear correctly in light mode
- [ ] Colors adapt properly in dark mode
- [ ] Opacity values work as expected
- [ ] Dynamic color switching works (mood colors, etc.)
- [ ] No hardcoded colors remain
- [ ] All screens maintain visual consistency

## Troubleshooting

### Issue: Color not applying

- Ensure the Tailwind class is spelled correctly
- Check if the color is defined in `global.css`
- Verify the CSS variable is set properly

### Issue: Opacity not working

- Use Tailwind's opacity syntax: `bg-primary/50` instead of `opacity-50`
- For dynamic opacity, use style prop with CSS variables

### Issue: Dark mode not working

- Check if CSS variables are defined in both `:root` and `.dark` selectors
- Ensure the app properly sets the `dark` class on the root element
- Verify the store's theme state is connected

## Benefits After Migration

1. **Single Source of Truth**: All colors defined in `global.css`
2. **Automatic Dark Mode**: CSS variables handle theme switching
3. **Better Performance**: No runtime color calculations
4. **Type Safety**: Tailwind IntelliSense provides autocomplete
5. **Consistency**: Same color values everywhere
6. **Easy Updates**: Change colors in one place
7. **Opacity Support**: Native Tailwind opacity modifiers
