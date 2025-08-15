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
import { useTranslation } from '~/hooks/useTranslation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  translations?: {
    title: string;
    description: string;
    tryAgain: string;
    reportIssue: string;
    alertTitle: string;
    alertMessage: string;
    cancel: string;
    report: string;
  };
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
class StoreErrorBoundaryComponent extends Component<Props, State> {
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
    const { translations } = this.props;
    const errorMessage = this.state.error?.message || 'Unknown error occurred';
    const errorStack = this.state.error?.stack || 'No stack trace available';

    Alert.alert(
      translations?.alertTitle || 'Report Issue',
      translations?.alertMessage ||
        'Would you like to report this issue to help us improve the app?',
      [
        { text: translations?.cancel || 'Cancel', style: 'cancel' },
        {
          text: translations?.report || 'Report',
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

      const { translations } = this.props;

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
                {translations?.title || 'Something went wrong'}
              </Text>
            </View>

            {/* Error Description */}
            <Text
              variant="body"
              className="text-center text-muted-foreground mb-6"
            >
              {translations?.description ||
                'We encountered an issue loading your data. This is usually temporary and can be fixed by retrying.'}
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
                <Text className="text-white font-medium">
                  {translations?.tryAgain || 'Try Again'}
                </Text>
              </Button>

              <Button
                variant="outline"
                onPress={this.handleReportIssue}
                className="w-full"
              >
                <Text className="text-primary font-medium">
                  {translations?.reportIssue || 'Report Issue'}
                </Text>
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

// Wrapper function component that provides translations to the class component
export function StoreErrorBoundary({
  children,
  fallback,
  onError,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}) {
  const { t } = useTranslation();

  const translations = {
    title: t('ui.error.somethingWrong'),
    description: t('ui.error.dataLoadingIssue'),
    tryAgain: t('common.retry'),
    reportIssue: t('ui.error.reportIssue'),
    alertTitle: t('ui.error.reportIssue'),
    alertMessage: t('ui.error.reportQuestion'),
    cancel: t('common.cancel'),
    report: t('ui.error.report'),
  };

  return (
    <StoreErrorBoundaryComponent
      translations={translations}
      fallback={fallback}
      onError={onError}
    >
      {children}
    </StoreErrorBoundaryComponent>
  );
}

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
