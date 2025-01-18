import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const LoadingScreen = ({ navigationType }) => {
  const animationRef = useRef(null);
  const width = Dimensions.get('window').width;

  useEffect(() => {
    // Reset the animation when navigationType changes
    if (animationRef.current) {
      animationRef.current.reset();
      animationRef.current.play();
    }
  }, [navigationType]);

  return (
    <View style={styles.loadingContainer}>
      <LottieView
        ref={animationRef}
        source={
          navigationType === 'Loading'
            ? require('../assets/animations/loader.json')
            : require('../assets/animations/submitLoader.json')
        }
        autoPlay
        loop={navigationType === 'Loading'}
        style={{ width: width, height: 300, backgroundColor: '#111' }}
        speed={1}
      />

      <View style={styles.textContainer}>
        {navigationType === 'Loading' ? (
          <Text style={styles.messageText}>
            Do more things that make you forget to check your phone.
          </Text>
        ) : (
          <Text style={styles.messageText}>
            Success! 🎉 Your Screen Time is logged.
          </Text>
        )}
      </View>
    </View>
  );
};

export default LoadingScreen;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textContainer: {
    padding: 15,
    marginTop: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    elevation: 5,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'OutfitRegular',
    textAlign: 'center',
    color: '#ddd',
    letterSpacing: 1.2,
    paddingHorizontal: 5,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    width: '100%',
    paddingTop: 20,
    position: 'relative',
  },
});
