import React from 'react';
import { StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';  // Import Stack Navigator
import Navbar from './components/Navbar';
import Login from './screens/Login';
import Register from './screens/Register'; // Assuming you have a Register screen
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationContainer } from '@react-navigation/native'; // Import NavigationContainer

const Stack = createStackNavigator();

const AppContent = () => {
  const [fontsLoaded] = useFonts({
    'MontserratLight': require('./assets/fonts/Montserrat-Light.ttf'),
    'MontserratRegular': require('./assets/fonts/Montserrat-Regular.ttf'),
    'MontserratMedium': require('./assets/fonts/Montserrat-Medium.ttf'),
    'MontserratSemiBold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
    'MontserratBold': require('./assets/fonts/Montserrat-Bold.ttf'),
  });

  const { user, isLoading } = useAuth();

  // Show loading spinner while fonts are loading or auth state is being checked
  if (!fontsLoaded || isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView edges={['right', 'left']} style={styles.container}>
      {user ? <Navbar /> : null} 
    </KeyboardAvoidingView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer> 
        <Stack.Navigator>
          <Stack.Screen name="Login" component={Login} options={{headerShown: false}}/>
          <Stack.Screen name="Register" component={Register} options={{headerShown: false}}/>
          <Stack.Screen name="UserContent" component={AppContent} options={{headerShown: false}}/>
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f4f4',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
