import { StatusTimeline } from '@/components/StatusTimeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { getComplaints, submitComplaint, getProfile } from '@/lib/api';
import { Submission } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';

const categories = [
  { id: 'road', label: 'Road Maintenance', icon: 'car' as const },
  { id: 'water', label: 'Water Infrastructure', icon: 'water' as const },
  { id: 'lighting', label: 'Street Lighting', icon: 'bulb' as const },
  { id: 'vandalism', label: 'Vandalism', icon: 'warning' as const },
  { id: 'waste', label: 'Waste Management', icon: 'trash' as const },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' as const },
];

export default function SubmissionsScreen() {
  const [mode, setMode] = useState<'list' | 'add'>('list');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userId) {
      loadSubmissions();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const response = await getProfile();
      if (response.success) {
        setUserId(response.user.id);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      // Load user's own submissions only
      if (userId) {
        const response = await getComplaints(userId);
        if (response.success) {
          setSubmissions(response.complaints);
        }
      }
    } catch (error: any) {
      console.error('Error loading submissions:', error);
      Alert.alert('Error', 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
      // Simulate AI categorization
      setTimeout(() => {
        const randomCategory = categories[Math.floor(Math.random() * (categories.length - 1))];
        setAiSuggestion(randomCategory.id);
        setSelectedCategory(randomCategory.id);
      }, 1000);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        // Simulate AI categorization
        setTimeout(() => {
          const randomCategory = categories[Math.floor(Math.random() * (categories.length - 1))];
          setAiSuggestion(randomCategory.id);
          setSelectedCategory(randomCategory.id);
        }, 1000);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage || !description || !selectedCategory || !title || !location) {
      Alert.alert('Missing Information', 'Please fill in all fields including title and location.');
      return;
    }

    try {
      setSubmitting(true);
      
      const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || 'Other';
      
      const response = await submitComplaint(
        title,
        description,
        categoryLabel,
        location,
        selectedImage,
        !!aiSuggestion
      );

      if (response.success) {
        Alert.alert(
          'Success!',
          'Your submission has been received and is being reviewed by the relevant department.',
          [{ text: 'OK', onPress: () => {
            resetForm();
            loadSubmissions(); // Reload submissions
          }}]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit complaint');
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setDescription('');
    setTitle('');
    setLocation('');
    setSelectedCategory(null);
    setAiSuggestion(null);
    setMode('list');
  };

  if (mode === 'add') {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-gray-50 dark:bg-gray-900"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="bg-blue-500 dark:bg-blue-600 pt-12 pb-6 px-6 rounded-b-3xl">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-2xl font-bold">New Submission</Text>
                <Text className="text-white text-sm opacity-90 mt-1">
                  Report an infrastructure issue
                </Text>
              </View>
              <TouchableOpacity
                onPress={resetForm}
                className="bg-white/20 p-2 rounded-full">
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-6 py-6">
            {/* Image Upload */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Upload Photo
              </Text>
              
              {selectedImage ? (
                <View className="relative">
                  <Image
                    source={{ uri: selectedImage }}
                    className="w-full h-64 rounded-xl"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 bg-red-500 rounded-full p-2">
                    <Ionicons name="trash" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={takePhoto}
                    className="flex-1 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 items-center"
                    activeOpacity={0.7}>
                    <View className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-2">
                      <Ionicons name="camera" size={32} color="#3B82F6" />
                    </View>
                    <Text className="text-gray-600 dark:text-gray-300 font-semibold">
                      Take Photo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={pickImage}
                    className="flex-1 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 items-center"
                    activeOpacity={0.7}>
                    <View className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-2">
                      <Ionicons name="images" size={32} color="#3B82F6" />
                    </View>
                    <Text className="text-gray-600 dark:text-gray-300 font-semibold">
                      From Gallery
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Category Selection */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Category
                {aiSuggestion && (
                  <Text className="text-sm font-normal text-purple-600 dark:text-purple-400">
                    {' '}✨ Auto-categorized by AI
                  </Text>
                )}
              </Text>
              
              <View className="flex-row flex-wrap gap-2">
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    className={`flex-row items-center px-4 py-3 rounded-full border-2 ${
                      selectedCategory === category.id
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}>
                    <Ionicons
                      name={category.icon}
                      size={18}
                      color={selectedCategory === category.id ? '#FFFFFF' : '#6B7280'}
                    />
                    <Text
                      className={`ml-2 font-semibold ${
                        selectedCategory === category.id
                          ? 'text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Title
              </Text>
              <Input
                placeholder="Brief title for the issue..."
                value={title}
                onChangeText={setTitle}
                className="mb-4"
              />
              
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Location
              </Text>
              <Input
                placeholder="Where is this issue located?"
                value={location}
                onChangeText={setLocation}
                className="mb-4"
              />

              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Description
              </Text>
              <Input
                placeholder="Describe the infrastructure problem..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                className="h-32 text-base"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Submit Button */}
            <Button
              onPress={handleSubmit}
              className="bg-blue-500 py-4 rounded-xl"
              disabled={submitting || !selectedImage || !description || !selectedCategory || !title || !location}>
              <Text className="text-white text-center font-bold text-lg">
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-blue-500 dark:bg-blue-600 pt-12 pb-6 px-6 rounded-b-3xl">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">My Submissions</Text>
            <Text className="text-white text-sm opacity-90 mt-1">
              {submissions.length} total reports
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setMode('add')}
            className="bg-white rounded-full p-3">
            <Ionicons name="add" size={28} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Submissions List */}
      <ScrollView className="flex-1 px-6 pt-6">
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" className="mt-8" />
        ) : submissions.length === 0 ? (
          <View className="items-center mt-8">
            <Text className="text-gray-500 dark:text-gray-400 text-center">
              No submissions yet. Tap the + button to report an issue!
            </Text>
          </View>
        ) : (
          submissions.map((submission) => (
            <View
              key={submission.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-md border border-gray-200 dark:border-gray-700">
              <View className="flex-row items-start mb-3">
                <Image
                  source={{ uri: submission.imageUri }}
                  className="w-24 h-24 rounded-lg mr-4"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <View className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full mr-2">
                      <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                        {submission.category}
                      </Text>
                    </View>
                    {submission.aiCategorized && (
                      <View className="flex-row items-center bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                        <Ionicons name="sparkles" size={12} color="#9333EA" />
                        <Text className="text-purple-600 dark:text-purple-400 text-xs font-semibold ml-1">
                          AI
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-700 dark:text-gray-300 text-sm mb-2" numberOfLines={2}>
                    {submission.description}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text className="text-gray-600 dark:text-gray-400 text-sm ml-1">
                      {submission.points} points
                    </Text>
                    <Text className="text-gray-400 dark:text-gray-500 text-sm ml-3">
                      {new Date(submission.submittedDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>

              <StatusTimeline
                statusHistory={submission.statusHistory}
                currentStatus={submission.status}
              />
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => setMode('add')}
        className="absolute bottom-6 right-6 bg-blue-500 rounded-full p-4 shadow-lg"
        activeOpacity={0.8}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
