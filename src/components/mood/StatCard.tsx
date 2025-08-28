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
      className={cn('flex-1 border border-gray-200', className)}
      style={{
        backgroundColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      <View className="p-6 items-center">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
          style={{
            backgroundColor: iconColor + '20',
            shadowColor: iconColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Icon size={28} color={iconColor} strokeWidth={2.5} />
        </View>
        <Text
          variant="heading"
          className="font-bold text-[#2D3748] mb-1"
          style={{ letterSpacing: 0.5 }}
        >
          {value}
        </Text>
        <Text
          variant="subhead"
          className="text-[#4A5568] font-medium"
          style={{ letterSpacing: 0.2 }}
        >
          {label}
        </Text>
      </View>
    </Card>
  );
}
