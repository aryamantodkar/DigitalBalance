import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';

const CustomTabBar = ({ state, descriptors, navigation, isNavbarVisible }) => {
    if (!isNavbarVisible) {
        return null; // Return null to hide the navbar
    }

    const circleSizeValue = 45; // Fixed size for the circle
    const [circlePosition] = useState(new Animated.Value(-circleSizeValue)); // Start offscreen
    const tabPositions = useRef([]); // Store tab positions dynamically
    const [layoutReady, setLayoutReady] = useState(false); // Flag to detect layout readiness

    const icons = [
        <Ionicons name="home-outline" size={25} color="gray" />,
        <Entypo name="plus" size={25} color="gray" />,
        <AntDesign name="user" size={25} color="gray" />
    ];

    const iconsFocused = [
        <Entypo name="home" size={25} color="black" />,
        <Entypo name="plus" size={25} color="black" />,
        <Ionicons name="person" size={25} color="black" />
    ];

    const handleTabLayout = (event, index) => {
        const { x, width } = event.nativeEvent.layout;
        tabPositions.current[index] = { x, width };

        // Ensure circle position is set on initial load
        if (!layoutReady && index === state.index) {
            Animated.spring(circlePosition, {
                toValue: x + width / 2 - circleSizeValue / 2,
                useNativeDriver: false,
            }).start(() => setLayoutReady(true));
        }
    };

    useEffect(() => {
        if (layoutReady) {
            const { x, width } = tabPositions.current[state.index] || { x: 0, width: 0 };
            Animated.spring(circlePosition, {
                toValue: x + width / 2 - circleSizeValue / 2,
                useNativeDriver: false,
            }).start();
        }
    }, [state.index, layoutReady]);

    return (
        <View style={styles.customTabBar}>
            {layoutReady && (
                <Animated.View
                    style={[
                        styles.circle,
                        {
                            transform: [{ translateX: circlePosition }],
                            width: circleSizeValue,
                            height: circleSizeValue,
                            borderRadius: circleSizeValue / 2,
                        },
                    ]}
                />
            )}
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
                        style={styles.tabButton}
                        onLayout={(event) => handleTabLayout(event, index)} // Capture tab layout
                    >
                        <View style={{ alignItems: 'center', padding: 10 }}>
                            {React.cloneElement(isFocused ? iconsFocused[index] : icons[index])}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default CustomTabBar;

const styles = StyleSheet.create({
    customTabBar: {
        width: '70%', // Reduced width for the navbar
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#f5f4f4',
        paddingVertical: 10,
        borderRadius: 100,
        alignSelf: 'center',
        position: 'absolute',
        bottom: 20,
        opacity: 0.8
    },
    circle: {
        position: 'absolute',
        backgroundColor: '#fff',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
    },
});
