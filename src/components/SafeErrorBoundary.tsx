import React, { Component, ReactNode } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from '~/hooks/useTranslation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  translations?: {
    title: string;
    message: string;
    tryAgain: string;
  };
}

interface State {
  hasError: boolean;
  error?: Error;
}

class SafeErrorBoundaryComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SafeErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { translations } = this.props;

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>
              {translations?.title || 'Something went wrong'}
            </Text>
            <Text style={styles.message}>
              {translations?.message ||
                'We encountered an unexpected error. Please try again.'}
            </Text>
            <TouchableOpacity onPress={this.handleRetry} style={styles.button}>
              <Text style={styles.buttonText}>
                {translations?.tryAgain || 'Try Again'}
              </Text>
            </TouchableOpacity>
            {__DEV__ && this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {this.state.error.message || 'Unknown error'}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // background is provided by parent via className tokens
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  errorBox: {
    marginTop: 16,
    padding: 12,
    // bg via wrapper if needed
    borderRadius: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontFamily: 'monospace',
  },
});

// Wrapper function component that provides translations to the class component
export function SafeErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { t } = useTranslation();

  const translations = {
    title: t('ui.error.somethingWrong'),
    message: t('ui.error.unexpectedError'),
    tryAgain: t('common.retry'),
  };

  return (
    <SafeErrorBoundaryComponent translations={translations} fallback={fallback}>
      {children}
    </SafeErrorBoundaryComponent>
  );
}
