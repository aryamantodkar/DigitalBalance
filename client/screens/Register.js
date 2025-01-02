import React, { useState, useEffect,useRef } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useAuth } from '../context/AuthContext'; // Access AuthContext
import Ionicons from '@expo/vector-icons/Ionicons';

const Register = () => {
    const navigation = useNavigation();
    const { register, message } = useAuth(); // Access register function and message
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword,setShowPassword] = useState(false);
    const [isSubmitted,setIsSubmitted] = useState(false);

    const logoAnimation = useRef(new Animated.Value(0)).current;
    const inputAnimation = useRef(new Animated.Value(0)).current;
    const buttonAnimation = useRef(new Animated.Value(0)).current;

    const handleLoginRedirect = () => {
        navigation.navigate('Login');
    };

    useEffect(() => {
        // Start animations on component mount
        Animated.sequence([
            Animated.timing(logoAnimation, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(inputAnimation, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(buttonAnimation, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleRegister = async () => {
        try {
            const result = await register(name, email, password);
            if (result.success) {
              // Navigate to verification email screen with the userId
              navigation.navigate('VerificationEmail', { userId: result.userId, email });
            }
        } catch (error) {
          console.error(error);
        }
    };
      

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <LinearGradient
                    colors={['#E7F6F6', '#FBEFEF', '#F9FBFA']}
                    style={styles.container}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Logo and Tagline */}
                    <View style={styles.logoContainer}>
                        <Animated.View
                            style={[
                                styles.logoCircle,
                                {
                                    opacity: logoAnimation,
                                    transform: [
                                        {
                                            scale: logoAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.5, 1],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <FontAwesome5 name="user-plus" size={60} color="#6D9E9E" />
                        </Animated.View>
                        <Text style={styles.tagline}>Join Us</Text>
                        <Text style={styles.subTagline}>Create an account to get started</Text>
                    </View>

                    {/* Input Fields */}
                    <View style={styles.inputContainer}>
                        <Animated.View
                            style={{
                                opacity: inputAnimation,
                                transform: [
                                    {
                                        translateY: inputAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20, 0],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <View style={{marginBottom: 20}}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Name"
                                    placeholderTextColor="#6D9E9E"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                            <View style={{marginBottom: 20}}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#6D9E9E"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#6D9E9E"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.iconContainer}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={24}
                                        color="#6D9E9E"
                                    />
                                </Pressable>
                            </View>
                        </Animated.View>
                    </View>

                    {/* Register Button */}
                    <View style={styles.buttonContainer}>
                        <Animated.View
                            style={{
                                opacity: buttonAnimation,
                                transform: [
                                    {
                                        translateY: buttonAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20, 0],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <Pressable style={styles.registerButton} onPress={handleRegister}>
                              <LinearGradient
                                  colors={['#6D9E9E', '#8FA8A8']}
                                  style={styles.gradientButton}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 1 }}
                              >
                                  <Text style={styles.registerButtonText}>Register</Text>
                              </LinearGradient>
                            </Pressable>
                        </Animated.View>
                    </View>

                    <Animated.View
                        style={{
                            opacity: buttonAnimation,
                            transform: [
                                {
                                    translateY: buttonAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20, 0],
                                    }),
                                },
                            ],
                        }}
                    >
                        <Pressable onPress={handleLoginRedirect}>
                            <Text style={styles.registerText}>Already have an account? Login</Text>
                        </Pressable>
                    </Animated.View>

                    {/* Message */}
                    {isSubmitted && message ? (
                        <Text
                            style={[
                                styles.message,
                                { color: message.includes('success') ? '#4CAF50' : '#FF6F61' },
                            ]}
                        >
                            {message}
                        </Text>
                    ) : null}
                </LinearGradient>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default Register;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E7F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    tagline: {
        fontSize: 28,
        color: '#4A7676',
        marginTop: 20,
        textAlign: 'center',
        fontWeight: '700',
        fontFamily: 'InterHeadingSemiBold',
    },
    subTagline: {
        fontSize: 16,
        color: '#6D9E9E',
        marginTop: 10,
        textAlign: 'center',
        fontFamily: 'InterHeadingRegular',
    },
    inputContainer: {
        marginBottom: 40,
    },
    input: {
        height: 50,
        backgroundColor: '#FFFFFF88',
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        width: '100%'
    },
    buttonContainer: {
        width: '100%',
    },
    registerButton: {
        height: 50,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerButtonText: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '600',
        fontFamily: 'InterHeadingMedium',
    },
    message: {
        marginTop: 20,
        fontSize: 14,
        textAlign: 'center',
        fontFamily: 'InterHeadingRegular',
    },
    registerText: {
        marginTop: 20,
        fontSize: 14,
        color: '#4A7676',
        textDecorationLine: 'underline',
        fontFamily: 'InterHeadingRegular',
        textAlign: 'center'
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 20
    },
    iconContainer: {
        margin: 'auto',
        position: 'absolute',
        top: 0, bottom: 0, right: 10,
        justifyContent: 'center'
    },
});
