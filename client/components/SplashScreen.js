import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';

const SplashScreen = () => {
  const width = Dimensions.get('window').width;
  return (
    <View style={styles.container}>
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
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fbfa',
    width: '100%',
    paddingTop: 20,
    position: 'relative',  // For positioning the elements
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
});
