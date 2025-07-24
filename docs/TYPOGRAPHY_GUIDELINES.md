# iOS Typography Guidelines for Nafsy Mental Health App

This document outlines the standardized typography system implemented throughout the app to ensure consistency with iOS design guidelines.

## Text Variant System

Our app uses a structured variant system through the `Text` component. All hardcoded font sizes have been replaced with semantic variants.

### Typography Hierarchy

#### Large Titles

- **title1**: `text-4xl font-bold` (28pt) - Large page titles, major impact elements
- **title2**: `text-3xl font-bold` (24pt) - Section headers, major content areas
- **title3**: `text-2xl font-bold` (20pt) - Subsection headers, card titles
- **title4**: `text-xl font-bold` (18pt) - Screen titles, modal headers

#### Body Text

- **heading**: `text-lg font-semibold` (17pt) - Navigation titles, emphasized content
- **body**: `text-base` (16pt) - Primary body text, main content
- **callout**: `text-base font-medium` (16pt) - Emphasized body text
- **subhead**: `text-sm font-medium` (14pt) - List descriptions, secondary content

#### Small Text

- **footnote**: `text-sm` (13pt) - Tertiary text, disclaimers
- **caption1**: `text-xs font-medium` (12pt) - Labels, section headers
- **caption2**: `text-xs` (11pt) - Smallest text, timestamps, metadata

### iOS Alignment Reference

| iOS Guideline     | Size Range                         | Our Variant        | Use Case              |
| ----------------- | ---------------------------------- | ------------------ | --------------------- |
| Large page titles | 24-28pt                            | title1-title2      | Major screen headers  |
| Centered titles   | 15-17pt                            | heading            | Navigation bar titles |
| Primary text      | 14-18pt                            | body, callout      | Main content          |
| List items        | 14-15pt main, 12-13pt descriptions | body, subhead      | List content          |
| Tertiary text     | 11-12pt                            | caption1, caption2 | Supporting info       |
| Tab labels        | 10-12pt                            | caption1, caption2 | Navigation labels     |

## Usage Examples

### Screen Headers

```tsx
<Text variant="title4" className="text-center">
  Mood Tracker
</Text>
```

### Body Content

```tsx
<Text variant="body">
  Track your emotional wellbeing with daily mood logging.
</Text>
```

### Small Labels

```tsx
<Text variant="caption2" className="text-muted-foreground">
  Last updated: 2 hours ago
</Text>
```

## Implementation Notes

1. **Always use variants** instead of hardcoded Tailwind classes like `text-xl`, `text-sm`, etc.
2. **Combine with semantic colors** using `text-muted-foreground` for secondary text
3. **Maintain hierarchy** - ensure proper visual weight distribution across content
4. **Test with accessibility** - all text meets iOS accessibility standards

## Migration Status

✅ **Completed Components:**

- ScreenLayout component
- Text variant system
- Mood tracking screen
- Profile screen
- Chat screen
- ChatComponents
- All hardcoded font sizes removed

## Best Practices

1. **Use semantic variants** that match content purpose
2. **Avoid hardcoded sizes** - always prefer the variant system
3. **Test hierarchy** - ensure visual weight flows properly
4. **Consider RTL support** - use `enableRTL` prop when needed
5. **Maintain consistency** - use same variants for similar content types

This system ensures consistent, accessible, and maintainable typography throughout the Nafsy mental health app.
