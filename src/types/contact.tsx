export type FrequencyType = 'daily' | 'weekly' | 'monthly';

export interface Contact {
  id: string;
  name: string;
  frequency: FrequencyType;
  lastReachedOut: string; // ISO date string
  reminderEnabled: boolean;
}