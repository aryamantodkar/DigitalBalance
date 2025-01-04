import { StyleSheet, SafeAreaView, Text, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LogTime from '../screens/AppStack/LogTime';
import HomePage from '../screens/AppStack/HomePage';
import AccountPage from '../screens/AppStack/AccountPage';
import CustomTabBar from './CustomTabBar';
import { NavigationContainer } from '@react-navigation/native';
import LottieView from 'lottie-react-native'; // Import Lottie
import { Animated } from 'react-native';

const Navbar = () => {
  const Tab = createBottomTabNavigator();
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = new Animated.Value(0); // Initial opacity 0

  // Simulating a loading phase
  useEffect(() => {
    // Fade in text and loader after the component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const loadingTimeout = setTimeout(() => {
      setIsLoading(false); // Hide loader after 3 seconds
    }, 5000);

    return () => clearTimeout(loadingTimeout); // Cleanup timeout if component unmounts
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView
        edges={['right', 'top', 'left']}
        style={styles.loaderContainer}
      >
        {/* Lottie Loader */}
        <LottieView
          source={require('../assets/animations/loader.json')} // Add your Lottie file here
          autoPlay
          loop
          style={styles.loader}
        />
        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.loadingText}>
            Setting things up to help you reduce screen time.
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['right', 'top', 'left']} style={styles.container}>
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
    backgroundColor: '#f9fbfa',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fbfa',
    position: 'relative'
  },
  loader: {
    width: 500,  // Adjust width
    height: 500, // Adjust height
    alignSelf: 'center', // Center the animation
  },
  textContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 20,
    textAlign: 'center',
    color: '#404040',
    fontFamily: 'InterSubtextMedium',  // Customize font if you want
    marginBottom: 20,
  },
});

export default Navbar;
