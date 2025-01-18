import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native'; 

const Settings = () => {
    const navigation = useNavigation(); 
  return (
    <View style={styles.container}>
      <View style={{display: 'flex',flexDirection: 'row',justifyContent: 'center',alignItems: 'center',width: '100%',marginTop: 30}}>
        <Pressable onPress={() => navigation.goBack()} style={{position: 'absolute',left: 0,display: 'flex',justifyContent: 'center',alignItems: 'center'}}>
            <FontAwesome6 name="arrow-left" size={24} color="#ddd" />
        </Pressable>
        <Text style={{fontFamily: 'OutfitMedium',color: '#ddd',fontSize: 26}}>Settings</Text>
      </View>
      <View style={{display: 'flex',flexDirection: 'column',marginTop: 30,width: '100%'}}>
        <Pressable style={{width: '100%',backgroundColor: '#171717',padding: 20,borderRadius: 15,display: 'flex',flexDirection: 'row',alignItems: 'center',marginVertical: 15}}>
            <View style={{marginRight: 10}}>
                <AntDesign name="appstore-o" size={18} color="#ddd" />
            </View>
            <Text style={{fontFamily: 'OutfitRegular',fontSize: 16,color: '#ddd'}}>Select Apps to Track</Text>
        </Pressable>
        <Pressable style={{width: '100%',backgroundColor: '#171717',padding: 20,borderRadius: 15,display: 'flex',flexDirection: 'row',alignItems: 'center',marginVertical: 15}}>
            <View style={{marginRight: 10}}>
                <Entypo name="email" size={20} color="#ddd" />
            </View>
            <Text style={{fontFamily: 'OutfitRegular',fontSize: 16,color: '#ddd'}}>Change Email</Text>
        </Pressable>
        <Pressable style={{width: '100%',backgroundColor: '#171717',padding: 20,borderRadius: 15,display: 'flex',flexDirection: 'row',alignItems: 'center',marginVertical: 15}}>
            <View style={{marginRight: 10}}>
                <Entypo name="lock" size={18} color="#ddd" />
            </View>
            <Text style={{fontFamily: 'OutfitRegular',fontSize: 16,color: '#ddd'}}>Change Password</Text>
        </Pressable>
        <Pressable style={{width: '100%',backgroundColor: '#171717',padding: 20,borderRadius: 15,display: 'flex',flexDirection: 'row',alignItems: 'center',marginVertical: 15}}>
            <View style={{marginRight: 10}}>
                <Ionicons name="notifications" size={18} color="#ddd" />
            </View>
            <Text style={{fontFamily: 'OutfitRegular',fontSize: 16,color: '#ddd'}}>Notifications</Text>
        </Pressable>
        <Pressable style={{width: '100%',backgroundColor: '#171717',padding: 20,borderRadius: 15,display: 'flex',flexDirection: 'row',alignItems: 'center',marginVertical: 15}}>
            <View style={{marginRight: 10}}>
                <MaterialIcons name="logout" size={18} color="#ddd" />
            </View>
            <Text style={{fontFamily: 'OutfitRegular',fontSize: 16,color: '#ddd'}}>Log Out</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default Settings

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
        backgroundColor: '#111',
        position: 'relative',
        padding: 25
      },
})