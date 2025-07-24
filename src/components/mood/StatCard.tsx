import React from 'react';
import { View } from 'react-native';
import { Card } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { LucideIcon } from 'lucide-react-native';
import { cn } from '~/lib/cn';

interface StatCardProps {
  icon: LucideIcon;
  iconColor?: string;
  value: number | string;
  label: string;
  backgroundColor?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  iconColor = '#1E40AF',
  value,
  label,
  backgroundColor = '#DBEAFE',
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn('flex-1 border-0', className)}
      style={{ backgroundColor }}
    >
      <View className="p-5 items-center">
        <Icon size={32} color={iconColor} />
        <Text variant="largeTitle" className="font-bold text-[#5A4A3A]">
          {value}
        </Text>
        <Text variant="subhead" className="text-[#5A4A3A] opacity-70">
          {label}
        </Text>
      </View>
    </Card>
  );
}
