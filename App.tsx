import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ContactProvider} from './src/context/ContactContext';
import {HomeScreen} from './src/screens/HomeScreen';
import {AddContactScreen} from './src/screens/AddContactScreen';
import {SummaryScreen} from './src/screens/SummaryScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {RootStackParamList} from './src/navigation/types';
import {SettingsProvider} from './src/context/SettingsContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <SettingsProvider>
      <ContactProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#007AFF',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{title: 'ReachOut'}}
            />
            <Stack.Screen
              name="AddContact"
              component={AddContactScreen}
              options={{title: 'Add Contact'}}
            />
            <Stack.Screen
              name="Summary"
              component={SummaryScreen}
              options={{title: 'Summary'}}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{title: 'Settings'}}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ContactProvider>
    </SettingsProvider>
  );
};

export default App;
