import React from 'react';
import { Text } from '~/components/ui/text';
import { useTranslation } from '~/hooks/useTranslation';

interface RatingDescriptionProps {
  value: number;
}

export function RatingDescription({ value }: RatingDescriptionProps) {
  const { t } = useTranslation();
  return (
    <Text variant="body" className="text-center">
      {t(`mood.rating.labels.${value}`)}
    </Text>
  );
}

export default RatingDescription;
