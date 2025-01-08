import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Navbar from './components/Navbar';
import Login from './screens/AuthStack/Login';
import Register from './screens/AuthStack/Register';
import ProfileSetup from './screens/FirstLoginStack/ProfileSetup';
import TopAppsSetup from './screens/FirstLoginStack/TopAppsSetup';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import axios from 'axios';
import VerificationEmail from './screens/AuthStack/VerificationEmail';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import ScreenLimitSetup from './screens/FirstLoginStack/ScreenLimitSetup';

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: true, // Reanimated runs in strict mode by default
});

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
    <Stack.Screen name="VerificationEmail" component={VerificationEmail} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Navbar" component={Navbar} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const FirstLoginStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ProfileSetup" component={ProfileSetup} options={{ headerShown: false }} />
    <Stack.Screen name="ScreenLimitSetup" component={ScreenLimitSetup} options={{ headerShown: false }} />
    <Stack.Screen name="TopAppsSetup" component={TopAppsSetup} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const [fontsLoaded] = useFonts({
    'InterHeadingExtraLight': require('./assets/fonts/Inter_24pt-ExtraLight.ttf'),
    'InterHeadingLight': require('./assets/fonts/Inter_24pt-Light.ttf'),
    'OutfitRegular': require('./assets/fonts/Inter_24pt-Regular.ttf'),
    'OutfitMedium': require('./assets/fonts/Inter_24pt-Medium.ttf'),
    'OutfitSemiBold': require('./assets/fonts/Inter_24pt-SemiBold.ttf'),
    'InterHeadingBold': require('./assets/fonts/Inter_24pt-Bold.ttf'),
    'OutfitRegular': require('./assets/fonts/Outfit-Regular.ttf'),
    'OutfitMedium': require('./assets/fonts/Outfit-Medium.ttf'),
    'OutfitSemiBold': require('./assets/fonts/Outfit-SemiBold.ttf'),
  });

  const { user, isLoading, isFirstLogin, loadingFirstLogin } = useAuth();
  const [isSplashVisible, setSplashVisible] = useState(true);
  
  if (!fontsLoaded || isLoading || loadingFirstLogin) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#404040" />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      {user ? (isFirstLogin ? <FirstLoginStack /> : <AppStack />) : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fbfa',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
