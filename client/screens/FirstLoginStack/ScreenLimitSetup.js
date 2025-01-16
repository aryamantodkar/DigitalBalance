import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const ScreenLimitSetup = ({ navigation }) => {
  const { updateScreenTimeLimit } = useAuth();
  const [limit, setLimit] = useState(2);
  const animatedOpacity = React.useRef(new Animated.Value(0)).current;
  const animatedScale = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.spring(animatedScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNext = async () => {
    try {
      const response = await updateScreenTimeLimit(limit);
      if (response) {
        navigation.navigate('TopAppsSetup');
      }
    } catch (err) {
      // Handle errors (e.g., user not logged in, API errors)
      console.error('Error updating Screen Limit:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  const getGradientColors = () => {
    const gradients = [
      ['#A9DBDB', '#6D9E9E'],
      ['#8FC8C8', '#4F8B8B'],
      ['#78B4B4', '#3A7D7D'],
      ['#5AA3A3', '#296B6B'],
      ['#438C8C', '#1B5A5A'],
    ];
    return gradients[Math.min(Math.floor((limit - 1) / 2), gradients.length - 1)];
  };

  return (
    <LinearGradient
        colors={['#FBEFEF', '#E7F6F6']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            { opacity: animatedOpacity, transform: [{ scale: animatedScale }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Set Your Screentime Limit</Text>
            <Text style={styles.subtitle}>
              Personalize your daily screentime goal for better productivity.
            </Text>
          </View>

          {/* Dynamic Gradient Circle */}
          <View style={styles.circleContainer}>
            <LinearGradient colors={getGradientColors()} style={styles.gradientCircle}>
              <Text style={styles.limitText}>{`${limit} hrs`}</Text>
            </LinearGradient>
          </View>

          {/* Slider */}
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={limit}
            onValueChange={setLimit}
            minimumTrackTintColor="#6D9E9E"
            maximumTrackTintColor="#B4D4D4"
            thumbTintColor="#6D9E9E"
          />

          {/* Next Button */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={getGradientColors()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 28,
    fontWeight: '800',
    color: '#295454',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'OutfitMedium',
    fontSize: 16,
    color: '#5F7E7E',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  circleContainer: {
    marginVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: 240,
    height: 240,
  },
  gradientCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6D9E9E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  limitText: {
    fontFamily: 'OutifitBold',
    fontSize: 54,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  slider: {
    width: '85%',
    marginVertical: 30,
  },
  nextButton: {
    width: '80%',
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 20,
  },
  nextButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 30,
  },
  nextButtonText: {
    fontFamily: 'OutfitBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
});

export default ScreenLimitSetup;
