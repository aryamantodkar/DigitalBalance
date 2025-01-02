import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Navbar from './components/Navbar';
import Login from './screens/AuthStack/Login';
import Register from './screens/AuthStack/Register';
import ProfileSetup from './screens/FirstLoginStack/ProfileSetup'; // Add screens for first login flow
import ScreentimeSetup from './screens/FirstLoginStack/ScreenLimitSetup';
import TopAppsSetup from './screens/FirstLoginStack/TopAppsSetup';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import axios from 'axios';
import VerificationEmail from './screens/AuthStack/VerificationEmail';

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
    <Stack.Screen name="ScreentimeSetup" component={ScreentimeSetup} options={{ headerShown: false }} />
    <Stack.Screen name="TopAppsSetup" component={TopAppsSetup} options={{ headerShown: false }} />
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
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loadingFirstLogin, setLoadingFirstLogin] = useState(true);

  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        if (user) {
          const response = await axios.get('/api/auth/first-login', {
            headers: {
              Authorization: `Bearer ${user.token}`, // Adjust based on your token logic
            },
          });
          setIsFirstLogin(response.data.firstLogin);
        }
      } catch (error) {
        console.error('Error fetching first login status:', error);
      } finally {
        setLoadingFirstLogin(false);
      }
    };

    checkFirstLogin();
  }, [user]);

  if (!fontsLoaded || isLoading || loadingFirstLogin) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0000ff" />
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
    backgroundColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
