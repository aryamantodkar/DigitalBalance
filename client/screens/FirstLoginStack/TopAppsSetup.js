import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  Animated,
  Pressable,
  Vibration, // Import the Vibration API
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const TopAppsSetup = ({ navigation }) => {
  const { updateFirstLogin, updateSelectedApps } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApps, setFilteredApps] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const appsPerPage = 20;

  const appList = require('../../AppList.json'); // Assuming the JSON file is in the root

  useEffect(() => {
    const initialApps = appList.slice(0, appsPerPage);
    setFilteredApps(initialApps);

    // Fade-in effect for the page load
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      const initialApps = appList.slice(0, appsPerPage);
      setFilteredApps(initialApps);
    } else {
      const searchedApps = appList.filter((app) =>
        app.appName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredApps(searchedApps);
    }
  };

  const toggleAppSelection = (app) => {
    if (selectedApps.includes(app)) {
      setSelectedApps(selectedApps.filter((item) => item !== app));
    } else if (selectedApps.length < 3) {
      setSelectedApps([...selectedApps, app]);
    } else {
      // Trigger vibration and show a message when trying to select more than 3 apps
      Vibration.vibrate(500); // Vibrate for 500ms
      alert('You can only select 3 apps.'); // Show an alert
    }
  };

  const handleFinish = async () => {
    try {
      if (selectedApps.length === 3) {
        // First, call setSelectedApps to update the user's selected apps
        const appsResponse = await updateSelectedApps(selectedApps);
        console.log("apps",appsResponse)
        
        if (appsResponse) {
          // If updating selected apps was successful, proceed to update firstLogin
          const firstLoginResponse = await updateFirstLogin();
          
          if (firstLoginResponse) {
            // If successful, navigate to the Navbar screen
            navigation.navigate('Navbar');
          }
        }
      } else {
        alert('Please select exactly 3 apps.');
      }
    } catch (err) {
      // Handle errors (e.g., user not logged in, API errors)
      console.error('Error during finish process:', err);
      alert('Something went wrong. Please try again.');
    }
  };
  

  return (
    <LinearGradient
      colors={['#FBEFEF', '#E7F6F6']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView edges={['right', 'left']} style={styles.container}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Choose Your Top Apps</Text>
          <Text style={styles.subtitle}>Select your 3 favorite apps.</Text>
        </Animated.View>

        <TextInput
          style={styles.searchBar}
          placeholder="Search apps..."
          value={searchQuery}
          onChangeText={handleSearch}
        />

        <Text style={styles.countText}>
          {selectedApps.length}/3 apps selected
        </Text>

        <FlatList
          data={filteredApps}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.appCard,
                selectedApps.includes(item) && styles.selectedAppCard,
              ]}
              onPress={() => toggleAppSelection(item)}
            >
              <Image source={{ uri: item.appIconUrl }} style={styles.appIcon} />
              <Text style={styles.appName}>{item.appName}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />

        <Pressable style={styles.finishButton} onPress={handleFinish}>
          <LinearGradient
            colors={['#6D9E9E', '#A7C5C5']}
            style={styles.buttonGradient}
          >
            <Text style={styles.finishButtonText}>Finish</Text>
          </LinearGradient>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    marginVertical: 30,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2F3C4F',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A9B5',
    textAlign: 'center',
  },
  searchBar: {
    width: '95%',
    height: 50,
    backgroundColor: '#F9FAFB',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginVertical: 15,
    fontSize: 16,
    shadowColor: '#404040',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  countText: {
    fontSize: 16,
    color: '#A1A9B5',
    marginBottom: 10,
  },
  list: {
    width: '100%',
    paddingBottom: 40,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#404040',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    minWidth: '95%',
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 15,
  },
  appName: {
    fontSize: 16,
    color: '#2F3C4F',
  },
  selectedAppCard: {
    backgroundColor: '#D1F2E2', // Soft light green background
    shadowColor: '#404040',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  finishButton: {
    width: '90%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  finishButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default TopAppsSetup;
