import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable,Image, Animated } from 'react-native';

const HomePage = () => {
 
  return (
    <View style={styles.container}>
      <Text>HomePage</Text>
    </View>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f4f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
