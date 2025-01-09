import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode'; // Fix import

export const AuthContext = createContext();

const BASE_URL = 'http://192.168.1.8:5000'; // Replace with your server IP

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loadingFirstLogin,setLoadingFirstLogin] = useState(false);

  // Helper functions for token storage/retrieval
  const storeTokens = async (token, refreshToken) => {
    await AsyncStorage.multiSet([
      ['userToken', token],
      ['refreshToken', refreshToken],
    ]);
  };

  const getStoredTokens = async () => {
    const [token, refreshToken] = await AsyncStorage.multiGet(['userToken', 'refreshToken']);
    return { token: token[1], refreshToken: refreshToken[1] };
  };

  const clearTokens = async () => {
    await AsyncStorage.multiRemove(['userToken', 'refreshToken']);
  };

  const fetchFirstLogin = async () => {
    setLoadingFirstLogin(true); // Start loading only if user exists
    try {
      const response = await checkFirstLogin(user);
      setIsFirstLogin(response?.firstLogin || false);
    } catch (err) {
      console.error("Error fetching first login status:", err);
    } finally {
      setLoadingFirstLogin(false); // Stop loading regardless of the outcome
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
      const { id, token, refreshToken, profilePicture, followers, following } = response.data;

      await storeTokens(token, refreshToken);
      const decodedUser = jwtDecode(token);

      setUser({
        id: decodedUser.id,
        email: decodedUser.email,
        token,
        profilePicture,
        followers,
        following,
      });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Register
  const register = async (name, email, password, profilePicture = '') => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        name,
        email,
        password,
        profilePicture,
      });
      setMessage(response.data.message);

      return {
        success: true,
        userId: response.data.userId,  // Assuming the server returns userId in the response
      };
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
      console.error('Registration failed:', error);

      return {
        success: false,
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await clearTokens();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  };

  // Check Login and Refresh Token
  const isLoggedIn = async () => {
    try {
      const { token, refreshToken } = await getStoredTokens();
      if (!token) {
        setLoading(false);
        return;
      }

      const decodedToken = jwtDecode(token);

      if (Date.now() >= decodedToken.exp * 1000) {
        // Token expired, refresh it
        if (!refreshToken) {
          setLoading(false);
          return;
        }

        const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
          token: refreshToken,
        });

        const { accessToken } = refreshResponse.data;
        await AsyncStorage.setItem('userToken', accessToken);

        const refreshedUser = jwtDecode(accessToken);
        setUser({
          id: refreshedUser.id,
          email: refreshedUser.email,
          token: accessToken,
        });
      } else {
        // Token is valid
        setUser({
          id: decodedToken.id,
          email: decodedToken.email,
          token,
        });
      }
    } catch (error) {
      console.error('Error during login check:', error.message);
      await clearTokens(); // Clear tokens if invalid
    } finally {
      setLoading(false);
    }
  };

  // Submit Screentime
  const submitScreentime = async (screentimeData) => {
    if (!user) throw new Error('User is not logged in');
    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/screentime`,
        { ...screentimeData, userID: user.id },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting screentime:', error.response?.data || error.message);
      throw error;
    }
  };

  // Fetch Screentime
  const fetchScreentime = async () => {
    if (!user) throw new Error('User is not logged in');
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/screentime/${user.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching screentime:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  //Check Verification Email Status
  const checkVerificationStatus = async (userId) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/check-verification`, {
        params: { userId: userId },
      });
      if (response.data.verified) {
        return response.data;
      }
    } catch (err) {
      throw err;
    } 
  };

  //Resend Verification Email
  const handleResend = async ( email ) => {
    setResendLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/resend-verification`, { email: email });
      if (response.data.message) {
        return response.data;
      }
    } catch (err) {
      throw err;
    } 
  };

  const checkFirstLogin = async (user) => {
    try {
      if (user) {
        const response = await axios.get(`${BASE_URL}/api/auth/first-login`, {
          params: {
            user: user
          }
        });

        setIsFirstLogin(response?.data?.firstLogin)
        return response.data;
      }
    } catch (error) {
      throw error;
    } 
  };

  const uploadPicture = async (profilePicture) => {
    if (!user) throw new Error('User is not logged in');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/upload`, {
          userId: user.id,
          profilePicture,
      }, {
          headers: { Authorization: `Bearer ${user.token}` },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading picture:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  const updateFirstLogin = async () => {
    if (!user) throw new Error('User is not logged in');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/set-first-login`, {
          userId: user.id,
      }, {
          headers: { Authorization: `Bearer ${user.token}` },
      });

      setIsFirstLogin(response?.data?.firstLogin)
      return response.data;
    } catch (error) {
      console.error('Error updating first login:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  const updateScreenTimeLimit = async (screenTimeLimit) => {
    if (!user) throw new Error('User is not logged in');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/screenlimit`, {
          userId: user.id,
          screenTimeLimit: screenTimeLimit
      }, {
          headers: { Authorization: `Bearer ${user.token}` },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating screenlimit:', error);
      throw error;
    }
  }

  const updateSelectedApps = async (selectedApps) => {
    if (!user) throw new Error('User is not logged in');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/update-selected-apps`, {
          userId: user.id,
          selectedApps: selectedApps
      }, {
          headers: { Authorization: `Bearer ${user.token}` },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating selected apps:', error);
      throw error;
    }
  }

  const fetchUserDetails = async () => {
    if (!user) throw new Error('User is not logged in');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/user/details`, {
          userId: user.id,
      }, {
          headers: { Authorization: `Bearer ${user.token}` },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating selected apps:', error);
      throw error;
    }
  }

  // Axios Interceptor for Auto Token Refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const { refreshToken } = await getStoredTokens();
            if (!refreshToken) throw new Error('No refresh token found');

            const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
              token: refreshToken,
            });

            const { accessToken } = response.data;
            await AsyncStorage.setItem('userToken', accessToken);

            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            await logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    if (user!=null) {
      fetchFirstLogin();
    }
  }, [user]);

  // Initial Check
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
        checkVerificationStatus,
        handleResend,
        checkFirstLogin,
        uploadPicture,
        updateFirstLogin,
        updateScreenTimeLimit,
        updateSelectedApps,
        isFirstLogin,
        loadingFirstLogin,
        fetchUserDetails
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
