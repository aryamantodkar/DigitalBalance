import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(''); // To show success or error message

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://192.168.1.11:5000/api/auth/login', { email, password });
      
      const { token } = response.data;
      await AsyncStorage.setItem('userToken', token);
      setUser({ email });
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('http://192.168.1.11:5000/api/auth/register', { name, email, password });
      setMessage(response.data.message);  // Set success message
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');  // Set error message
      console.error('Registration failed:', error.response?.data?.message || error.message);
    }
  };

  const logout = async (navigation) => {
    try {
      // Clear AsyncStorage and user data
      await AsyncStorage.removeItem('userToken');
      setUser(null);
      navigation.navigate('Login'); // Navigate back to the Login screen
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setUser({ token });
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, message }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
