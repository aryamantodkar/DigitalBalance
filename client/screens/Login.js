import React, { useContext, useState } from 'react';
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
    Pressable
  } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native'; 

const Login = () => {
    const navigation = useNavigation(); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    

    const handleLogin = async () => {
        try {
          await login(email, password); // Call the login function from context
          navigation.navigate('UserContent'); // Navigate to the Home screen on successful login
        } catch (error) {
          console.error('Login error', error);
        }
    };

    const handleRegisterRedirect = () => {
        navigation.navigate('Register');  // Navigate to the Register screen
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View>
                    <Text style={styles.title}>Login</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <Pressable style={{height: 40,width: '100%',backgroundColor: 'blue'}} title="Login" onPress={handleLogin} >
                        <Text style={{color: 'white'}}>Login</Text>
                    </Pressable>
                    <Pressable onPress={handleRegisterRedirect} style={styles.registerButton}>
                        <Text style={styles.registerText}>Don't have an account? Register</Text>
                    </Pressable>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 15, padding: 10, borderRadius: 5 },
});
