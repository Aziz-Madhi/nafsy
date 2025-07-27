import React from 'react';
import { ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EdgeToEdgeScrollViewProps {
  children: React.ReactNode;
}

const { width: screenWidth } = Dimensions.get('window');

export function EdgeToEdgeScrollView({ children }: EdgeToEdgeScrollViewProps) {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#F8F9FA',
      }}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Content with NO extra padding */}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export default EdgeToEdgeScrollView;
