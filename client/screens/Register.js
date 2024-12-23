import React, { useState } from 'react';
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
import { useAuth } from '../context/AuthContext'; // Access AuthContext

const Register = () => {
  const { register, message } = useAuth(); // Access register function and message
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    register(name, email, password);
  };

  return (
    <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={styles.container}>
                    <TextInput
                        style={styles.input}
                        placeholder="Name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <Pressable title="Register" onPress={handleRegister}>
                        <Text>Register</Text>
                    </Pressable>

                    {/* Show the message if available */}
                    {message ? <Text style={styles.message}>{message}</Text> : null}
                </View>
            </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
    
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, justifyContent: 'center', padding: 20 
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
  },
  message: {
    marginTop: 10,
    color: 'red', // You can change this to green for success messages
    fontWeight: 'bold',
  },
});

export default Register;
