import { LeaderboardItem } from '@/components/LeaderboardItem';
import { Text } from '@/components/ui/text';
import { getLeaderboard, getProfile } from '@/lib/api';
import { LeaderboardEntry, User } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';

type FilterType = 'all' | 'weekly' | 'monthly';

export default function LeaderboardScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [leaderboardRes, profileRes] = await Promise.all([
        getLeaderboard(),
        getProfile()
      ]);

      if (leaderboardRes.success) {
        setLeaderboard(leaderboardRes.leaderboard);
      }

      if (profileRes.success) {
        setCurrentUser(profileRes.user);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
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
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header - Fixed */}
      <View className="bg-blue-500 dark:bg-blue-600 pt-12 pb-6 px-6 rounded-b-3xl">
        <View className="items-center mb-4">
          <Ionicons name="trophy" size={48} color="#FFD700" />
          <Text className="text-white text-3xl font-bold mt-2">Leaderboard</Text>
          <Text className="text-white text-sm opacity-90 mt-1">
            Top community contributors
          </Text>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row bg-white/20 rounded-full p-1">
          {(['all', 'weekly', 'monthly'] as FilterType[]).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setFilter(type)}
              className={`flex-1 py-2 rounded-full ${
                filter === type ? 'bg-white' : ''
              }`}>
              <Text
                className={`text-center font-semibold capitalize ${
                  filter === type ? 'text-blue-600' : 'text-white'
                }`}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="flex-1">
        {/* Your Rank Card */}
        <View className="px-6 pt-6 pb-4">
          <View className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 shadow-lg">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="bg-white rounded-full p-3 mr-3">
                  <Ionicons name="person" size={24} color="#3B82F6" />
                </View>
                <View>
                  <Text className="text-white text-sm opacity-90">Your Rank</Text>
                  <Text className="text-white text-3xl font-bold">#{currentUser.rank}</Text>
                </View>
              </View>
              <View className="items-end">
                <View className="flex-row items-center">
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <Text className="text-white text-2xl font-bold ml-2">
                    {currentUser.points.toLocaleString()}
                  </Text>
                </View>
                <Text className="text-white text-sm opacity-90">points</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top 3 Podium */}
        <View className="px-6 mb-4">
          <View className="flex-row items-end justify-center gap-2 mb-6">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <View className="items-center flex-1" style={{ marginBottom: 20 }}>
                <View className="bg-gray-300 dark:bg-gray-600 rounded-full p-1 mb-2">
                  <Ionicons name="medal" size={24} color="#C0C0C0" />
                </View>
                <View className="bg-white dark:bg-gray-800 rounded-xl p-3 w-full items-center border-2 border-gray-300">
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">#2</Text>
                  <Text className="font-bold text-xs text-center px-1">
                    {leaderboard[1].displayName}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text className="text-xs font-semibold ml-1">
                      {leaderboard[1].points.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* 1st Place */}
            {leaderboard[0] && (
              <View className="items-center flex-1">
                <View className="bg-yellow-400 rounded-full p-1 mb-2">
                  <Ionicons name="medal" size={32} color="#FFD700" />
                </View>
                <View className="bg-gradient-to-b from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl p-4 w-full items-center border-2 border-yellow-400">
                  <Ionicons name="trophy" size={24} color="#FFD700" />
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">#1</Text>
                  <Text className="font-bold text-sm text-center px-1">
                    {leaderboard[0].displayName}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text className="text-sm font-bold ml-1">
                      {leaderboard[0].points.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <View className="items-center flex-1" style={{ marginBottom: 40 }}>
                <View className="bg-orange-300 dark:bg-orange-600 rounded-full p-1 mb-2">
                  <Ionicons name="medal" size={20} color="#CD7F32" />
                </View>
                <View className="bg-white dark:bg-gray-800 rounded-xl p-2 w-full items-center border-2 border-orange-300">
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">#3</Text>
                  <Text className="font-bold text-[10px] text-center px-1">
                    {leaderboard[2].displayName}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="star" size={10} color="#F59E0B" />
                    <Text className="text-xs font-semibold ml-1">
                      {leaderboard[2].points.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Rest of Leaderboard */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            All Rankings
          </Text>
          
          {leaderboard.slice(3).map((entry) => (
            <LeaderboardItem
              key={entry.id}
              entry={entry}
              isCurrentUser={entry.id === currentUser.id}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
