import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Easing,Text, ScrollView } from 'react-native';

const WaterClock = ({ screentime, limit }) => {
  const [time, setTime] = useState(new Date());
  const fillPercentage = Math.min(screentime / limit, 1);  // Calculate the fill percentage

  const waterFillAnimation = useRef(new Animated.Value(0)).current;
  const hourHandRotation = useRef(new Animated.Value(0)).current;
  const minuteHandRotation = useRef(new Animated.Value(0)).current;
  const secondHandRotation = useRef(new Animated.Value(0)).current;

  const convertTime = (time) => {
    const hours = Math.floor(time / 60);
    const minutes = Math.floor(time % 60);

    if(hours>0){
      return `${hours}h ${minutes}m`;
    }
    else{
      return `${minutes}m`;
    }
  }

  const todayTime = convertTime(screentime);
  const limitTime = convertTime(limit);
  const remainingTime = convertTime(limit-screentime);

  useEffect(() => {
    // Animate the water fill when fillPercentage changes
    Animated.timing(waterFillAnimation, {
      toValue: fillPercentage,
      duration: 1500,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();

    // Animate hands
    const newHourAngle = (time.getHours() % 12) * 30 + (time.getMinutes() / 60) * 30;
    const newMinuteAngle = time.getMinutes() * 6;
    const newSecondAngle = time.getSeconds() * 6;

    // Animate hour hand
    Animated.timing(hourHandRotation, {
      toValue: newHourAngle,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Animate minute hand
    Animated.timing(minuteHandRotation, {
      toValue: newMinuteAngle,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Animate second hand
    Animated.timing(secondHandRotation, {
      toValue: newSecondAngle,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [fillPercentage, time]);

  // Interpolated color for water fill based on percentage
  const waterFillColor = waterFillAnimation.interpolate({
    inputRange: [0, 0.5, 0.75, 1],
    outputRange: ['#A2C8FF', '#A8D5BA', '#FFB84D', '#FF6F61'], // Soft Blue, Green, Orange, Red
  });

  // Interpolated color for the hands based on percentage
  const handsColor = waterFillAnimation.interpolate({
    inputRange: [0, 0.5, 0.75, 1],
    outputRange: ['#2C3E50', '#4D7C6D', '#E67E22', '#C0392B'], // Dark Gray, Green, Orange, Red
  });

  // Interpolated color for the clock face based on percentage
  const clockFaceColor = waterFillAnimation.interpolate({
    inputRange: [0, 0.5, 0.75, 1],
    outputRange: ['#F2F9FF', '#D8E9E1', '#FCE4C1', '#FBE1DC'], // Light Gray, Greenish, Yellow, Red
  });

  // Interpolated color for the center dot and border based on percentage
  const centerDotColor = waterFillAnimation.interpolate({
    inputRange: [0, 0.5, 0.75, 1],
    outputRange: ['#2C3E50', '#4D7C6D', '#E67E22', '#C0392B'], // Matching the hand colors
  });

  const borderColor = waterFillAnimation.interpolate({
    inputRange: [0, 0.5, 0.75, 1],
    outputRange: ['#B8C9E5', '#A8D5BA', '#FFB84D', '#FF6F61'], // Matching the water color
  });

  // Interpolated shadow color based on fill percentage, using darker tones for visibility
  const shadowColor = waterFillAnimation.interpolate({
    inputRange: [0, 0.5, 0.75, 1],
    outputRange: ['#6C7A89', '#5B8A8C', '#E67E22', '#C0392B'], // Darker Gray, Teal, Orange, Red
  });

  const screentimeTextColor = waterFillAnimation.interpolate({
    inputRange: [0, 0.5, 0.75, 1],
    outputRange: ['#2C3E50', '#4D7C6D', '#E67E22', '#C0392B'], // Matching the hands colors
  });

  return (
    <View style={styles.container}>
      <View style={{display: 'flex',flexDirection: 'column'}}>
        <Animated.View style={[styles.clockFace, { backgroundColor: clockFaceColor, borderColor: borderColor, shadowColor: shadowColor }]}>
          <Animated.View
            style={[
              styles.waterFill,
              {
                height: `${fillPercentage * 100}%`,
                opacity: waterFillAnimation,
                backgroundColor: waterFillColor, // Dynamic color based on fillPercentage
                shadowColor: shadowColor,  // Dynamic shadow color
                shadowOpacity: 0.6,         // Increased shadow opacity for better visibility
                shadowRadius: 18,           // Increased shadow radius for better depth
              },
            ]}
          />

          <Animated.View
            style={[
              styles.centerDot,
              {
                backgroundColor: centerDotColor,  // Dynamic color for center dot
              }
            ]}
          />

          <Animated.View
            style={[
              styles.hand,
              { 
                transform: [{ rotate: hourHandRotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }],
                backgroundColor: handsColor,  // Dynamic color for hour hand
              }
            ]}
          />

          <Animated.View
            style={[
              styles.hand,
              { 
                transform: [{ rotate: minuteHandRotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }],
                backgroundColor: handsColor,  // Dynamic color for minute hand
              }
            ]}
          />

          <Animated.View
            style={[
              styles.secondHand,
              { 
                transform: [{ rotate: secondHandRotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }],
                backgroundColor: handsColor,  // Dynamic color for second hand
              }
            ]}
          />
        </Animated.View>
        <View style={styles.textContainer}>
          <Animated.Text
            style={[
              styles.timeText,
              {
                color: screentimeTextColor, // Apply dynamic color to the screentime text
              },
            ]}
          >
            Today : {todayTime}
          </Animated.Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.limitText}>{remainingTime} left</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'column',
    marginVertical: 20,
    width: '100%'
  },
  clockFace: {
    width: 250,
    height: 250,
    borderWidth: 8,
    borderRadius: 140,
    position: 'relative',
    elevation: 5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden',
    marginBottom: 10
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 0, 
    width: '100%',
    zIndex: 0,
  },
  hand: {
    position: 'absolute',
    width: 6,
    height: 100,
    top: '50%',
    left: '50%',
    transformOrigin: 'bottom',
    marginLeft: -3,
    marginTop: -100,
    borderRadius: 3,
    zIndex: 1,
  },
  secondHand: {
    position: 'absolute',
    width: 2,
    height: 120,
    top: '50%',
    left: '50%',
    transformOrigin: 'bottom',
    marginLeft: -1,
    marginTop: -120,
    borderRadius: 2,
    zIndex: 1,
  },
  centerDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -7 }, { translateY: -7 }],
    zIndex: 1,
  },
  textContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  timeText: {
    fontSize: 25,
    fontFamily: 'MontserratSemiBold',
  },
  limitText: {
    fontSize: 20,
    color: '#636e72', // Subtle gray text
    fontFamily: 'MontserratMedium',
  },
});

export default WaterClock;
