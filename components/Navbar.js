import { StyleSheet, Text, View,SafeAreaView } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LogTime from './LogTime';
import HomePage from './HomePage';
import AccountPage from './AccountPage';
import CustomTabBar from './CustomTabBar';

const Navbar = () => {

    const Tab = createBottomTabNavigator();

    return (
        <SafeAreaView style={{width: '100%',flex:1}}> 
            <NavigationContainer>
                <Tab.Navigator
                    tabBar={(props) => <CustomTabBar {...props} />}
                >
                    <Tab.Screen name="Home" component={HomePage} options={{headerShown: false}}/>
                    <Tab.Screen name="Track" component={LogTime} options={{headerShown: false}}/>
                    <Tab.Screen name="Account" component={AccountPage} options={{headerShown: false}}/>
                </Tab.Navigator>
            </NavigationContainer>
        </SafeAreaView>
    )
}

export default Navbar

const styles = StyleSheet.create({
    
})