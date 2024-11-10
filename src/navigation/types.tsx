import {NativeStackNavigationProp} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  AddContact: undefined;
  Summary: undefined;
  Settings: undefined;
};

export type RootStackNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;
