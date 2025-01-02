import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileSetup = ({ navigation }) => {
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);

  const handleNext = () => {
    if (name.trim()) {
      navigation.navigate('ScreentimeSetup');
    } else {
      alert('Please enter your name.');
    }
  };

  const handleImageUpload = () => {
    // Placeholder for image upload logic
    alert('Open image picker here.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>Let's set up your profile</Text>
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={styles.imagePicker} onPress={handleImageUpload}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
          ) : (
            <Ionicons name="camera" size={40} color="#aaa" />
          )}
        </TouchableOpacity>
        <Text style={styles.imagePickerText}>Upload Profile Picture</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
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
  subtitle: { fontSize: 18, color: '#666' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  imagePickerText: { color: '#666', marginBottom: 20 },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: { color: '#fff', fontSize: 16 },
});

export default ProfileSetup;
