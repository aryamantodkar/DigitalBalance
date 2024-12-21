import React, { useState, useRef } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';
import ScreenTime from '../components/ScreenTime';

const LogTime = () => {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [displayScreenTime,setDisplayScreenTime] = useState(false);

  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;
  const fadeAnim5 = useRef(new Animated.Value(0)).current;
  const inputContainerAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      // Reset animations
      fadeAnim1.setValue(0);
      fadeAnim2.setValue(0);
      fadeAnim3.setValue(0);
      fadeAnim4.setValue(0);
      fadeAnim5.setValue(0);
      inputContainerAnim.setValue(0);

      // Sequence animation for texts and inputs
      Animated.sequence([
        Animated.timing(fadeAnim1, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim3, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim4, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim5, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(inputContainerAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, [fadeAnim1, fadeAnim2, fadeAnim3, fadeAnim4, fadeAnim5, inputContainerAnim])
  );

  if(displayScreenTime){
    return (
      <ScreenTime hours={hours} minutes={minutes} displayScreenTime={displayScreenTime} setDisplayScreenTime={setDisplayScreenTime}/>
    );
  }
  else{
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {
          hours!=='' && minutes!==''
          ?
          <Pressable onPress={() => {
            setDisplayScreenTime(true)
          }} style={[styles.submitContainer,{backgroundColor: '#000',zIndex: 10}]}>
            <AntDesign name="arrowright" size={24} color="white" />
          </Pressable>
          :
          <View style={[styles.submitContainer,{backgroundColor: '#E6E6E6'}]}>
            <AntDesign name="arrowright" size={24} color="gray" />
          </View>
        }
        {/* TouchableWithoutFeedback to dismiss keyboard on tapping anywhere */}
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.innerContainer}>
            <Animated.View style={[styles.textContainer]}>
              <Animated.Text style={[styles.subHeading, { opacity: fadeAnim1 }]}>
                How Much
              </Animated.Text>
              <Animated.Text style={[styles.heading, { opacity: fadeAnim2 }]}>
                Time
              </Animated.Text>
              <Animated.Text style={[styles.subHeading, { opacity: fadeAnim3 }]}>
                Did You
              </Animated.Text>
              <Animated.Text style={[styles.heading, { opacity: fadeAnim4 }]}>
                Waste
              </Animated.Text>
              <Animated.Text style={[styles.subHeading, { opacity: fadeAnim5 }]}>
                Today?
              </Animated.Text>
            </Animated.View>
            <Animated.View style={[styles.inputContainer, { opacity: inputContainerAnim }]}>
              <View style={styles.inputRow}>
                <TextInput
                  value={hours}
                  placeholder="00"
                  onChangeText={setHours}
                  style={styles.input}
                  keyboardType="numeric"
                  placeholderTextColor="#DDD"
                />
                <Text style={styles.inputText}>Hours</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  value={minutes}
                  placeholder="00"
                  onChangeText={setMinutes}
                  style={styles.input}
                  keyboardType="numeric"
                  placeholderTextColor="#DDD"
                />
                <Text style={styles.inputText}>Minutes</Text>
              </View>
              <View style={styles.dateContainer}>
                <FontAwesome5 name="calendar-alt" size={24} color="#686868" />
                <Text style={{marginLeft: 10,color: '#404040',fontFamily: 'MontserratLight',}}>Pick a different date?</Text>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }
};

export default LogTime;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f4f4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative'
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20
  },
  textContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  heading: {
    fontSize: 75,
    fontFamily: 'MontserratSemiBold',
  },
  subHeading: {
    fontSize: 25,
    fontFamily: 'MontserratMedium',
    color: '#404040',
  },
  inputContainer: {
    marginTop: 40,
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    width: 50,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'MontserratMedium',
    color: '#000',
    borderRadius: 5,
    marginRight: 20,
  },
  inputText: {
    fontSize: 20,
    fontFamily: 'MontserratMedium',
    color: '#404040',
  },
  dateContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20
  },
  submitContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    borderRadius: 50
  },
});
