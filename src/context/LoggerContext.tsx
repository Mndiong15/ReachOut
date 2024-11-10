// src/context/LoggerContext.tsx
import React, { createContext, useContext } from 'react';
import { logger, LogEntry } from '../utils/logger';
import { Share, Alert } from 'react-native';

interface LoggerContextType {
  viewLogs: () => Promise<LogEntry[]>;
  clearLogs: () => Promise<void>;
  shareLogs: () => Promise<void>;
}

const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

export const LoggerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const viewLogs = async () => {
    try {
      return await logger.getLogs(); // Now this is accessible
    } catch (error) {
      Alert.alert('Error', 'Failed to retrieve logs');
      return [];
    }
  };

  const clearLogs = async () => {
    try {
      await logger.clearLogs();
      Alert.alert('Success', 'Logs cleared successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear logs');
    }
  };

  const shareLogs = async () => {
    try {
      const logs = await logger.exportLogs();
      await Share.share({
        message: logs,
        title: 'ReachOut Logs',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share logs');
    }
  };

  return (
    <LoggerContext.Provider value={{ viewLogs, clearLogs, shareLogs }}>
      {children}
    </LoggerContext.Provider>
  );
};

export const useLogs = () => {
  const context = useContext(LoggerContext);
  if (!context) {
    throw new Error('useLogs must be used within a LoggerProvider');
  }
  return context;
};