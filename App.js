import { StyleSheet, Text, View } from 'react-native';
import Navbar from './components/Navbar';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [fontsLoaded] = useFonts({
    'MontserratLight': require('./assets/fonts/Montserrat-Light.ttf'),
    'MontserratRegular': require('./assets/fonts/Montserrat-Regular.ttf'),
    'MontserratMedium': require('./assets/fonts/Montserrat-Medium.ttf'),
    'MontserratSemiBold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
    'MontserratBold': require('./assets/fonts/Montserrat-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <Text>Loading Fonts...</Text>;
  }

  return (
    <SafeAreaView edges={['right', 'top', 'left']} style={styles.container}>
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
    // padding: 20,
    // paddingTop: 50
  },
});
