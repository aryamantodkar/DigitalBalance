import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const AccountPage = () => {
  const { logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = () => {
    logout(navigation); // Call the logout function and pass the navigation prop to navigate after logout
  };
  return (
    <View style={styles.container}>
      <Text>AccountPage</Text>
      <Pressable title="Logout" onPress={handleLogout} >
        <Text>Logout</Text>
      </Pressable>
    </View>
  )
}

export default AccountPage

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})