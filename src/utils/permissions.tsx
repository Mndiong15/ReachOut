import { PermissionsAndroid, Platform } from 'react-native';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

export const requestContactsPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'ReachOut needs access to your contacts to help you import them.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const permission = await check(PERMISSIONS.IOS.CONTACTS);
      if (permission === RESULTS.DENIED) {
        const result = await request(PERMISSIONS.IOS.CONTACTS);
        return result === RESULTS.GRANTED;
      }
      return permission === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return false;
  }
};