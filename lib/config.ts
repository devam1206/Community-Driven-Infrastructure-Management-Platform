/**
 * API Configuration
 * 
 * This file contains the API endpoint configuration for different environments.
 * Update the IP address below if you're testing on a physical device.
 */

import { Platform } from 'react-native';

// Your computer's IP address (for physical device testing)
// Find your IP by running: ipconfig (Windows) or ifconfig (Mac/Linux)
// NOTE: Your computer's IP changed — update to the IP used on your Wi‑Fi so physical devices can reach the backend.
// Detected current IPv4 on this machine: 10.248.122.227
const YOUR_COMPUTER_IP = '10.45.155.227'; // Update this if needed

// Port where your backend is running
const API_PORT = '4000';

/**
 * Determines the correct API URL based on the platform
 */
export const getApiUrl = (): string => {
  // For production builds, return your production API URL
  // Uncomment and update this when deploying:
  // if (!__DEV__) {
  //   return 'https://your-production-api.com';
  // }

  // Development environment
  if (Platform.OS === 'android') {
    // Physical Android device - use computer's IP address
    // If using Android emulator, change this to: http://10.0.2.2:${API_PORT}
    return `http://${YOUR_COMPUTER_IP}:${API_PORT}`;
  } else if (Platform.OS === 'ios') {
    // Physical iOS device - use computer's IP address
    // If using iOS simulator, change this to: http://localhost:${API_PORT}
    return `http://${YOUR_COMPUTER_IP}:${API_PORT}`;
  } else if (Platform.OS === 'web') {
    // Web uses localhost
    return `http://localhost:${API_PORT}`;
  }

  // Default fallback
  return `http://localhost:${API_PORT}`;
};

// Export the API base URL
export const API_BASE_URL = getApiUrl();

// Log the API URL for debugging (only in development)
if (__DEV__) {
  console.log(`[API Config] Platform: ${Platform.OS}`);
  console.log(`[API Config] API Base URL: ${API_BASE_URL}`);
  console.log(`[API Config] For physical device, use: http://${YOUR_COMPUTER_IP}:${API_PORT}`);
}
