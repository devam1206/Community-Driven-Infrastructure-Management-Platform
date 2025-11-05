import { PrizeCard } from '@/components/PrizeCard';
import { Text } from '@/components/ui/text';
import { getPrizes, getProfile } from '@/lib/api';
import { Prize, User } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { Alert, ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';

type CategoryFilter = 'All' | 'Gift Cards' | 'Experiences' | 'Merchandise' | 'Entertainment';

export default function RewardsScreen() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prizesRes, profileRes] = await Promise.all([
        getPrizes(),
        getProfile()
      ]);

      if (prizesRes.success) {
        setPrizes(prizesRes.prizes);
      }

      if (profileRes.success) {
        setCurrentUser(profileRes.user);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredPrizes =
    selectedCategory === 'All'
      ? prizes
      : prizes.filter((prize) => prize.category === selectedCategory);

  const categories: CategoryFilter[] = ['All', 'Gift Cards', 'Experiences', 'Merchandise', 'Entertainment'];

  const handleRedeem = (prizeTitle: string, pointCost: number) => {
    if (!currentUser || currentUser.points < pointCost) {
      Alert.alert('Insufficient Points', 'You do not have enough points to redeem this reward.');
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Redeem ${prizeTitle} for ${pointCost.toLocaleString()} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () =>
            Alert.alert(
              'Success!',
              `You have successfully redeemed ${prizeTitle}. It will be delivered to your registered address within 5-7 business days.`
            ),
        },
      ]
    );
  };

  if (loading || !currentUser) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-blue-500 dark:bg-blue-600 pt-12 pb-6 px-6 rounded-b-3xl">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white text-2xl font-bold">Rewards</Text>
            <Text className="text-white text-sm opacity-90 mt-1">
              Redeem your hard-earned points
            </Text>
          </View>
          <View className="bg-white rounded-full p-3">
            <Ionicons name="gift" size={28} color="#3B82F6" />
          </View>
        </View>

        {/* Points Balance Card */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                Available Balance
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="star" size={24} color="#F59E0B" />
                <Text className="text-3xl font-bold text-gray-900 dark:text-white ml-2">
                  {currentUser.points.toLocaleString()}
                </Text>
              </View>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                points
              </Text>
            </View>
            <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-full">
              <Text className="text-white font-semibold">Earn More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-6 py-4 max-h-20">
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
            className={`mr-3 px-5 py-2 rounded-full border-2 ${
              selectedCategory === category
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
            }`}>
            <Text
              className={`font-semibold ${
                selectedCategory === category
                  ? 'text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Prizes Grid */}
      <ScrollView className="flex-1 px-6 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            {filteredPrizes.length} Rewards Available
          </Text>
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="filter" size={18} color="#6B7280" />
            <Text className="text-gray-600 dark:text-gray-400 ml-1">Sort</Text>
          </TouchableOpacity>
        </View>

        {filteredPrizes.map((prize) => (
          <PrizeCard
            key={prize.id}
            prize={prize}
            userPoints={currentUser.points}
            onRedeem={() => handleRedeem(prize.title, prize.pointCost)}
          />
        ))}

        {/* How it Works Section */}
        <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 mt-4 mb-6 border border-blue-200 dark:border-blue-800">
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-500 rounded-full p-2 mr-3">
              <Ionicons name="information-circle" size={20} color="white" />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              How It Works
            </Text>
          </View>
          
          <View className="space-y-3">
            <View className="flex-row items-start mb-3">
              <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs font-bold">1</Text>
              </View>
              <Text className="flex-1 text-gray-700 dark:text-gray-300">
                Report infrastructure problems to earn points
              </Text>
            </View>
            
            <View className="flex-row items-start mb-3">
              <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs font-bold">2</Text>
              </View>
              <Text className="flex-1 text-gray-700 dark:text-gray-300">
                Accumulate points as your reports are verified and resolved
              </Text>
            </View>
            
            <View className="flex-row items-start">
              <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs font-bold">3</Text>
              </View>
              <Text className="flex-1 text-gray-700 dark:text-gray-300">
                Redeem points for exclusive rewards and experiences
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
