import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { login, register } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (loading) return;

    try {
      setLoading(true);

      if (isLogin) {
        // Login validation
        if (!email || !password) {
          Alert.alert('Error', 'Please fill in all fields');
          return;
        }

        const response = await login(email, password);
        
        if (response.success) {
          Alert.alert('Success', 'Logged in successfully!', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') }
          ]);
        }
      } else {
        // Signup validation
        if (!name || !username || !email || !password || !confirmPassword) {
          Alert.alert('Error', 'Please fill in all fields');
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }
        if (password.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters');
          return;
        }

        const response = await register(username, name, email, password);
        
        if (response.success) {
          Alert.alert('Success', 'Account created successfully!', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') }
          ]);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
        {/* Header */}
        <View className="bg-blue-500 dark:bg-blue-600 pt-16 pb-12 px-6 rounded-b-3xl">
          <View className="items-center">
            <View className="bg-white rounded-full p-4 mb-4">
              <Ionicons name="construct" size={48} color="#3B82F6" />
            </View>
            <Text className="text-white text-3xl font-bold">Community</Text>
            <Text className="text-white text-2xl font-bold">Infrastructure</Text>
            <Text className="text-white text-sm opacity-90 mt-2">
              Report. Earn. Redeem. Make a difference.
            </Text>
          </View>
        </View>

        {/* Auth Form */}
        <View className="flex-1 px-6 pt-8">
          {/* Toggle Buttons */}
          <View className="flex-row bg-gray-200 dark:bg-gray-800 rounded-full p-1 mb-6">
            <TouchableOpacity
              onPress={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-full ${
                isLogin ? 'bg-blue-500' : 'bg-transparent'
              }`}>
              <Text
                className={`text-center font-semibold ${
                  isLogin ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-full ${
                !isLogin ? 'bg-blue-500' : 'bg-transparent'
              }`}>
              <Text
                className={`text-center font-semibold ${
                  !isLogin ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </Text>

            {/* Name Field (Sign Up Only) */}
            {!isLogin && (
              <>
                <View className="mb-4">
                  <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                    Full Name
                  </Text>
                  <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3">
                    <Ionicons name="person" size={20} color="#6B7280" />
                    <Input
                      placeholder="Enter your name"
                      value={name}
                      onChangeText={setName}
                      className="flex-1 ml-2 bg-transparent border-0"
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                    Username
                  </Text>
                  <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3">
                    <Ionicons name="at" size={20} color="#6B7280" />
                    <Input
                      placeholder="Choose a username"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      className="flex-1 ml-2 bg-transparent border-0"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Email Field */}
            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Email
              </Text>
              <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3">
                <Ionicons name="mail" size={20} color="#6B7280" />
                <Input
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 ml-2 bg-transparent border-0"
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Password
              </Text>
              <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3">
                <Ionicons name="lock-closed" size={20} color="#6B7280" />
                <Input
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  className="flex-1 ml-2 bg-transparent border-0"
                />
              </View>
            </View>

            {/* Confirm Password Field (Sign Up Only) */}
            {!isLogin && (
              <View className="mb-4">
                <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Confirm Password
                </Text>
                <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3">
                  <Ionicons name="lock-closed" size={20} color="#6B7280" />
                  <Input
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    className="flex-1 ml-2 bg-transparent border-0"
                  />
                </View>
              </View>
            )}

            {/* Forgot Password (Login Only) */}
            {isLogin && (
              <TouchableOpacity className="mb-4">
                <Text className="text-blue-600 dark:text-blue-400 text-right font-semibold">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              className={`py-4 rounded-xl mt-2 ${loading ? 'bg-blue-300' : 'bg-blue-500'}`}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-bold text-lg">
                  {isLogin ? 'Login' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Features Section */}
          <View className="mt-8 mb-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
              Why Join Us?
            </Text>
            
            <View className="space-y-3">
              <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <View className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-3">
                  <Ionicons name="camera" size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    Report Issues
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    Upload photos of infrastructure problems
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mt-3">
                <View className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full mr-3">
                  <Ionicons name="star" size={24} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    Earn Points
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    Get rewarded for verified submissions
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mt-3">
                <View className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-3">
                  <Ionicons name="gift" size={24} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    Redeem Rewards
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    Exchange points for exclusive prizes
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
