// src/utils/logger.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  stackTrace?: string;
  deviceInfo: {
    platform: string;
    version: string;
    model?: string;
  };
}

class Logger {
  private static instance: Logger;
  private readonly MAX_LOGS = 1000;
  private readonly LOGS_KEY = '@ReachOut:errorLogs';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: Platform.select({
        ios: 'iOS Device',
        android: 'Android Device',
      }),
    };
  }

  private async storeLogs(logs: LogEntry[]) {
    try {
      await AsyncStorage.setItem(this.LOGS_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store logs:', error);
    }
  }

  // Changed from private to public
  async getLogs(): Promise<LogEntry[]> {
    try {
      const logsString = await AsyncStorage.getItem(this.LOGS_KEY);
      return logsString ? JSON.parse(logsString) : [];
    } catch (error) {
      console.error('Failed to retrieve logs:', error);
      return [];
    }
  }

  async addLog(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, any>,
    error?: Error
  ) {
    try {
      const logs = await this.getLogs();
      const deviceInfo = await this.getDeviceInfo();

      const newLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        deviceInfo,
        stackTrace: error?.stack,
      };

      // Keep only the most recent logs
      const updatedLogs = [newLog, ...logs].slice(0, this.MAX_LOGS);
      await this.storeLogs(updatedLogs);

      // If it's an error, also log to console for development
      if (level === 'error') {
        console.error('Error logged:', {
          message,
          context,
          error,
        });
      }
    } catch (error) {
      console.error('Logging failed:', error);
    }
  }

  async clearLogs() {
    try {
      await AsyncStorage.removeItem(this.LOGS_KEY);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }
}

export const logger = Logger.getInstance();