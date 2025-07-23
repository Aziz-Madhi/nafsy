import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Alert } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import {
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from 'expo-haptics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Store Error Boundary - Catches and handles Zustand store-related errors
 * Prevents app crashes during store initialization, hydration, or state operations
 */
export class StoreErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('StoreErrorBoundary caught an error:', error, errorInfo);

    // Trigger haptic feedback to indicate error
    notificationAsync(NotificationFeedbackType.Error);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to crash analytics (if configured)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Integrate with crash reporting service (Sentry, Bugsnag, etc.)
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
      userAgent: 'React Native',
    };

    console.warn('Store Error Report:', errorReport);
  };

  private handleRetry = () => {
    // Clear error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Provide haptic feedback
    impactAsync(ImpactFeedbackStyle.Medium);
  };

  private handleReportIssue = () => {
    const errorMessage = this.state.error?.message || 'Unknown error occurred';
    const errorStack = this.state.error?.stack || 'No stack trace available';

    Alert.alert(
      'Report Issue',
      'Would you like to report this issue to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            // TODO: Implement issue reporting (email, GitHub, support system)
            console.log('Error report requested:', {
              message: errorMessage,
              stack: errorStack,
            });
          },
        },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View className="flex-1 justify-center items-center p-6 bg-background">
          <View className="bg-white rounded-2xl p-6 shadow-sm max-w-sm w-full">
            {/* Error Icon */}
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-destructive/10 rounded-full items-center justify-center mb-3">
                <Text className="text-2xl">⚠️</Text>
              </View>
              <Text variant="title3" className="text-center font-semibold">
                Something went wrong
              </Text>
            </View>

            {/* Error Description */}
            <Text
              variant="body"
              className="text-center text-muted-foreground mb-6"
            >
              We encountered an issue loading your data. This is usually
              temporary and can be fixed by retrying.
            </Text>

            {/* Error Details (Development only) */}
            {__DEV__ && this.state.error && (
              <View className="bg-gray-100 rounded-lg p-3 mb-4">
                <Text className="text-xs font-mono text-gray-600">
                  {this.state.error.message}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View className="space-y-3">
              <Button onPress={this.handleRetry} className="w-full">
                <Text className="text-white font-medium">Try Again</Text>
              </Button>

              <Button
                variant="outline"
                onPress={this.handleReportIssue}
                className="w-full"
              >
                <Text className="text-primary font-medium">Report Issue</Text>
              </Button>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useStoreErrorHandler = () => {
  const handleStoreError = React.useCallback(
    (error: Error, context?: string) => {
      console.error(`Store Error ${context ? `in ${context}` : ''}:`, error);

      // Trigger haptic feedback
      notificationAsync(NotificationFeedbackType.Error);

      // Could trigger error reporting here
      // reportError(error, context);
    },
    []
  );

  return { handleStoreError };
};

// HOC wrapper for class components
export const withStoreErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <StoreErrorBoundary fallback={fallback}>
      <Component {...props} />
    </StoreErrorBoundary>
  );

  WrappedComponent.displayName = `withStoreErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};
