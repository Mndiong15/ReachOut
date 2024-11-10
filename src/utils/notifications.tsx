// src/utils/notifications.ts
import PushNotification, { 
    Importance,
    PushNotificationScheduleObject,
    PushNotificationObject,
    ReceivedNotification,
    PushNotificationPermissions
  } from 'react-native-push-notification';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { Platform } from 'react-native';
  import { Contact, FrequencyType } from '../types/contact';
  import { addDays, addWeeks, addMonths, isPast, parseISO } from 'date-fns';
  
  const CHANNEL_ID = 'reachout-reminders';
  const MONTHLY_NOTIFICATION_PREFIX = '@monthly_notification_';
  
  // Type Definitions
  type RepeatType = 'minute' | 'hour' | 'day' | 'week' | undefined;
  
  interface NotificationData {
    contactId: string;
    notificationTime: string;
  }
  
  interface MonthlyNotificationInfo {
    scheduledDate: string;
    notificationTime: string;
  }
  
  interface ExtendedPushNotificationScheduleObject extends PushNotificationScheduleObject {
    channelId: string;
    data?: NotificationData;
  }
  
  // Helper Functions
  const getNextReachOutDate = (lastReachedOut: string, frequency: FrequencyType): Date => {
    const lastDate = parseISO(lastReachedOut);
    let nextDate: Date;
  
    switch (frequency) {
      case 'daily':
        nextDate = addDays(lastDate, 1);
        break;
      case 'weekly':
        nextDate = addWeeks(lastDate, 1);
        break;
      case 'monthly':
        nextDate = addMonths(lastDate, 1);
        break;
      default:
        throw new Error('Invalid frequency');
    }
  
    while (isPast(nextDate)) {
      switch (frequency) {
        case 'daily':
          nextDate = addDays(nextDate, 1);
          break;
        case 'weekly':
          nextDate = addWeeks(nextDate, 1);
          break;
        case 'monthly':
          nextDate = addMonths(nextDate, 1);
          break;
      }
    }
  
    return nextDate;
  };
  
  const getRepeatType = (frequency: FrequencyType): RepeatType => {
    switch (frequency) {
      case 'daily':
        return 'day';
      case 'weekly':
        return 'week';
      case 'monthly':
        return undefined; // Monthly notifications handled separately
      default:
        return undefined;
    }
  };
  
  // Initialize notifications
  export const initializeNotifications = async (): Promise<void> => {
    PushNotification.configure({
      onRegister: function(token) {
        console.log('TOKEN:', token);
      },
  
      onNotification: function(notification) {
        console.log('NOTIFICATION:', notification);
  
        const handleNotification = async () => {
          const data = notification.data as NotificationData;
          if (data?.contactId) {
            const storageKey = `${MONTHLY_NOTIFICATION_PREFIX}${data.contactId}`;
            try {
              const storedInfo = await AsyncStorage.getItem(storageKey);
              if (storedInfo) {
                const { notificationTime } = JSON.parse(storedInfo);
                // Handle rescheduling if needed
                console.log('Notification received for:', data.contactId, notificationTime);
              }
            } catch (error) {
              console.error('Error handling notification:', error);
            }
          }
        };
  
        handleNotification();
        notification.finish?.('backgroundFetchResultNoData');
      },
  
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
  
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });
  
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: CHANNEL_ID,
          channelName: 'ReachOut Reminders',
          channelDescription: 'Notifications for ReachOut contact reminders',
          playSound: true,
          soundName: 'default',
          importance: Importance.HIGH,
          vibrate: true,
        },
        (created) => console.log(`CreateChannel returned '${created}'`)
      );
    }
  };
  
  // Store monthly notification information
  const storeMonthlyNotification = async (
    contactId: string,
    scheduledDate: string,
    notificationTime: string
  ): Promise<void> => {
    try {
      const storageKey = `${MONTHLY_NOTIFICATION_PREFIX}${contactId}`;
      const notificationInfo: MonthlyNotificationInfo = {
        scheduledDate,
        notificationTime
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(notificationInfo));
    } catch (error) {
      console.error('Error storing monthly notification info:', error);
      throw error;
    }
  };
  
  // Schedule a notification
  export const scheduleContactReminder = async (
    contact: Contact,
    notificationTime: string
  ): Promise<void> => {
    try {
      cancelContactReminder(contact.id);
  
      if (!contact.reminderEnabled) {
        return;
      }
  
      const [hours, minutes] = notificationTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Invalid notification time format');
      }
  
      const nextReachOut = getNextReachOutDate(contact.lastReachedOut, contact.frequency);
      nextReachOut.setHours(hours, minutes, 0, 0);
  
      const notificationData: ExtendedPushNotificationScheduleObject = {
        channelId: CHANNEL_ID,
        id: contact.id,
        title: 'Time to Reach Out! 👋',
        message: `It's time to connect with ${contact.name}`,
        date: nextReachOut,
        allowWhileIdle: true,
        playSound: true,
        soundName: Platform.OS === 'android' ? 'default' : undefined,
        data: {
          contactId: contact.id,
          notificationTime
        },
        repeatType: getRepeatType(contact.frequency),
        repeatTime: 1
      };
  
      if (Platform.OS === 'android') {
        Object.assign(notificationData, {
          smallIcon: 'ic_notification',
          largeIcon: undefined,
          bigText: `It's been a while since you last connected with ${contact.name}. Why not reach out today?`,
          subText: 'Keep in touch!',
          color: '#007AFF',
          vibrate: true,
          vibration: 300,
          priority: 'high',
          visibility: 'public',
          ignoreInForeground: false,
        });
      }
  
      PushNotification.localNotificationSchedule(notificationData);
  
      if (contact.frequency === 'monthly') {
        await storeMonthlyNotification(
          contact.id,
          nextReachOut.toISOString(),
          notificationTime
        );
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  };
  
  // Cancel a specific notification
  export const cancelContactReminder = (contactId: string): void => {
    try {
      PushNotification.cancelLocalNotifications({ id: contactId });
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };
  
  // Cancel all notifications
  export const cancelAllReminders = (): void => {
    try {
      PushNotification.cancelAllLocalNotifications();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  };
  
  // Check notification permissions
  export const checkNotificationPermissions = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS === 'ios') {
        PushNotification.checkPermissions((permissions) => {
          const { alert, badge, sound } = permissions;
          resolve(!!(alert && badge && sound));
        });
      } else {
        resolve(true);
      }
    });
  };
  
  // Request notification permissions
  export const requestNotificationPermissions = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS === 'ios') {
        PushNotification.requestPermissions(['alert', 'badge', 'sound'])
          .then((permissions) => {
            const { alert, badge, sound } = permissions;
            resolve(!!(alert && badge && sound));
          })
          .catch(() => resolve(false));
      } else {
        resolve(true);
      }
    });
  };
  
  // Check for missed notifications
  export const checkMissedNotifications = async (contacts: Contact[]): Promise<void> => {
    try {
      const monthlyContacts = contacts.filter(contact => 
        contact.frequency === 'monthly' && contact.reminderEnabled
      );
      
      for (const contact of monthlyContacts) {
        const storageKey = `${MONTHLY_NOTIFICATION_PREFIX}${contact.id}`;
        const storedInfo = await AsyncStorage.getItem(storageKey);
        
        if (storedInfo) {
          const { scheduledDate, notificationTime } = JSON.parse(storedInfo);
          const lastScheduled = new Date(scheduledDate);
          
          if (isPast(lastScheduled)) {
            await scheduleContactReminder(contact, notificationTime);
          }
        }
      }
    } catch (error) {
      console.error('Error checking missed notifications:', error);
    }
  };
  
  // Get scheduled notifications (debug utility)
  export const getScheduledNotifications = (): Promise<PushNotificationScheduleObject[]> => {
    return new Promise((resolve) => {
      PushNotification.getScheduledLocalNotifications((notifications) => {
        resolve(notifications);
      });
    });
  };
  
  // Reset notification system
  export const resetNotificationSystem = async (): Promise<void> => {
    try {
      cancelAllReminders();
  
      if (Platform.OS === 'android') {
        PushNotification.deleteChannel(CHANNEL_ID);
        
        PushNotification.createChannel(
          {
            channelId: CHANNEL_ID,
            channelName: 'ReachOut Reminders',
            channelDescription: 'Notifications for ReachOut contact reminders',
            playSound: true,
            soundName: 'default',
            importance: Importance.HIGH,
            vibrate: true,
          },
          (created) => console.log(`Notification channel recreated: ${created}`)
        );
      }
    } catch (error) {
      console.error('Error resetting notification system:', error);
      throw error;
    }
  };