export type FrequencyType = 'daily' | 'weekly' | 'monthly';

export interface PhoneNumber {
  label: string;
  number: string;
}

export interface Contact {
  id: string;
  name: string;
  frequency: FrequencyType;
  lastReachedOut: string;
  reminderEnabled: boolean;
  phoneNumbers: Array<{
    label: string;
    number: string;
  }>  // Array of phone numbers with labels
  email?: string;
  thumbnail?: string;  // Contact photo URI
  deviceContactId?: string;  // ID from device contacts if imported
}

export interface DeviceContact {
  recordID: string;
  givenName: string;
  familyName: string;
  displayName?: string;
  phoneNumbers: Array<{
    label: string;
    number: string;
  }>;
}