// src/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width } = Dimensions.get('window');

export const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/splash.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // or your splash background color
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.5, // Adjust size as needed
    height: width * 0.5,
  },
});