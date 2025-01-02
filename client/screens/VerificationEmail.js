import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const VerificationEmail = ({ route }) => {
  const navigation = useNavigation();
  const { userId, email } = route.params;
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const fadeIn = useState(new Animated.Value(0))[0];
  const refreshingAnimation = useState(new Animated.Value(0))[0];

  const checkVerificationStatus = async () => {
    try {
      const response = await axios.get('http://192.168.1.8:5000/api/auth/check-verification', {
        params: { userId },
      });
      if (response.data.verified) {
        setIsVerified(true);
        setMessage('Email successfully verified! 🎉');
      }
    } catch (err) {
      setError('Failed to check verification status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(refreshingAnimation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    checkVerificationStatus();

    const interval = setInterval(checkVerificationStatus, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (isVerified) {
      const countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            navigation.navigate('Login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isVerified, navigation]);

  const handleResend = async () => {
    setResendLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post('http://192.168.1.8:5000/resend-verification', { email });
      if (response.data.message) {
        setMessage(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const spinnerRotation = refreshingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (loading) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeIn }]}>
        <Animated.View
          style={[styles.spinner, { transform: [{ rotate: spinnerRotation }] }]}
        />
        <Text style={styles.message}>Checking verification status...</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      {isVerified ? (
        <>
          <Text style={styles.success}>{message}</Text>
          <Pressable style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </Pressable>
          <Text style={styles.redirectMessage}>
            You will be redirected to the login page in {redirectCountdown} second
            {redirectCountdown !== 1 ? 's' : ''}.
          </Text>
        </>
      ) : (
        <>
          <Animated.View
            style={[styles.customSpinner, { transform: [{ rotate: spinnerRotation }] }]}
          />
          <Text style={styles.header}>Email Verification Pending</Text>
          <Text style={styles.subHeader}>
            We've sent a verification email to <Text style={styles.email}>{email}</Text>.
          </Text>
          <Text style={styles.info}>Please check your inbox and click the verification link.</Text>
          {resendLoading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <Pressable style={styles.resendButton} onPress={handleResend}>
              <Text style={styles.resendButtonText}>Resend Verification Email</Text>
            </Pressable>
          )}
          {message && <Text style={styles.success}>{message}</Text>}
        </>
      )}
    </Animated.View>
  );
};

export default VerificationEmail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5F8F4',
    padding: 20,
  },
  spinner: {
    width: 50,
    height: 50,
    borderWidth: 5,
    borderRadius: 25,
    borderColor: '#00796B', // Changed to a deeper teal for better theme match
    borderTopColor: 'transparent',
    marginBottom: 20,
  },
  header: {
    fontSize: 25,
    fontWeight: '800',
    color: '#2F4F4F',
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 16,
    color: '#4F9A9A',
    marginBottom: 15,
    textAlign: 'center',
  },
  email: {
    fontWeight: 'bold',
    color: '#00796B',
  },
  info: {
    fontSize: 16,
    color: '#4F9A9A',
    marginBottom: 30,
    textAlign: 'center',
  },
  success: {
    fontSize: 18,
    color: '#43A047',
    marginTop: 20,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 30,
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 12,
    backgroundColor: '#00796B',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  redirectMessage: {
    marginTop: 15,
    fontSize: 16,
    color: '#4F9A9A',
  },
  resendButton: {
    backgroundColor: '#FF7043',
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 12,
    marginBottom: 20,
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  customSpinner: {
    width: 60,
    height: 60,
    borderWidth: 6,
    borderRadius: 30,
    borderColor: '#00796B', // Teal to match the theme
    borderTopColor: 'transparent',
    marginBottom: 30,
  },
});

