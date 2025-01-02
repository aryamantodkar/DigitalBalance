import React from 'react';
import { StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Navbar from './components/Navbar';
import Login from './screens/Login';
import Register from './screens/Register';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import VerificationEmail from './screens/VerificationEmail';

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
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

const RootNavigator = () => {
  const [fontsLoaded] = useFonts({
    'InterSubtextExtraLight': require('./assets/fonts/Inter_18pt-ExtraLight.ttf'),
    'InterSubtextLight': require('./assets/fonts/Inter_18pt-Light.ttf'),
    'InterSubtextRegular': require('./assets/fonts/Inter_18pt-Regular.ttf'),
    'InterSubtextSemiBold': require('./assets/fonts/Inter_18pt-SemiBold.ttf'),
    'InterSubtextBold': require('./assets/fonts/Inter_18pt-Bold.ttf'),
    'InterHeadingExtraLight': require('./assets/fonts/Inter_24pt-ExtraLight.ttf'),
    'InterHeadingLight': require('./assets/fonts/Inter_24pt-Light.ttf'),
    'InterHeadingRegular': require('./assets/fonts/Inter_24pt-Regular.ttf'),
    'InterHeadingMedium': require('./assets/fonts/Inter_24pt-Medium.ttf'),
    'InterHeadingSemiBold': require('./assets/fonts/Inter_24pt-SemiBold.ttf'),
    'InterHeadingBold': require('./assets/fonts/Inter_24pt-Bold.ttf'),
  });

  const { user, isLoading } = useAuth();

  // Show loading spinner while fonts or authentication state is being loaded
  if (!fontsLoaded || isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  // Display either the authenticated stack or the unauthenticated stack
  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
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
    backgroundColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
