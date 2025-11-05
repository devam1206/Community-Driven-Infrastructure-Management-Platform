import { Text } from '@/components/ui/text';
import { Notification } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface NotificationCardProps {
  notification: Notification;
  onPress?: () => void;
}

const typeConfig = {
  info: { icon: 'information-circle' as const, color: '#3B82F6' },
  success: { icon: 'checkmark-circle' as const, color: '#10B981' },
  warning: { icon: 'warning' as const, color: '#F59E0B' },
};

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const config = typeConfig[notification.type];
  
  // Convert date string to Date object if it's a string
  const notificationDate = typeof notification.date === 'string' 
    ? new Date(notification.date) 
    : notification.date;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm border border-gray-200 dark:border-gray-700"
      activeOpacity={0.7}>
      <View className="flex-row items-start">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${config.color}20` }}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 dark:text-white mb-1">
            {notification.title}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {notification.message}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {notificationDate.toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
