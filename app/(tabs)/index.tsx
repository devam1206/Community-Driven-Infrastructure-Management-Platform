import { NotificationCard } from '@/components/NotificationCard';
import { StatusTimeline } from '@/components/StatusTimeline';
import { Text } from '@/components/ui/text';
import { getProfile, getNotifications, getComplaints } from '@/lib/api';
import { User, Notification, Submission } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';

export default function HomeScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, notifRes, complaintsRes] = await Promise.all([
        getProfile(),
        getNotifications(),
        getComplaints()
      ]);

      if (profileRes.success) {
        setCurrentUser(profileRes.user);
      }

      if (notifRes.success) {
        setNotifications(notifRes.notifications);
      }

      if (complaintsRes.success) {
        setSubmissions(complaintsRes.complaints);
        if (complaintsRes.complaints.length > 0) {
          setSelectedSubmission(complaintsRes.complaints[0]);
        }
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading || !currentUser) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header with Points */}
      <View className="bg-blue-500 dark:bg-blue-600 pt-12 pb-8 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-white text-lg opacity-90">Welcome back,</Text>
            <Text className="text-white text-2xl font-bold">{currentUser.displayName}</Text>
          </View>
          {currentUser.avatarUri && (
            <Image
              source={{ uri: currentUser.avatarUri }}
              className="w-16 h-16 rounded-full border-2 border-white"
            />
          )}
        </View>

        {/* Points Card */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-md">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-2 mr-3">
                <Ionicons name="star" size={28} color="#F59E0B" />
              </View>
              <View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">Your Points</Text>
                <Text className="text-4xl font-bold text-gray-900 dark:text-white">
                  {currentUser.points.toLocaleString()}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">Rank</Text>
              <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                #{currentUser.rank}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center">
              <Ionicons name="document-text" size={18} color="#6B7280" />
              <Text className="text-gray-600 dark:text-gray-300 ml-2">
                {currentUser.submissions} Submissions
              </Text>
            </View>
            <TouchableOpacity 
              className="bg-blue-500 px-4 py-2 rounded-full"
              onPress={() => router.push('/(tabs)/submissions')}>
              <Text className="text-white font-semibold">View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Recent Notifications */}
      <View className="px-6 mt-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Updates
          </Text>
          <TouchableOpacity>
            <Text className="text-blue-600 dark:text-blue-400 font-semibold">See All</Text>
          </TouchableOpacity>
        </View>

        {notifications.length === 0 ? (
          <Text className="text-gray-500 dark:text-gray-400 text-center py-4">
            No notifications yet
          </Text>
        ) : (
          notifications.slice(0, 2).map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))
        )}
      </View>

      {/* Recent Submission Status */}
      {submissions.length > 0 && selectedSubmission && (
        <View className="px-6 mt-6 mb-8">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Submission Tracking
          </Text>

          {/* Submission Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {submissions.map((submission) => (
              <TouchableOpacity
                key={submission.id}
                onPress={() => setSelectedSubmission(submission)}
                className={`mr-3 rounded-xl overflow-hidden border-2 ${
                  selectedSubmission.id === submission.id
                    ? 'border-blue-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                <Image
                  source={{ uri: submission.imageUri }}
                  className="w-24 h-24"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Selected Submission Details */}
          <View className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700">
            <View className="flex-row items-start mb-4">
              <Image
                source={{ uri: selectedSubmission.imageUri }}
                className="w-20 h-20 rounded-lg mr-4"
                resizeMode="cover"
              />
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <View className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full mr-2">
                    <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                      {selectedSubmission.category}
                    </Text>
                  </View>
                  {selectedSubmission.aiCategorized && (
                    <View className="flex-row items-center bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                      <Ionicons name="sparkles" size={12} color="#9333EA" />
                      <Text className="text-purple-600 dark:text-purple-400 text-xs font-semibold ml-1">
                        AI
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-gray-700 dark:text-gray-300 text-sm" numberOfLines={2}>
                  {selectedSubmission.description}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text className="text-gray-600 dark:text-gray-400 text-sm ml-1">
                    {selectedSubmission.points} points
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Timeline or Rejected Message */}
            {selectedSubmission.status === 'rejected' ? (
              <View className="items-center py-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <View className="bg-red-100 dark:bg-red-900/30 rounded-full p-3 mb-2">
                  <Ionicons name="close-circle" size={40} color="#DC2626" />
                </View>
                <Text className="text-red-600 dark:text-red-400 text-xl font-bold">
                  Rejected
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-center mt-1">
                  This submission was not approved
                </Text>
              </View>
            ) : (
              <StatusTimeline
                statusHistory={selectedSubmission.statusHistory}
                currentStatus={selectedSubmission.status}
              />
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
