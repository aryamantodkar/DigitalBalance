import { StyleSheet, Text, View, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LogTime from '../screens/AppStack/LogTime';
import HomePage from '../screens/AppStack/HomePage';
import AccountPage from '../screens/AppStack/AccountPage';
import CustomTabBar from './CustomTabBar';
import { NavigationContainer } from '@react-navigation/native';
import LottieView from 'lottie-react-native'; // Import Lottie
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Navbar = () => {
  const Tab = createBottomTabNavigator();
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = new Animated.Value(0); // Initial opacity 0
  const width = Dimensions.get('window').width;

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
    }, 4000);

    return () => clearTimeout(loadingTimeout); // Cleanup timeout if component unmounts
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../assets/animations/social_media.json')} // Ensure this path is correct
          autoPlay
          loop
          style={{width: width, height: 300, backgroundColor: '#f9fbfa'}}
          speed={1}
        />
        
        <View style={styles.textContainer}>
          <Text style={styles.messageText}>Do more things that make you forget to check your phone.</Text>
        </View>
      </View>
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
    padding: 15,
    marginTop: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    elevation: 5,  // Slight shadow for elegance
  },
  messageText: {
    fontSize: 16,  // Reduced font size
    fontFamily: 'OutfitRegular',
    textAlign: 'center',
    color: '#00796B', 
    letterSpacing: 1.2,
    paddingHorizontal: 5,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fbfa',
    width: '100%',
    paddingTop: 20,
    position: 'relative', 
  }
});

export default Navbar;
