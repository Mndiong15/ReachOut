import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@ReachOut:hasCompletedOnboarding';

export const checkOnboardingStatus = async (): Promise<boolean> => {
  try {
    const status = await AsyncStorage.getItem(ONBOARDING_KEY);
    return status === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};