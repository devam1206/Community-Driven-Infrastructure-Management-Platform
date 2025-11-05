import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { logout, getProfile } from '@/lib/api';
import { User } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useCallback } from 'react';
import { Alert, Image, ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';

export default function ProfileScreen() {
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      if (response.success) {
        setCurrentUser(response.user);
        setDisplayName(response.user.displayName);
        setUsername(response.user.username);
        setAddress(response.user.shippingAddress || '');
        setAvatarUri(response.user.avatarUri || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    Alert.alert('Success', 'Your profile has been updated!', [
      { text: 'OK', onPress: () => setEditMode(false) },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await logout();
            router.replace('/auth');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        } 
      },
    ]);
  };

  if (loading || !currentUser) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-blue-500 dark:bg-blue-600 pt-12 pb-20 px-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">Profile</Text>
          <TouchableOpacity
            onPress={() => setEditMode(!editMode)}
            className="bg-white/20 p-2 rounded-full">
            <Ionicons name={editMode ? 'close' : 'create'} size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Card */}
      <View className="px-6 -mt-12">
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          {/* Avatar */}
          <View className="items-center -mt-16 mb-4">
            <View className="relative">
              <Image
                source={{ uri: avatarUri }}
                className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800"
              />
              {editMode && (
                <TouchableOpacity
                  onPress={pickImage}
                  className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 border-2 border-white dark:border-gray-800">
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* User Info */}
          {editMode ? (
            <View className="space-y-4">
              <View>
                <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Display Name
                </Text>
                <Input
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your name"
                  className="mb-4"
                />
              </View>

              <View>
                <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Username
                </Text>
                <Input
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  className="mb-4"
                />
              </View>

              <View>
                <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Shipping Address
                </Text>
                <Input
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your shipping address"
                  multiline
                  numberOfLines={3}
                  className="mb-4"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>

              <Button onPress={handleSave} className="bg-blue-500 py-3 rounded-xl">
                <Text className="text-white text-center font-bold">Save Changes</Text>
              </Button>
            </View>
          ) : (
            <View>
              <Text className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {displayName}
              </Text>
              <Text className="text-center text-gray-500 dark:text-gray-400 mb-4">
                @{username}
              </Text>

              {/* Stats */}
              <View className="flex-row justify-around py-4 border-t border-b border-gray-200 dark:border-gray-700">
                <View className="items-center">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="star" size={20} color="#F59E0B" />
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white ml-1">
                      {currentUser.points.toLocaleString()}
                    </Text>
                  </View>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">Points</Text>
                </View>

                <View className="items-center">
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    #{currentUser.rank}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">Rank</Text>
                </View>

                <View className="items-center">
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {currentUser.submissions}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">Reports</Text>
                </View>
              </View>

              {/* Shipping Address */}
              {address && (
                <View className="mt-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="location" size={18} color="#6B7280" />
                    <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-2">
                      Shipping Address
                    </Text>
                  </View>
                  <Text className="text-gray-600 dark:text-gray-400 ml-7">{address}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Settings Options */}
      <View className="px-6 mt-6">
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Settings</Text>

        <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center">
              <View className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                <Ionicons name="notifications" size={20} color="#3B82F6" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold">
                Notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center">
              <View className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold">
                Privacy & Security
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center">
              <View className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full mr-3">
                <Ionicons name="help-circle" size={20} color="#9333EA" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold">
                Help & Support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <View className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full mr-3">
                <Ionicons name="information-circle" size={20} color="#6B7280" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold">About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Achievements Section */}
      <View className="px-6 mt-6">
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Achievements
        </Text>

        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-4">
              {/* Achievement Badges */}
              <View className="items-center">
                <View className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full mb-2">
                  <Ionicons name="trophy" size={32} color="#F59E0B" />
                </View>
                <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                  Top 10
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">Contributor</Text>
              </View>

              <View className="items-center">
                <View className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-2">
                  <Ionicons name="flame" size={32} color="#3B82F6" />
                </View>
                <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                  10 Day
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">Streak</Text>
              </View>

              <View className="items-center">
                <View className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-2">
                  <Ionicons name="checkmark-done-circle" size={32} color="#10B981" />
                </View>
                <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                  5 Solved
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">Reports</Text>
              </View>

              <View className="items-center">
                <View className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full mb-2">
                  <Ionicons name="sparkles" size={32} color="#9333EA" />
                </View>
                <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                  Early
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">Adopter</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Logout Button */}
      <View className="px-6 mt-6 mb-8">
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800"
          activeOpacity={0.7}>
          <View className="flex-row items-center justify-center">
            <Ionicons name="log-out" size={20} color="#EF4444" />
            <Text className="text-red-600 dark:text-red-400 font-bold ml-2">Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
