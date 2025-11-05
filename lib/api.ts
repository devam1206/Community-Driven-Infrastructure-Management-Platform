import AsyncStorage from '@react-native-async-storage/async-storage';
import { LeaderboardEntry, Notification, Prize, Submission, User } from './types';

// API Configuration
// IMPORTANT: Update this based on your environment:
// - For web/iOS simulator: 'http://localhost:4000'
// - For Android emulator: 'http://10.0.2.2:4000'
// - For physical device: 'http://YOUR_COMPUTER_IP:4000' (find via ipconfig/ifconfig)
// TODO: Before deploying to production, replace with your actual API URL
const API_BASE_URL = 'http://localhost:4000';

// Token management
const TOKEN_KEY = '@cdmp_auth_token';

export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// API helper function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add custom headers from options
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'API request failed');
  }

  return data;
}

// Auth APIs
export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  token: string;
  user: User;
  message: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (response.token) {
    await saveToken(response.token);
  }
  
  return response;
};

export const register = async (
  username: string,
  displayName: string,
  email: string,
  password: string
): Promise<RegisterResponse> => {
  const response = await apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, displayName, email, password }),
  });
  
  if (response.token) {
    await saveToken(response.token);
  }
  
  return response;
};

export const logout = async (): Promise<void> => {
  await removeToken();
};

export const getProfile = async (): Promise<{ success: boolean; user: User }> => {
  return apiRequest('/auth/profile');
};

// Complaints APIs
export interface ComplaintsResponse {
  success: boolean;
  complaints: Submission[];
}

export interface ComplaintResponse {
  success: boolean;
  complaint: Submission;
}

export const getComplaints = async (userId?: string): Promise<ComplaintsResponse> => {
  const query = userId ? `?userId=${userId}` : '';
  return apiRequest(`/complaints${query}`);
};

export const getComplaintById = async (id: string): Promise<ComplaintResponse> => {
  return apiRequest(`/complaints/${id}`);
};

export const submitComplaint = async (
  title: string,
  description: string,
  category: string,
  location: string,
  imageUri: string,
  aiCategorized: boolean = false
): Promise<ComplaintResponse> => {
  return apiRequest('/complaints', {
    method: 'POST',
    body: JSON.stringify({
      title,
      description,
      category,
      location,
      imageUri,
      aiCategorized,
    }),
  });
};

// Leaderboard APIs
export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
}

export const getLeaderboard = async (): Promise<LeaderboardResponse> => {
  return apiRequest('/api/leaderboard');
};

// Prizes APIs
export interface PrizesResponse {
  success: boolean;
  prizes: Prize[];
}

export const getPrizes = async (): Promise<PrizesResponse> => {
  return apiRequest('/api/prizes');
};

// Notifications APIs
export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
}

export const getNotifications = async (): Promise<NotificationsResponse> => {
  return apiRequest('/api/notifications');
};
