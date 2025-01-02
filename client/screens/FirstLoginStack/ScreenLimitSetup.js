import React, { useState } from 'react';
import { StyleSheet, View, Text, Slider, TouchableOpacity, SafeAreaView } from 'react-native';

const ScreenLimitSetup = ({ navigation }) => {
  const [limit, setLimit] = useState(2);

  const handleNext = () => {
    navigation.navigate('TopAppsSetup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Your Screentime Limit</Text>
        <Text style={styles.subtitle}>
          Choose how much time you want to spend on your device daily.
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.limitText}>{`${limit} hours`}</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={limit}
          onValueChange={setLimit}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#4CAF50"
        />
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 18, color: '#666', marginBottom: 40 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  limitText: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  slider: { width: '100%', height: 40 },
  nextButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
  },
  nextButtonText: { color: '#fff', fontSize: 16 },
});

export default ScreenLimitSetup;
