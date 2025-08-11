import React, { useCallback, useMemo } from 'react';
import {
  View,
  ViewStyle,
  FlatListProps,
  FlatList as RNFlatList,
  RefreshControl,
} from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';
import { Text } from './text';

// Generic item interface - all items must have an id
interface ListItem {
  id?: string;
  _id?: string;
  [key: string]: any;
}

// Generic list configuration
interface GenericListConfig<T extends ListItem> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  variant?: 'flash' | 'flat';
  numColumns?: number;
  estimatedItemSize?: number;
  keyExtractor?: (item: T) => string;
  getItemType?: (item: T, index: number) => string;
  emptyMessage?: string;
  emptyComponent?: React.ReactNode | (() => React.ReactNode);
  refreshing?: boolean;
  onRefresh?: () => void;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  className?: string;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
  horizontal?: boolean;
  ItemSeparatorComponent?: React.ComponentType;
  ListHeaderComponent?: React.ComponentType;
  ListFooterComponent?: React.ComponentType;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

// Default key extractor
const defaultKeyExtractor = <T extends ListItem>(item: T): string => {
  return item.id || item._id || String(Math.random());
};

// Default get item type
const defaultGetItemType = <T extends ListItem>(
  _item: T,
  _index: number
): string => {
  return 'default';
};

// Generic empty component
function DefaultEmptyComponent({ message }: { message: string }) {
  return (
    <View className="flex-1 justify-center items-center py-12">
      <Text variant="muted" className="text-center text-muted-foreground">
        {message}
      </Text>
    </View>
  );
}

export function GenericList<T extends ListItem>({
  data,
  renderItem,
  variant = 'flash',
  numColumns = 1,
  estimatedItemSize = 120,
  keyExtractor = defaultKeyExtractor,
  getItemType = defaultGetItemType,
  emptyMessage = 'No items found',
  emptyComponent,
  refreshing = false,
  onRefresh,
  searchable = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  className,
  style,
  contentContainerStyle = {},
  showsVerticalScrollIndicator = false,
  horizontal = false,
  ItemSeparatorComponent,
  ListHeaderComponent,
  ListFooterComponent,
  onEndReached,
  onEndReachedThreshold = 0.1,
}: GenericListConfig<T>) {
  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchable || !searchValue) return data;

    return data.filter((item) => {
      const searchString = searchValue.toLowerCase();
      return Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchString)
      );
    });
  }, [data, searchValue, searchable]);

  // Memoized render function for performance
  const memoizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => renderItem(item, index),
    [renderItem]
  );

  // Empty component
  const EmptyComponent = useMemo(() => {
    if (emptyComponent) {
      const Component =
        typeof emptyComponent === 'function'
          ? emptyComponent
          : () => <>{emptyComponent}</>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- displayName for debugging only
      (Component as any).displayName = 'EmptyComponent';
      return Component;
    }
    const DefaultEmpty = () => <DefaultEmptyComponent message={emptyMessage} />;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- displayName for debugging only
    (DefaultEmpty as any).displayName = 'DefaultEmptyComponent';
    return DefaultEmpty;
  }, [emptyComponent, emptyMessage]);

  // Refresh control
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />;
  }, [refreshing, onRefresh]);

  // Common props for both list types (without style - FlashList doesn't support it)
  const commonProps = {
    data: filteredData,
    keyExtractor,
    showsVerticalScrollIndicator,
    horizontal,
    numColumns: numColumns > 1 ? numColumns : undefined,
    ItemSeparatorComponent,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent: EmptyComponent,
    refreshControl,
    onEndReached,
    onEndReachedThreshold,
    contentContainerStyle: {
      paddingHorizontal: 16,
      paddingBottom: 20,
      ...contentContainerStyle,
    },
  };

  // Container style for wrapper View
  const containerStyle = [{ flex: 1 }, style];

  // Search input
  const SearchInput = useMemo(() => {
    if (!searchable || !onSearchChange) return null;

    return (
      <View className="px-4 pb-3">
        <View className="bg-white rounded-lg border border-gray-200 px-3 py-2">
          <Text
            className="text-gray-700"
            // This would need proper TextInput implementation
          >
            {searchPlaceholder}
          </Text>
        </View>
      </View>
    );
  }, [searchable, onSearchChange, searchPlaceholder]);

  // Render FlashList
  if (variant === 'flash') {
    const flashProps: FlashListProps<T> = {
      ...commonProps,
      renderItem: memoizedRenderItem,
      estimatedItemSize,
      getItemType,
    };

    return (
      <View className={className} style={containerStyle}>
        {SearchInput}
        <FlashList {...flashProps} />
      </View>
    );
  }

  // Render FlatList
  const flatProps: FlatListProps<T> = {
    ...commonProps,
    renderItem: memoizedRenderItem,
  };

  return (
    <View className={className} style={containerStyle}>
      {SearchInput}
      <RNFlatList {...flatProps} />
    </View>
  );
}

// Preset configurations for common use cases
export const ListPresets = {
  // Grid layout (like CategoryGrid)
  grid: {
    variant: 'flash' as const,
    numColumns: 2,
    estimatedItemSize: 200,
    contentContainerStyle: { paddingHorizontal: 8 },
  },

  // Vertical list (like ExerciseList)
  vertical: {
    variant: 'flash' as const,
    numColumns: 1,
    estimatedItemSize: 120,
    contentContainerStyle: { paddingHorizontal: 24 },
  },

  // Chat sessions (FlatList for complex items)
  sessions: {
    variant: 'flat' as const,
    numColumns: 1,
    showsVerticalScrollIndicator: false,
  },
};

// Convenience component with presets
export function GridList<T extends ListItem>(
  props: Omit<
    GenericListConfig<T>,
    'variant' | 'numColumns' | 'estimatedItemSize'
  >
) {
  return <GenericList {...props} {...ListPresets.grid} />;
}

export function VerticalList<T extends ListItem>(
  props: Omit<
    GenericListConfig<T>,
    'variant' | 'numColumns' | 'estimatedItemSize'
  >
) {
  return <GenericList {...props} {...ListPresets.vertical} />;
}

export function SessionList<T extends ListItem>(
  props: Omit<GenericListConfig<T>, 'variant'>
) {
  return <GenericList {...props} {...ListPresets.sessions} />;
}
