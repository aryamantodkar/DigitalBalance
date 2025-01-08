import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const ProfileSetup = ({ navigation }) => {
  const [profilePicture, setProfilePicture] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const { uploadPicture } = useAuth();

  useEffect(() => {
      Animated.parallel([
          Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
          }),
      ]).start();
  }, []);

  const handleNext = async () => {
    try {
        if (!profilePicture) {
            Alert.alert('Profile Picture Required', 'Please upload a profile picture to proceed.');
            return;
        }

        // Call the uploadPicture function from the auth context
        const response = await uploadPicture(profilePicture);

        if (response) {
            Alert.alert('Success', 'Profile picture uploaded successfully.');
            navigation.navigate('ScreenLimitSetup');
        } else {
            Alert.alert('Upload Failed', 'Failed to upload profile picture. Please try again.');
        }
    } catch (error) {
        console.error('Error uploading profile picture:', error.response?.data?.message || error.message);
        Alert.alert('Error', 'An error occurred during upload. Please try again.');
    }
};

  
  const handleImageUpload = async () => {
    try {
        // Request media library permissions
        const pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
  
        // Handle the result
        if (!pickerResult.canceled) {
            setProfilePicture(pickerResult.assets[0].uri); // Set the selected image
        }
    } catch (error) {
        console.error('Error while picking an image:', error);
    }
  };

  return (
      <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
          <LinearGradient
              colors={['#FBEFEF', '#E7F6F6']}
              style={styles.container}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
          >
              <Animated.View
                  style={[
                      styles.headerContainer,
                      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                  ]}
              >
                  <Text style={styles.title}>Set Up Your Profile</Text>
                  <Text style={styles.subtitle}>
                      Add a profile picture to complete your setup
                  </Text>
              </Animated.View>

              <Animated.View
                  style={[
                      styles.imageContainer,
                      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                  ]}
              >
                  <TouchableOpacity
                      style={styles.imagePicker}
                      onPress={handleImageUpload}
                      activeOpacity={0.8}
                  >
                      {profilePicture ? (
                          <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                      ) : (
                          <Ionicons name="camera" size={50} color="#6D9E9E" />
                      )}
                  </TouchableOpacity>
                  <Text style={styles.imagePickerText}>Tap to upload</Text>
              </Animated.View>

              {/* Conditionally render the Next button */}
              {profilePicture && (
                  <Animated.View
                      style={[
                          styles.buttonContainer,
                          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                      ]}
                  >
                      <Pressable style={styles.nextButton} onPress={handleNext}>
                          <LinearGradient
                              colors={['#6D9E9E', '#8FA8A8']}
                              style={styles.gradientButton}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                          >
                              <Text style={styles.nextButtonText}>Next</Text>
                          </LinearGradient>
                      </Pressable>
                  </Animated.View>
              )}
          </LinearGradient>
      </KeyboardAvoidingView>
  );
};

export default ProfileSetup;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        color: '#4A7676',
        fontFamily: 'InterHeadingBold',
    },
    subtitle: {
        fontSize: 16,
        color: '#6D9E9E',
        textAlign: 'center',
        fontFamily: 'OutfitRegular',
        marginTop: 10,
    },
    imageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    imagePicker: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#FFFFFF88',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    profileImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
    },
    imagePickerText: {
        color: '#6D9E9E',
        marginTop: 15,
        fontSize: 14,
        fontFamily: 'OutfitRegular',
    },
    buttonContainer: {
        alignItems: 'center',
    },
    nextButton: {
        height: 50,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButtonText: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
