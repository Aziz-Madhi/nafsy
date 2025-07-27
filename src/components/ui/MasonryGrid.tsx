import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { MotiView } from 'moti';

interface MasonryGridProps {
  data: any[];
  renderItem: (item: any, index: number, height: number) => React.ReactNode;
  keyExtractor: (item: any) => string;
  numColumns?: number;
  spacing?: number;
  contentContainerStyle?: any;
}

const { width: screenWidth } = Dimensions.get('window');
const DEFAULT_SPACING = 20;
const DEFAULT_PADDING = 20;

// Predefined height patterns for visual hierarchy with golden ratio
const HEIGHT_PATTERNS = [
  200,
  260,
  220,
  280,
  210,
  240, // Varied heights for visual interest and hierarchy
];

export function MasonryGrid({
  data,
  renderItem,
  keyExtractor,
  numColumns = 2,
  spacing = DEFAULT_SPACING,
  contentContainerStyle,
}: MasonryGridProps) {
  // Calculate item width based on screen size and columns
  const itemWidth =
    (screenWidth - DEFAULT_PADDING * 2 - spacing * (numColumns - 1)) /
    numColumns;

  // Create columns array to track column heights
  const createColumns = () => {
    const columns: { items: any[]; height: number }[] = [];
    for (let i = 0; i < numColumns; i++) {
      columns.push({ items: [], height: 0 });
    }
    return columns;
  };

  // Distribute items across columns for balanced layout
  const distributeItems = () => {
    const columns = createColumns();

    data.forEach((item, index) => {
      // Get height for this item based on pattern
      const itemHeight = HEIGHT_PATTERNS[index % HEIGHT_PATTERNS.length];

      // Find the shortest column
      const shortestColumn = columns.reduce((prev, current) =>
        prev.height < current.height ? prev : current
      );

      // Add item to shortest column
      shortestColumn.items.push({
        data: item,
        originalIndex: index,
        height: itemHeight,
      });
      shortestColumn.height += itemHeight + spacing;
    });

    return columns;
  };

  const columns = distributeItems();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        {
          paddingHorizontal: DEFAULT_PADDING,
          paddingTop: 20,
          paddingBottom: 120,
        },
        contentContainerStyle,
      ]}
    >
      <View style={{ flexDirection: 'row' }}>
        {columns.map((column, columnIndex) => (
          <View
            key={columnIndex}
            style={{
              flex: 1,
              marginRight: columnIndex < numColumns - 1 ? spacing : 0,
            }}
          >
            {column.items.map((item, itemIndex) => (
              <MotiView
                key={keyExtractor(item.data)}
                from={{ opacity: 0, translateY: 40, scale: 0.88 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{
                  type: 'spring',
                  damping: 18,
                  stiffness: 180,
                  delay: item.originalIndex * 80 + columnIndex * 40,
                }}
                style={{
                  marginBottom: spacing,
                  width: itemWidth,
                }}
              >
                {renderItem(item.data, item.originalIndex, item.height)}
              </MotiView>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default MasonryGrid;
