export type SubmissionStatus = 'submitted' | 'received' | 'in-progress' | 'completed' | 'rejected';

export interface Submission {
  id: string;
  imageUri: string;
  description: string;
  category: string;
  status: SubmissionStatus;
  points: number;
  submittedDate: Date | string;
  department?: string;
  aiCategorized?: boolean;
  rejectionReason?: string;
  latitude?: number;
  longitude?: number;
  statusHistory: {
    status: SubmissionStatus;
    date: Date | string;
    department?: string;
  }[];
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUri?: string;
  points: number;
  rank: number;
  submissions: number;
  shippingAddress?: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  displayName: string;
  avatarUri?: string;
  points: number;
  rank: number;
  submissions: number;
}

export interface Prize {
  id: string;
  title: string;
  description: string;
  imageUri: string;
  pointCost: number;
  category: string;
  available: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: Date | string;
  type: 'info' | 'success' | 'warning';
  submissionId?: string;
}
