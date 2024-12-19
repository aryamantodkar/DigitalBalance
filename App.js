import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Navbar/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f4f4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 20,
    paddingTop: 50
  },
});
