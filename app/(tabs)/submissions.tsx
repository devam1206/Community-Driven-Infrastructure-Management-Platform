import { StatusTimeline } from '@/components/StatusTimeline';
import { Text } from '@/components/ui/text';
import { getComplaints, getProfile, submitComplaint } from '@/lib/api';
import { reverseGeocodeNominatim } from '@/lib/geocoding';
import { Submission } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userId) {
      loadSubmissions();
    }
  }, [userId, loadSubmissions]);

  // Refresh submissions whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadSubmissions();
      }
    }, [userId, loadSubmissions])
  );

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
    if (!selectedImage || !description || !selectedCategory || !title) {
      Alert.alert('Missing Information', 'Please fill in all required fields including title.');
      return;
    }

    try {
      setSubmitting(true);
      
      const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || 'Other';
      
      // Use auto location string if manual not provided
      const finalLocation = location || (coords ? `Lat: ${coords.latitude.toFixed(5)}, Lng: ${coords.longitude.toFixed(5)}` : 'Unknown');
      const response = await submitComplaint(
        title,
        description,
        categoryLabel,
        finalLocation,
        selectedImage,
        !!aiSuggestion,
        coords?.latitude,
        coords?.longitude
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
  setCoords(null);
  setGeoError(null);
  setGeoLoading(false);
    setSelectedCategory(null);
    setAiSuggestion(null);
    setMode('list');
  };

  // Acquire location when entering add mode
  useEffect(() => {
    if (mode !== 'add') return;
    let cancelled = false;
  let subscription: Location.LocationSubscription | null = null as Location.LocationSubscription | null;
    (async () => {
      setGeoLoading(true);
      setGeoError(null);
      setAccuracy(null);
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          setGeoError('Location services are disabled');
        }

        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          if (!cancelled) setGeoError('Location permission denied. Enable precise location in Settings for better accuracy.');
          return;
        }

        // Watch position for a few seconds to achieve GPS lock and better accuracy
        const bestForNav = Location.Accuracy.BestForNavigation ?? Location.Accuracy.Highest;
        let bestPosition: Location.LocationObject | null = null;
        const targetAccuracy = 20; // meters

        const done = new Promise<Location.LocationObject | null>(async (resolve) => {
          subscription = await Location.watchPositionAsync(
            { accuracy: bestForNav, timeInterval: 1000, distanceInterval: 0 },
            (pos) => {
              if (cancelled) return;
              const a = pos.coords.accuracy ?? null;
              if (a !== null) setAccuracy(a);
              if (!bestPosition || ((pos.coords.accuracy ?? Infinity) < (bestPosition.coords.accuracy ?? Infinity))) {
                bestPosition = pos;
              }
              if ((pos.coords.accuracy ?? Infinity) <= targetAccuracy) {
                resolve(bestPosition);
              }
            }
          );
          // Timeout after 10s; use best reading so far
          setTimeout(() => resolve(bestPosition), 10000);
        });

        const position = await done;
        if (!position) return;
        if (!cancelled) setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });

        // Reverse geocode to address (platform first, then high-detail fallback)
        let finalAddress: string | null = null;
        try {
          const places = await Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          if (places && places.length > 0) {
            const p = places[0];
            const addressParts = [p.name, p.street, p.subregion, p.region, p.postalCode, p.country].filter(Boolean);
            const platformAddr = addressParts.join(', ');
            finalAddress = platformAddr || null;
          }
        } catch {}

        // If we have good GPS accuracy, attempt Nominatim for more precise address
        if ((position.coords.accuracy ?? 999) < 50) {
          const osmAddress = await reverseGeocodeNominatim(position.coords.latitude, position.coords.longitude);
          if (osmAddress && (!finalAddress || osmAddress.length > finalAddress.length)) {
            finalAddress = osmAddress;
          }
        }

        if (!cancelled) {
          setLocation(finalAddress || `Lat ${position.coords.latitude.toFixed(5)}, Lng ${position.coords.longitude.toFixed(5)}`);
        }
      } catch (err: any) {
        console.warn('Geo error', err);
        if (!cancelled) setGeoError(err.message || 'Failed to get location');
      } finally {
        if (!cancelled) setGeoLoading(false);
  try { subscription?.remove?.(); } catch {}
      }
    })();
  return () => { cancelled = true; try { subscription?.remove?.(); } catch {} };
  }, [mode]);

  if (mode === 'add') {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <ScrollView 
            ref={scrollViewRef}
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
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
              <TouchableOpacity
                onPress={() => setShowTitleModal(true)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 h-12 justify-center">
                <Text className={`${title ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  {title || 'Brief title for the issue...'}
                </Text>
              </TouchableOpacity>
              
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">
                Location (Auto)
              </Text>
              <View className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                {geoLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text className="ml-2 text-gray-500 dark:text-gray-400">Detecting location...</Text>
                  </View>
                ) : geoError ? (
                  <Text className="text-red-600 dark:text-red-400 text-sm">{geoError}</Text>
                ) : location ? (
                  <View>
                    <Text className="text-gray-900 dark:text-white" numberOfLines={2}>{location}</Text>
                    {accuracy !== null && (
                      <Text className="text-xs text-gray-500 mt-1">Accuracy: ~{Math.round(accuracy)} m</Text>
                    )}
                  </View>
                ) : (
                  <Text className="text-gray-400">Location unavailable</Text>
                )}
                <View className="flex-row mt-2">
                  <TouchableOpacity
                    onPress={() => setShowLocationModal(true)}
                    className="bg-blue-500 px-3 py-1 rounded-lg mr-2">
                    <Text className="text-white text-xs">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setMode('add'); }}
                    className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
                    <Text className="text-blue-600 dark:text-blue-400 text-xs">Improve Accuracy</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3 mt-4">
                Description
              </Text>
              <TouchableOpacity
                onPress={() => setShowDescriptionModal(true)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 h-32">
                <Text className={`${description ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  {description || 'Describe the infrastructure problem...'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-blue-500 py-4 rounded-xl items-center"
              disabled={submitting || !selectedImage || !description || !selectedCategory || !title || !location}
              activeOpacity={0.7}>
              <Text className="text-white text-center font-bold text-lg">
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>

        {/* Title Modal */}
        <Modal
          visible={showTitleModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowTitleModal(false)}>
          <KeyboardAvoidingView
            className="flex-1 bg-gray-50 dark:bg-gray-900"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View className="flex-1 pt-12 pb-6 px-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  Title
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTitleModal(false)}
                  className="bg-blue-500 px-4 py-2 rounded-full">
                  <Text className="text-white font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-base text-gray-900 dark:text-white"
                placeholder="Brief title for the issue..."
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Location Modal */}
        <Modal
          visible={showLocationModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowLocationModal(false)}>
          <KeyboardAvoidingView
            className="flex-1 bg-gray-50 dark:bg-gray-900"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View className="flex-1 pt-12 pb-6 px-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  Location
                </Text>
                <TouchableOpacity
                  onPress={() => setShowLocationModal(false)}
                  className="bg-blue-500 px-4 py-2 rounded-full">
                  <Text className="text-white font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-base text-gray-900 dark:text-white"
                placeholder="Where is this issue located?"
                placeholderTextColor="#9CA3AF"
                value={location}
                onChangeText={setLocation}
                autoFocus
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Description Modal */}
        <Modal
          visible={showDescriptionModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowDescriptionModal(false)}>
          <KeyboardAvoidingView
            className="flex-1 bg-gray-50 dark:bg-gray-900"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View className="flex-1 pt-12 pb-6 px-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  Description
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDescriptionModal(false)}
                  className="bg-blue-500 px-4 py-2 rounded-full">
                  <Text className="text-white font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-base text-gray-900 dark:text-white"
                placeholder="Describe the infrastructure problem in detail..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                autoFocus
                style={{ textAlignVertical: 'top' }}
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
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

              {/* Status Timeline or Rejected Message */}
              {submission.status === 'rejected' ? (
                <View className="items-center py-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <View className="bg-red-100 dark:bg-red-900/30 rounded-full p-3 mb-2">
                    <Ionicons name="close-circle" size={40} color="#DC2626" />
                  </View>
                  <Text className="text-red-600 dark:text-red-400 text-xl font-bold">
                    Rejected
                  </Text>
                  {submission.rejectionReason ? (
                    <Text className="text-gray-700 dark:text-gray-300 text-center mt-2">
                      {submission.rejectionReason}
                    </Text>
                  ) : (
                    <Text className="text-gray-600 dark:text-gray-400 text-center mt-1">
                      This submission was not approved
                    </Text>
                  )}
                </View>
              ) : (
                <StatusTimeline
                  statusHistory={submission.statusHistory}
                  currentStatus={submission.status}
                />
              )}
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
