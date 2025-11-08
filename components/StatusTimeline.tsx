import { Text } from '@/components/ui/text';
import { SubmissionStatus } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

interface StatusTimelineProps {
  statusHistory: {
    status: SubmissionStatus;
    date: Date | string;
    department?: string;
  }[];
  currentStatus: SubmissionStatus;
}

const statusConfig = {
  submitted: { label: 'Submitted', icon: 'checkmark-circle' as const },
  received: { label: 'Received', icon: 'mail' as const },
  'in-progress': { label: 'Work Started', icon: 'construct' as const },
  completed: { label: 'Completed', icon: 'checkmark-done-circle' as const },
};

export function StatusTimeline({ statusHistory, currentStatus }: StatusTimelineProps) {
  const statuses: (keyof typeof statusConfig)[] = ['submitted', 'received', 'in-progress', 'completed'];

  // Normalize backend/legacy status values to the set we display
  const normalizeStatus = (s: string | SubmissionStatus) => (s === 'assigned' ? 'received' : s) as keyof typeof statusConfig;

  const getStatusIndex = (status: keyof typeof statusConfig) => statuses.indexOf(status);
  const currentIndex = getStatusIndex(normalizeStatus(currentStatus as string));

  return (
    <View className="py-4">
      {statuses.map((status, index) => {
        const isCompleted = index <= currentIndex;
        const isActive = index === currentIndex;
        const config = statusConfig[status];
  const historyItem = statusHistory.find(h => normalizeStatus(h.status as string) === status);
        
        return (
          <View key={status} className="flex-row items-start mb-4">
            <View className="items-center mr-3">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  isCompleted ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                <Ionicons
                  name={config.icon}
                  size={20}
                  color={isCompleted ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
              {index < statuses.length - 1 && (
                <View
                  className={`w-0.5 h-8 ${
                    isCompleted ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              )}
            </View>
            <View className="flex-1 pt-1">
              <Text
                className={`font-semibold ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : ''
                } ${!isCompleted ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                {config.label}
              </Text>
              {historyItem && (
                <>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(historyItem.date).toLocaleDateString()}
                  </Text>
                  {historyItem.department && (
                    <Text className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                      {historyItem.department}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
