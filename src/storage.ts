import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MoodLog {
  clarity: number; // 1-100
  anxiety: number; // 1-100
  hopefulness: number; // 1-100
  bodySensations: string[]; // ['Chest', 'Stomach', etc.]
  note?: string; // Optional journaling prompt response
  timestamp: string;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  category: string;
  pros: { text: string; deepened?: string }[];
  cons: { text: string; deepened?: string }[];
  aiInsights: string[];
  initialMood?: {
    clarity: number;
    anxiety: number;
    hopefulness: number;
  };
  outcome?: string;
  outcomeMood?: {
    clarity: number;
    anxiety: number;
    hopefulness: number;
  };
  createdAt: string;
  completedAt?: string;
  chatHistory?: { sender: 'user' | 'assistant'; text: string; timestamp: string }[];
}

export interface UserProfile {
  username: string;
  apiKey: string;
  onboarded: boolean;
}

const KEYS = {
  DECISIONS: '@sanctuary_decisions',
  MOODS: '@sanctuary_moods',
  PROFILE: '@sanctuary_profile',
};

const DEFAULT_PROFILE: UserProfile = {
  username: '',
  apiKey: '',
  onboarded: false,
};

export const Storage = {
  async getDecisions(): Promise<Decision[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.DECISIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load decisions', e);
      return [];
    }
  },

  async saveDecisions(decisions: Decision[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.DECISIONS, JSON.stringify(decisions));
    } catch (e) {
      console.error('Failed to save decisions', e);
    }
  },

  async getMoodLogs(): Promise<MoodLog[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MOODS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load mood logs', e);
      return [];
    }
  },

  async saveMoodLogs(logs: MoodLog[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.MOODS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save mood logs', e);
    }
  },

  async getProfile(): Promise<UserProfile> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PROFILE);
      return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch (e) {
      console.error('Failed to load profile', e);
      return DEFAULT_PROFILE;
    }
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  },

  async resetAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([KEYS.DECISIONS, KEYS.MOODS, KEYS.PROFILE]);
    } catch (e) {
      console.error('Failed to reset storage', e);
    }
  },
};
