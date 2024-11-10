// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from 'react-native-splash-screen';
import { RootStackParamList } from './src/navigation/types';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { TabNavigator } from './src/navigation/TabNavigator';
import { ContactProvider } from './src/context/ContactContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { checkOnboardingStatus } from './src/utils/onboarding';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const status = await checkOnboardingStatus();
        setHasCompletedOnboarding(status);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        SplashScreen.hide();
      }
    };

    init();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <SettingsProvider>
      <ContactProvider>
        <NotificationProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                animation: 'fade',
              }}
              initialRouteName={hasCompletedOnboarding ? "MainTabs" : "Onboarding"}
            >
              <Stack.Screen 
                name="Onboarding" 
                component={OnboardingScreen} 
              />
              <Stack.Screen 
                name="MainTabs" 
                component={TabNavigator} 
              />
            </Stack.Navigator>
          </NavigationContainer>
        </NotificationProvider>
      </ContactProvider>
    </SettingsProvider>
  );
};

export default App;