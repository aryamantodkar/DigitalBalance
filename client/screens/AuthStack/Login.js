import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const Login = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const [showPassword,setShowPassword] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        try {
            const isLoggedIn = await login(email, password);
            if (isLoggedIn) {
                // Login successful
            } else {
                console.error('Login failed: Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error.message || error);
        }
    };

    const handleRegisterRedirect = () => {
        navigation.navigate('Register');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <LinearGradient
                    colors={['#E7F6F6', '#FBEFEF', '#F9FBFA']}
                    style={styles.container}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        <View style={styles.logoCircle}>
                            <FontAwesome5 name="hourglass-start" size={60} color="#6D9E9E" />
                        </View>
                        <Text style={styles.tagline}>Screen Wise</Text>
                        <Text style={styles.subTagline}>Make every minute mindful</Text>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.inputContainer,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
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

                    <Animated.View
                        style={[
                            styles.buttonContainer,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        <Pressable style={styles.loginButton} onPress={handleLogin}>
                            <LinearGradient
                                colors={['#6D9E9E', '#8FA8A8']}
                                style={styles.gradientButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.loginButtonText}>Login</Text>
                            </LinearGradient>
                        </Pressable>
                        <Pressable onPress={handleRegisterRedirect}>
                            <Text style={styles.registerText}>Don't have an account? Register</Text>
                        </Pressable>
                    </Animated.View>
                </LinearGradient>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
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
        fontFamily: 'InterHeadingBold',
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
        alignItems: 'center',
    },
    loginButton: {
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
    loginButtonText: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '600',
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
