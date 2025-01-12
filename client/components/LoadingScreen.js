import { StyleSheet, Text, View, Dimensions } from 'react-native'
import React, { useState, useEffect } from 'react';
import LottieView from 'lottie-react-native'; // Import Lottie

const LoadingScreen = ({navigationType}) => {
  const width = Dimensions.get('window').width;

  // Set a unique key to force re-render of LottieView when navigationType changes
  const animationKey = `${navigationType}-${Math.random()}`;

  return (
    <View style={styles.loadingContainer}>
        <LottieView
            key={animationKey} // Ensure the animation restarts by changing key
            source={navigationType == 'Loading' ? require('../assets/animations/loader.json') : require('../assets/animations/submitLoader.json')} // Ensure this path is correct
            autoPlay
            loop={navigationType == 'Loading' ? true : false}
            style={{width: width, height: 300, backgroundColor: '#f9fbfa'}}
            speed={1}
        />
        
        <View style={styles.textContainer}>
            {
                navigationType == 'Loading'
                ?
                <Text style={styles.messageText}>Do more things that make you forget to check your phone.</Text>
                :
                <Text style={styles.messageText}>
                    Success! 🎉 Your Screen Time is logged.
                </Text>
            }
        </View>
    </View>
  )
}

export default LoadingScreen

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
})
