import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(''); // To show success or error message

  const baseURL = 'http://172.20.10.3:5000'; // Replace with your server IP
  
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${baseURL}/api/auth/login`, { email, password });
      const { id, token } = response.data;
      await AsyncStorage.setItem('userToken', token);
      
      setUser({ id, email, token });
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`${baseURL}/api/auth/register`, { name, email, password });
      setMessage(response.data.message); // Set success message
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed'); // Set error message
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

  const submitScreentime = async (screentimeData) => {
    if (!user) {
      throw new Error('User is not logged in');
    }
    try {
      const data = {
        userID: user.id, // Attach the user's ID
        totalScreentime: screentimeData.totalScreentime,
        date: screentimeData.date || new Date().toISOString(), // Default to the current date
        apps: screentimeData.apps,
      };

      const response = await axios.post(`${baseURL}/api/auth/screentime`, data, {
        headers: {
          Authorization: `Bearer ${user.token}`, // Include the auth token
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting screentime:', error.response?.data || error.message);
      throw error;
    }
  };
  
  const fetchScreentime = async (queryDate) => {
    if (!user) {
      throw new Error('User is not logged in');
    }
    try {
      const response = await axios.get(`${baseURL}/api/screentime`, {
        params: { userID: user.id, date: queryDate }, // Query params for specific date or range
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching screentime:', error.response?.data || error.message);
      throw error;
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        message,
        submitScreentime,
        fetchScreentime,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
