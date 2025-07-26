# Logging Guidelines

## Overview

This document outlines the logging strategy implemented for the Nafsy app, including the custom logger utility and best practices for replacing console statements.

## Logger Implementation

### Location

- **Logger Utility**: `src/lib/logger.ts`
- **Usage**: Import and use throughout the codebase to replace console statements

### Features

1. **Environment Awareness**: Automatically adjusts logging levels based on `__DEV__` flag
2. **Log Levels**: debug, info, warn, error
3. **Contextual Logging**: Each log entry includes context information
4. **Specialized Methods**: Pre-configured methods for common scenarios
5. **Production Safety**: In production, only warnings and errors are logged

### Usage Examples

```typescript
import { logger } from '~/lib/logger';

// Basic logging
logger.debug('Debug message', 'ComponentName');
logger.info('Info message', 'ComponentName');
logger.warn('Warning message', 'ComponentName', errorData);
logger.error('Error message', 'ComponentName', error);

// Specialized logging
logger.storeError('Store operation failed', 'useAppStore', error);
logger.apiError('API request failed', '/api/users', error);
logger.uiError('Component render failed', 'ChatScreen', error);
logger.performance('Component rendered', { renderTime: 150 });
logger.security('Key generation failed', keyError);
```

## Console Statement Cleanup Status

### ✅ Completed Files

- **src/lib/mmkv-storage.ts**: All console statements replaced with proper logging
- **src/lib/secure-key.ts**: Security-related console statements upgraded to security logging
- **src/providers/StoreProvider.tsx**: Store initialization logging improved

### 🔄 In Progress / Remaining Files

The following files still contain console statements that should be replaced:

#### High Priority (Error Handling)

- `src/components/StoreErrorBoundary.tsx` - Error boundary logging
- `src/components/SafeErrorBoundary.tsx` - General error boundary
- `src/hooks/useAuthForm.ts` - Authentication error logging
- `src/lib/useUserSafe.ts` - User data error handling

#### Medium Priority (Feature Logging)

- `src/screens/tabs/mood.tsx` - Mood tracking operations
- `src/screens/tabs/profile.tsx` - Profile operations
- `src/app/chat-history.tsx` - Chat session management
- `src/providers/LanguageProvider.tsx` - Language switching
- `src/hooks/useTranslation.ts` - Translation errors

#### Low Priority (Development/Debug)

- `src/lib/performance-monitor.ts` - Performance metrics (already appropriate for dev)
- `src/components/ui/*.tsx` - UI component debugging
- `src/store/index.ts` - Store initialization debug logs

## Best Practices

### 1. Choose Appropriate Log Levels

- **debug**: Development debugging, temporary logs
- **info**: General application flow, successful operations
- **warn**: Recoverable errors, fallback usage, deprecated features
- **error**: Unrecoverable errors, exceptions, critical failures

### 2. Provide Context

Always include a context string to identify the source:

```typescript
logger.error('Failed to save user data', 'UserProfile', error);
```

### 3. Use Specialized Methods

For common scenarios, use the specialized logging methods:

```typescript
// Instead of
logger.error('Store operation failed', 'SomeStore', error);

// Use
logger.storeError('Operation failed', 'SomeStore', error);
```

### 4. Production Considerations

- Only warnings and errors are logged in production
- Avoid logging sensitive information (user data, tokens, keys)
- Performance-sensitive paths should use debug level

### 5. Error Object Handling

When logging errors, pass the error object as the third parameter:

```typescript
try {
  // some operation
} catch (error) {
  logger.error('Operation failed', 'ComponentName', error);
}
```

## Migration Strategy

### Phase 1 (Completed): Core Infrastructure

- ✅ Logger utility created
- ✅ MMKV storage logging
- ✅ Security key management logging
- ✅ Store provider logging

### Phase 2 (Recommended): Error Boundaries & Auth

- Replace console statements in error boundaries
- Upgrade authentication error logging
- Improve user data error handling

### Phase 3 (Future): Feature Areas

- Replace console statements in feature screens
- Upgrade translation and localization logging
- Improve UI component error logging

### Phase 4 (Optional): Development Logging

- Review and standardize development debugging logs
- Optimize performance monitoring logs

## Future Enhancements

1. **Remote Logging**: In production, consider sending error logs to a remote service
2. **Log Analytics**: Implement log analysis for identifying common issues
3. **User Feedback Integration**: Connect error logging with user feedback collection
4. **Performance Monitoring**: Integrate with performance monitoring tools

## Summary

The logging infrastructure is now in place with proper environment awareness and structured logging. Key security and infrastructure files have been updated to use the new logger. The remaining console statements in feature areas can be migrated incrementally as those areas are worked on.
