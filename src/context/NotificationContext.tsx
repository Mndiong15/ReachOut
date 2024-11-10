// src/context/NotificationContext.tsx
import React, { createContext, useContext, useEffect } from 'react';
import { useContacts } from './ContactContext';
import { useSettings } from './SettingsContext';
import { contactUpdateEmitter } from './ContactContext';
import {
  initializeNotifications,
  scheduleContactReminder,
  cancelContactReminder,
  cancelAllReminders,
} from '../utils/notifications';

interface NotificationContextType {
  rescheduleAllReminders: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: contactState } = useContacts();
  const { state: settingsState } = useSettings();

  useEffect(() => {
    initializeNotifications();

    // Subscribe to contact updates
    const unsubscribe = contactUpdateEmitter.subscribe(async (contactId) => {
      const contact = contactState.contacts.find(c => c.id === contactId);
      if (contact) {
        if (contact.reminderEnabled && settingsState.globalNotifications) {
          await scheduleContactReminder(contact, settingsState.notificationTime);
        } else {
          cancelContactReminder(contactId);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (settingsState.globalNotifications) {
      rescheduleAllReminders();
    } else {
      cancelAllReminders();
    }
  }, [settingsState.globalNotifications, settingsState.notificationTime]);

  const rescheduleAllReminders = async () => {
    if (!settingsState.globalNotifications) {
      return;
    }

    cancelAllReminders();
    
    for (const contact of contactState.contacts) {
      if (contact.reminderEnabled) {
        await scheduleContactReminder(contact, settingsState.notificationTime);
      }
    }
  };

  return (
    <NotificationContext.Provider value={{
      rescheduleAllReminders,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};