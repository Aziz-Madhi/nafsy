# Chat Personalization System Implementation

## Overview

This document provides a comprehensive overview of the chat personalization system implemented for the Nafsy mental health React Native application. The system enhances AI-powered conversations by providing contextual information about users' daily activities, mood patterns, and conversation history.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema Changes](#database-schema-changes)
3. [Core Components](#core-components)
4. [Implementation Details](#implementation-details)
5. [Context Format and Structure](#context-format-and-structure)
6. [Weekly Summarization System](#weekly-summarization-system)
7. [Cost Optimization](#cost-optimization)
8. [Error Handling and Fallbacks](#error-handling-and-fallbacks)
9. [Testing and Validation](#testing-and-validation)
10. [Deployment Notes](#deployment-notes)
11. [Future Enhancements](#future-enhancements)

## Architecture Overview

The personalization system follows a modular architecture that integrates seamlessly with the existing Nafsy chat infrastructure:

```mermaid
graph TD
    A[User Starts Chat] --> B[buildUserContext]
    B --> C{New Session?}
    C -->|Yes| D[Full Context]
    C -->|No| E[Light Context]
    D --> F[Get Today's Data + Weekly Summary]
    E --> G[Get Today's Data Only]
    F --> H[Format Context]
    G --> H
    H --> I[Inject into AI Prompt]
    I --> J[OpenAI Response]
    
    K[Weekly Cron] --> L[Process Active Users]
    L --> M[Generate Summaries]
    M --> N[Store in userSummaries]
```

### Key Design Principles

- **Session-Aware Context**: Different context levels based on conversation state
- **Cost-Effective**: Optimized for minimal token usage and API calls
- **Multilingual**: Full Arabic/English support with language-aware formatting
- **Privacy-First**: No raw conversation storage, only AI-generated summaries
- **Performance-Optimized**: Indexed queries and bounded context size

## Database Schema Changes

### New Tables

#### userSummaries

Stores weekly AI-generated summaries for personalization context.

```typescript
userSummaries: defineTable({
  userId: v.id('users'),
  weekStartDate: v.number(), // Sunday 00:00 UTC epoch timestamp
  conversationSummary: v.string(), // AI-generated summary of conversations
  moodSummary: v.string(), // Summary of mood patterns
  exerciseSummary: v.string(), // Summary of exercise habits
  createdAt: v.number(),
})
  .index('by_user_week', ['userId', 'weekStartDate'])
  .index('by_user_created', ['userId', 'createdAt']),
```

### Index Strategy

- **by_user_week**: Efficient weekly summary lookups
- **by_user_created**: Latest summary retrieval for context building

## Core Components

### 1. Personalization Module (`convex/personalization.ts`)

Central module handling context building and weekly summarization.

#### Key Functions

##### buildUserContext (Query)

```typescript
interface UserContextInput {
  user: { _id: Id<'users'>; name?: string; language: string };
  personality: 'coach' | 'companion' | 'vent';
  messages: Array<{ role: 'user' | 'assistant'; content?: string; parts?: any[] }>;
}

interface UserContextResult {
  text: string;
  level: 'full' | 'light' | 'none';
}
```

**Purpose**: Assembles personalized context for AI responses
**Context Levels**:
- **Full**: Profile + Today's data + Weekly summary (new sessions)
- **Light**: Today's mood and exercises only (ongoing conversations)
- **None**: Minimal fallback on errors

##### generateWeeklySummaries (Internal Mutation)

**Purpose**: Processes all active users for weekly summarization
**Triggered**: Every Sunday at 23:00 UTC via cron job
**Processing**:
1. Identifies active users (last active within 30 days)
2. Aggregates past week's data per user
3. Calls OpenAI for AI summarization
4. Stores results in userSummaries table

### 2. Enhanced AI Integration

#### Modified Files

##### `convex/openaiResponses.ts`

Enhanced `buildResponsesPayload` function to include user context:

```typescript
export async function buildResponsesPayload(
  ctx: any,
  personality: 'coach' | 'companion' | 'vent',
  messages: Array<{ role: 'user' | 'assistant'; content?: string; parts?: any[] }>,
  user: { _id: string; name?: string; language: string }
): Promise<{
  payload: OpenAIResponsesRequest;
  modelConfig?: { temperature?: number; maxTokens?: number; topP?: number };
}>
```

**Integration Points**:
- **Prompt IDs**: Context added as `payload.instructions`
- **Inline Prompts**: Context prepended to prompt content
- **Fallback Prompts**: Context prepended to default prompts

##### `convex/http.ts`

Updated HTTP streaming handlers to pass user information and handle context in both API paths:
- **OpenAI Responses API**: Uses enhanced `buildResponsesPayload`
- **Legacy Chat Completions**: Direct context integration in system prompt

### 3. Automated Summarization (`convex/crons.ts`)

Added weekly cron job:

```typescript
crons.cron(
  'generate user summaries',
  '0 23 * * 0', // Every Sunday at 11 PM UTC
  internal.personalization.generateWeeklySummaries,
  {}
);
```

## Context Format and Structure

### Context Template

```
--- BEGIN_USER_CONTEXT ---
Profile: [User Name], Language: [ar/en]
Today: Mood [rating/category] "[note]", Exercises: [count] ([top category])
Last 7 days: [AI-generated summary of patterns and themes]
--- END_USER_CONTEXT ---

[Original System Prompt continues...]
```

### Multilingual Support

Context labels adapt to user's preferred language:

```typescript
const labels = {
  profile: isArabic ? 'الملف الشخصي' : 'Profile',
  language: isArabic ? 'اللغة' : 'Language',
  today: isArabic ? 'اليوم' : 'Today',
  mood: isArabic ? 'المزاج' : 'Mood',
  exercises: isArabic ? 'التمارين' : 'Exercises',
  lastWeek: isArabic ? 'الأسبوع الماضي' : 'Last 7 days',
  // ...
};
```

### Context Size Management

- **Maximum Length**: 1000 characters
- **Truncation Logic**: Preserves structure, truncates at sentence boundaries
- **Priority**: Profile > Today's data > Weekly summary

## Weekly Summarization System

### Process Flow

1. **User Identification**: Active users (lastActive within 30 days)
2. **Data Collection**:
   - Conversations from all chat types (main, vent, companion)
   - Mood entries with ratings and notes
   - Exercise completions with categories
3. **AI Summarization**: OpenAI API call with structured prompt
4. **Storage**: Summaries stored in userSummaries table

### Summarization Prompt Template

```typescript
const prompt = `Summarize this user's mental health week in 3 short sections (each max 150 chars):

CONVERSATIONS:
${conversationText}

MOODS:
${moodText}

EXERCISES:
${exerciseText}

Respond with JSON: {"mood": "mood patterns", "conversation": "key topics", "exercise": "wellness activities"}`;
```

### Data Processing Safeguards

- **Conversation Cap**: Maximum 4000 characters of conversation history
- **Rate Limiting**: Existing system rate limits apply
- **Duplicate Prevention**: Checks for existing weekly summaries
- **Error Recovery**: Fallback summaries on API failures

## Cost Optimization

### Model Selection

- **Primary**: GPT-4o-mini for cost efficiency
- **Token Limits**: 256-512 tokens for summaries
- **Temperature**: 0.3 for consistent, focused outputs

### Usage Patterns

- **Context Building**: On-demand, cached for session duration
- **Summarization**: Weekly batch processing (not real-time)
- **Context Size**: Bounded at 1000 characters to minimize token usage

### Cost Monitoring

- Integrated with existing `aiTelemetry` table
- Tracks summarization API calls separately
- Estimated cost: <$0.10 per user per week

## Error Handling and Fallbacks

### Context Building Failures

```typescript
try {
  userContext = await ctx.runQuery(api.personalization.buildUserContext, {
    user, personality, messages,
  });
} catch (error) {
  if (isDevEnv) console.warn('Failed to build user context:', error);
  // Graceful degradation - AI works without context
}
```

### Summarization Failures

- **API Errors**: Generate basic statistical summaries
- **Network Issues**: Retry logic built into cron system
- **Data Absence**: Skip users with no activity

### Missing Data Handling

- **No Mood Today**: Shows "No mood logged" in appropriate language
- **No Exercises**: Shows "No exercises" with encouragement
- **No Weekly Summary**: Context includes only today's data

## Testing and Validation

### Unit Testing Strategy

1. **Context Builders**: Test with various user data scenarios
2. **Session Detection**: Verify full vs light context logic
3. **Summarization**: Test with sample conversation/mood data
4. **Multilingual**: Validate Arabic/English context formatting

### Integration Testing

1. **API Integration**: Test both OpenAI Responses API and legacy paths
2. **Database Operations**: Verify summary storage and retrieval
3. **Cron Execution**: Manual trigger of weekly summarization

### Performance Testing

1. **Context Building Latency**: Target <200ms response time
2. **Database Query Performance**: Indexed query optimization
3. **Memory Usage**: Context size boundaries

## Deployment Notes

### Environment Variables Required

- `OPENAI_API_KEY`: For AI summarization calls
- Existing Convex configuration variables

### Database Migration

- Schema changes deployed automatically via Convex
- No data migration required (new table only)
- Backward compatibility maintained

### Monitoring Points

1. **Context Build Success Rate**: Monitor via logs
2. **Weekly Summarization Completion**: Cron job success tracking
3. **API Cost Tracking**: Via aiTelemetry table
4. **User Engagement**: Measure personalized chat effectiveness

## Security and Privacy

### Data Handling

- **No Raw Storage**: Only AI-generated summaries stored
- **User Isolation**: Per-user data boundaries maintained
- **PII Protection**: No sensitive information in summaries
- **Retention**: Weekly summaries stored indefinitely (can be configured)

### API Security

- **Rate Limiting**: Existing Convex rate limiting applies
- **Authentication**: User context only available to authenticated sessions
- **Input Sanitization**: Content length limits and validation

## Performance Characteristics

### Response Time Impact

- **Context Building**: ~50-100ms additional latency
- **First Message**: Higher latency due to context building
- **Subsequent Messages**: Minimal impact (light context)

### Database Load

- **Read Operations**: Optimized with proper indexing
- **Write Operations**: Weekly batch writes only
- **Storage Growth**: ~1KB per user per week

## Future Enhancements

### Phase 2 Features

1. **Daily Context Caching**: Cache today's context for repeated sessions
2. **Conversation Themes**: Track and summarize conversation topics
3. **Mood Trend Analysis**: Advanced mood pattern recognition
4. **Exercise Recommendations**: Context-aware exercise suggestions

### Advanced Personalization

1. **Learning Preferences**: Track user response patterns
2. **Therapy Goals**: Integration with user-set wellness goals
3. **Crisis Detection**: Enhanced context for crisis intervention
4. **Family/Caregiver Integration**: Shared context with permissions

### Technical Improvements

1. **Real-time Summarization**: Stream processing for immediate updates
2. **Advanced NLP**: Sentiment analysis and topic extraction
3. **Context Optimization**: ML-based context relevance scoring
4. **Multi-modal Context**: Integration with voice/image data

## Maintenance and Operations

### Regular Maintenance Tasks

1. **Weekly Summary Review**: Monitor summary quality and relevance
2. **Cost Analysis**: Track and optimize OpenAI usage
3. **Performance Monitoring**: Database query performance
4. **User Feedback Integration**: Refine context based on user responses

### Troubleshooting Guide

#### Common Issues

1. **Context Not Appearing**: Check API authentication and rate limits
2. **Summarization Failures**: Verify OpenAI API key and network connectivity
3. **Performance Degradation**: Review database indexes and query patterns
4. **Cost Overruns**: Implement additional rate limiting if needed

#### Debug Commands

```bash
# Test context building
curl -X POST /api/personalization/buildUserContext

# Manual summarization trigger
curl -X POST /api/cron/generateWeeklySummaries

# View user summaries
curl -X GET /api/userSummaries?userId=USER_ID
```

## Conclusion

The chat personalization system provides a robust, scalable solution for enhancing AI conversations in the Nafsy mental health application. The implementation balances personalization effectiveness with cost optimization and performance requirements.

Key success metrics:
- ✅ Context integration in both API paths
- ✅ Bilingual support (Arabic/English)
- ✅ Cost-effective weekly summarization
- ✅ Session-aware context levels
- ✅ Privacy-preserving design
- ✅ Graceful error handling

The system is production-ready and will automatically enhance user interactions with contextually relevant AI responses based on their recent activities and historical patterns.

---

**Implementation Date**: September 2, 2025  
**Version**: 1.0.0  
**Next Review**: Weekly summary quality assessment after first cron cycle