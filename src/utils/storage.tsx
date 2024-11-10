import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../types/contact';
import { validateContact } from './validation';

interface StorageBackup {
  timestamp: string;
  data: string;
}

const BACKUP_KEY = '@ReachOut:backup';
const MAX_BACKUPS = 5;

export const createBackup = async (key: string, data: string) => {
  try {
    // Get existing backups
    const backupsString = await AsyncStorage.getItem(BACKUP_KEY);
    let backups: StorageBackup[] = backupsString ? JSON.parse(backupsString) : [];

    // Add new backup
    const newBackup: StorageBackup = {
      timestamp: new Date().toISOString(),
      data,
    };

    // Keep only the most recent backups
    backups = [newBackup, ...backups.slice(0, MAX_BACKUPS - 1)];

    // Save backups
    await AsyncStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
  } catch (error) {
    console.error('Failed to create backup:', error);
  }
};

export const getLatestValidBackup = async (): Promise<string | null> => {
  try {
    const backupsString = await AsyncStorage.getItem(BACKUP_KEY);
    if (!backupsString) return null;

    const backups: StorageBackup[] = JSON.parse(backupsString);
    
    // Try backups from newest to oldest until we find a valid one
    for (const backup of backups) {
      try {
        const data = JSON.parse(backup.data);
        if (Array.isArray(data)) {
          // Validate each contact in the backup
          data.forEach(validateContact);
          return backup.data;
        }
      } catch (error) {
        continue; // Try next backup if this one is invalid
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to retrieve backup:', error);
    return null;
  }
};