import React, { memo, useMemo } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { spacing } from '~/lib/design-tokens';

interface SimpleMasonryGridProps {
  data: any[];
  renderItem: (item: any, index: number, height: number) => React.ReactNode;
  keyExtractor: (item: any) => string;
  contentContainerStyle?: any;
  /**
   * Extra horizontal padding already applied by a parent container (e.g. px-6 = 24).
   * This is subtracted from the available width so cards don’t overlap.
   */
  outerHorizontalPadding?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const SIDE_PADDING = 0; // No side padding for edge-to-edge design
const CARD_GAP = spacing.lg; // 24px wide gap between columns for clear separation
const VERTICAL_GAP = spacing.md; // 16px following design system

// Height patterns with slightly more space for movement and reminders cards
const HEIGHT_PATTERNS = [220, 280, 240, 240, 260, 260];

function SimpleMasonryGridComponent({
  data,
  renderItem,
  keyExtractor,
  contentContainerStyle,
  outerHorizontalPadding = 0,
}: SimpleMasonryGridProps) {
  const columnWidth =
    (screenWidth - outerHorizontalPadding * 2 - SIDE_PADDING * 2 - CARD_GAP) /
    2;

  const { leftColumn, rightColumn, containerHeight } = useMemo(() => {
    const left: { item: any; y: number; height: number; index: number }[] = [];
    const right: { item: any; y: number; height: number; index: number }[] = [];

    let leftHeight = 0;
    let rightHeight = 0;

    // True masonry algorithm - place each card in column with least height
    data.forEach((item, index) => {
      const cardHeight = HEIGHT_PATTERNS[index % HEIGHT_PATTERNS.length];

      // Place card in the column with less height (natural masonry flow)
      if (leftHeight <= rightHeight) {
        // Place in left column
        left.push({
          item,
          y: leftHeight,
          height: cardHeight,
          index,
        });
        leftHeight += cardHeight + VERTICAL_GAP;
      } else {
        // Place in right column
        right.push({
          item,
          y: rightHeight,
          height: cardHeight,
          index,
        });
        rightHeight += cardHeight + VERTICAL_GAP;
      }
    });

    return {
      leftColumn: left,
      rightColumn: right,
      containerHeight: Math.max(leftHeight, rightHeight),
    };
  }, [data]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        {
          paddingTop: 0,
          paddingBottom: 100,
          paddingHorizontal: outerHorizontalPadding,
        },
        contentContainerStyle,
      ]}
    >
      <View style={{ height: containerHeight, position: 'relative' }}>
        {/* Left Column */}
        {leftColumn.map((item) => (
          <View
            key={keyExtractor(item.item)}
            style={{
              position: 'absolute',
              left: 0,
              top: item.y,
              width: columnWidth,
              height: item.height,
            }}
          >
            {renderItem(item.item, item.index, item.height)}
          </View>
        ))}

        {/* Right Column */}
        {rightColumn.map((item) => (
          <View
            key={keyExtractor(item.item)}
            style={{
              position: 'absolute',
              right: 0,
              top: item.y,
              width: columnWidth,
              height: item.height,
            }}
          >
            {renderItem(item.item, item.index, item.height)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Memoize component to prevent re-renders when props haven't changed
export const SimpleMasonryGrid = memo(SimpleMasonryGridComponent);

export default SimpleMasonryGrid;
