import { StyleSheet, Text, View, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LogTime from '../screens/AppStack/LogTime';
import HomePage from '../screens/AppStack/HomePage';
import AccountPage from '../screens/AppStack/AccountPage';
import CustomTabBar from './CustomTabBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingScreen from './LoadingScreen';
import { Animated } from 'react-native';

const Navbar = () => {
  const Tab = createBottomTabNavigator();
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = new Animated.Value(0); // Initial opacity 0

  useEffect(() => {
    // Fade in text and loader after the component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const loadingTimeout = setTimeout(() => {
      setIsLoading(false); // Hide loader after 3 seconds
    }, 3000);

    return () => clearTimeout(loadingTimeout); // Cleanup timeout if component unmounts
  }, []);

  if (isLoading) {
    return (
      <LoadingScreen navigationType='Loading'/>
    );
  }

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} isNavbarVisible={isNavbarVisible} />}
      >
        <Tab.Screen name="Home" component={HomePage} options={{ headerShown: false }} />
        <Tab.Screen
          name="Track"
          options={{ headerShown: false }}
        >
          {(props) => <LogTime {...props} setIsNavbarVisible={setIsNavbarVisible} />}
        </Tab.Screen>
        <Tab.Screen name="Account" component={AccountPage} options={{ headerShown: false }} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Navbar;
