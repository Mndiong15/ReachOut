import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  globalNotifications: boolean;
  notificationTime: string; // 24-hour format HH:mm
  loading: boolean;
  error: string | null;
}

type SettingsAction =
  | { type: 'SET_GLOBAL_NOTIFICATIONS'; payload: boolean }
  | { type: 'SET_NOTIFICATION_TIME'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface SettingsContextType {
  state: SettingsState;
  toggleGlobalNotifications: (enabled: boolean) => Promise<void>;
  setNotificationTime: (time: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const initialState: SettingsState = {
  globalNotifications: true,
  notificationTime: '09:00',
  loading: true,
  error: null,
};

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_GLOBAL_NOTIFICATIONS':
      return { ...state, globalNotifications: action.payload };
    case 'SET_NOTIFICATION_TIME':
      return { ...state, notificationTime: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('settings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        dispatch({ type: 'SET_GLOBAL_NOTIFICATIONS', payload: parsedSettings.globalNotifications });
        dispatch({ type: 'SET_NOTIFICATION_TIME', payload: parsedSettings.notificationTime });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load settings' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const toggleGlobalNotifications = async (enabled: boolean) => {
    try {
      dispatch({ type: 'SET_GLOBAL_NOTIFICATIONS', payload: enabled });
      await AsyncStorage.setItem('settings', JSON.stringify({
        ...state,
        globalNotifications: enabled,
      }));
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update notifications setting' });
    }
  };

  const setNotificationTime = async (time: string) => {
    try {
      dispatch({ type: 'SET_NOTIFICATION_TIME', payload: time });
      await AsyncStorage.setItem('settings', JSON.stringify({
        ...state,
        notificationTime: time,
      }));
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update notification time' });
    }
  };

  return (
    <SettingsContext.Provider value={{ state, toggleGlobalNotifications, setNotificationTime }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};