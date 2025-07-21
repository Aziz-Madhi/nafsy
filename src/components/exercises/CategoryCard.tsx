import React from 'react';
import { InteractiveCard } from '~/components/ui/InteractiveCard';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
  };
  onPress: (categoryId: string) => void;
  index: number;
}

export const CategoryCard = React.memo(function CategoryCard({
  category,
  onPress,
  index,
}: CategoryCardProps) {
  return (
    <InteractiveCard
      title={category.name}
      description={category.description}
      iconType="category"
      iconName={category.icon}
      color={category.color}
      onPress={() => onPress(category.id)}
      index={index}
      variant="category"
      style={{
        height: 200,
        width: '100%',
      }}
    />
  );
});
