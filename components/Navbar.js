import { StyleSheet, Text, View } from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context';
import React, { useState } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LogTime from '../screens/LogTime';
import HomePage from '../screens/HomePage';
import AccountPage from '../screens/AccountPage';
import CustomTabBar from './CustomTabBar';

const Navbar = () => {

    const Tab = createBottomTabNavigator();
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);

    return (
        <SafeAreaView edges={['right', 'top', 'left']} style={{width: '100%',flex:1}}> 
            <NavigationContainer>
                <Tab.Navigator
                    tabBar={(props) => <CustomTabBar {...props} isNavbarVisible={isNavbarVisible} />}
                >
                    <Tab.Screen name="Home" component={HomePage} options={{headerShown: false}}/>
                    <Tab.Screen
                        name="Track"
                        options={{ headerShown: false }}
                    >
                        {(props) => <LogTime {...props} setIsNavbarVisible={setIsNavbarVisible} />}
                    </Tab.Screen>
                    <Tab.Screen name="Account" component={AccountPage} options={{headerShown: false}}/>
                </Tab.Navigator>
            </NavigationContainer>
        </SafeAreaView>
    )
}

export default Navbar

const styles = StyleSheet.create({
    
})