import React, { Component, ReactNode } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ClerkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('ClerkErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1 justify-center items-center p-6 gap-4">
            <Text variant="title2" className="text-destructive mb-2">
              Authentication Error
            </Text>
            <Text variant="body" className="text-center text-muted-foreground mb-4">
              There was a problem with the authentication system. This could be due to:
            </Text>
            <View className="items-start mb-4">
              <Text variant="footnote" className="text-muted-foreground">• Network connectivity issues</Text>
              <Text variant="footnote" className="text-muted-foreground">• Configuration problems</Text>
              <Text variant="footnote" className="text-muted-foreground">• Temporary service outage</Text>
            </View>
            <TouchableOpacity 
              onPress={this.handleRetry}
              className="bg-primary px-6 py-3 rounded-lg mt-4"
            >
              <Text variant="callout" className="text-primary-foreground">
                Try Again
              </Text>
            </TouchableOpacity>
            {__DEV__ && this.state.error && (
              <View className="mt-4 p-3 bg-destructive/10 rounded-lg w-full">
                <Text variant="caption2" className="text-destructive font-mono">
                  {this.state.error.message}
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}