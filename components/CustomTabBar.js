import { StyleSheet, Text, View,TouchableOpacity,Animated} from 'react-native'
import React, {useState,useEffect} from 'react'
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';


const CustomTabBar = ({ state, descriptors, navigation }) => {
    const [circlePosition] = useState(new Animated.Value(0)); // Circle position
    const [circleSize] = useState(new Animated.Value(45)); // Circle size

    const icons = [
        <Ionicons name="home-outline" size={25} color="gray" />,
        <Entypo name="plus" size={25} color="gray" />,
        <AntDesign name="user" size={25} color="gray" />
    ]

    const iconsFocused = [
        <Entypo name="home" size={25} color="black" />,
        <Entypo name="plus" size={25} color="black" />,
        <Ionicons name="person" size={25} color="black" />
    ]

    useEffect(() => {
        // Update circle position based on focused tab index
        Animated.spring(circlePosition, {
            toValue: state.index==0 ? state.index * (100) + 5 : (state.index==1 ? state.index * (100) : state.index * (98)), // Adjust this based on your layout
            useNativeDriver: false,
        }).start();
        
    }, [state.index]);

    return (
        <View style={styles.customTabBar}>
            <Animated.View
                style={[
                    styles.circle,
                    {
                        transform: [{ translateX: circlePosition }],
                        width: circleSize,
                        height: circleSize,
                        borderRadius: circleSize.interpolate({
                            inputRange: [50, 60],
                            outputRange: [25, 30], // Half of the size for border radius
                        }),
                    },
                ]}
            />
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                    
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        style={[
                        styles.tabButton,
                        isFocused ? styles.activeTab : styles.inactiveTab,
                        ]}
                    >   
                        <View style={{ alignItems: 'center', padding: 10}}>
                            {React.cloneElement(isFocused ? iconsFocused[index] : icons[index])}
                        </View>
                         
                    </TouchableOpacity>
                );
            })}
            </View>
    );
};

export default CustomTabBar

const styles = StyleSheet.create({
    customTabBar: {
        width: '70%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 'auto',
        borderRadius: 50,
        flexDirection: 'row',
        padding: 5,
    },
    circle: {
        position: 'absolute',
        backgroundColor: '#f5f4f4',
    },
})