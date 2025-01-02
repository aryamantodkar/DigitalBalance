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
} from 'react-native';

const TopAppsSetup = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApps, setFilteredApps] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const appsPerPage = 20; // Load 20 apps at a time

  const appList = require('../../AppList.json'); // Assuming the JSON file is in the root

  useEffect(() => {
    // Initialize with the first page
    const initialApps = appList.slice(0, appsPerPage);
    setFilteredApps(initialApps);
  }, []);

  const handleLoadMore = () => {
    // Load the next set of apps
    const nextPage = currentPage + 1;
    const startIndex = currentPage * appsPerPage;
    const nextApps = appList.slice(startIndex, startIndex + appsPerPage);
    setFilteredApps((prev) => [...prev, ...nextApps]);
    setCurrentPage(nextPage);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      // Reset to initial apps if search is cleared
      const initialApps = appList.slice(0, currentPage * appsPerPage);
      setFilteredApps(initialApps);
    } else {
      const searchedApps = appList.filter((app) =>
        app.appName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredApps(searchedApps);
    }
  };

  const toggleAppSelection = (app) => {
    setSelectedApps((prev) =>
      prev.includes(app) ? prev.filter((item) => item !== app) : [...prev, app]
    );
  };

  const handleFinish = () => {
    if (selectedApps.length === 3) {
      navigation.replace('Navbar'); // Navigate to the main app
    } else {
      alert('Please select exactly 3 apps.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Top 3 Apps</Text>
        <Text style={styles.subtitle}>Choose the apps you want to track.</Text>
      </View>
      <TextInput
        style={styles.searchBar}
        placeholder="Search apps..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
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
            <Image
              source={{ uri: item.appIconUrl }}
              style={styles.appIcon}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.appName,
                selectedApps.includes(item) && styles.selectedAppName,
              ]}
            >
              {item.appName}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          filteredApps.length < appList.length ? (
            <Text style={styles.loadingText}>Loading more apps...</Text>
          ) : null
        }
      />
      <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
        <Text style={styles.finishButtonText}>Finish</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7', padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 10 },
  searchBar: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  list: { paddingBottom: 20 },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedAppCard: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  appIcon: {
    width: 40,
    height: 40,
    marginRight: 15,
    borderRadius: 8,
  },
  appName: { fontSize: 16, color: '#333', flexShrink: 1 },
  selectedAppName: { color: '#fff' },
  loadingText: { textAlign: 'center', color: '#666', marginVertical: 10 },
  finishButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  finishButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default TopAppsSetup;
