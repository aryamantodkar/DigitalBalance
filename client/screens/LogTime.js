import React, { useState, useRef, useEffect } from 'react';
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
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

const LogTime = ({setIsNavbarVisible}) => {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [displayScreenTime,setDisplayScreenTime] = useState(false);
  const [date, setDate] = useState(null);
  const [showCalendar,setShowCalendar] = useState(false);
  dayjs.extend(advancedFormat);

  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;
  const fadeAnim5 = useRef(new Animated.Value(0)).current;
  const inputContainerAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      setDate(dayjs().format('YYYY-MM-DD'));
      setHours('');
      setMinutes('');
    }, [])
  );

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
      <ScreenTime hours={hours} minutes={minutes} date={date} displayScreenTime={displayScreenTime} setDisplayScreenTime={setDisplayScreenTime} setIsNavbarVisible={setIsNavbarVisible}/>
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
                  {dayjs(date).isSame(dayjs(), 'day') || !date
                  ? "Today?"
                  : `on ${dayjs(date).format("Do MMMM")}?`}
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
              <Pressable onPress={() => {
                setShowCalendar(true);
              }} style={styles.dateContainer}>
                <FontAwesome5 name="calendar-alt" size={24} color="#686868" />
                <Text style={{marginLeft: 10,color: '#404040',fontFamily: 'InterHeadingRegular',}}>Pick a different date?</Text>
              </Pressable>
            </Animated.View>
            {
              showCalendar
              ?
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  mode='single'
                  date={date}
                  locale='en'
                  displayFullDays
                  onChange={(params) => {
                    const selectedDate = new Date(params.date);

                    const localDate = new Date(
                      selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
                    );

                    setDate(localDate);
                  }}
                  headerButtonColor='#0047FF'
                  selectedItemColor='#0047FF'
                  selectedTextStyle={{
                    fontWeight: 'bold',
                    color: '#fff',
                  }}
                  todayContainerStyle={{
                    borderWidth: 1,
                  }}
                />
                <View style={styles.footer}>
                  <View style={styles.footerContainer}>
                  <Pressable
                      onPress={() => setDate(new Date())}
                      accessibilityRole="button"
                      accessibilityLabel="Today"
                    >
                      <View
                        style={[
                          styles.todayButton,
                          { backgroundColor: '#0047FF' },
                        ]}
                      >
                        <Text
                          style={{ color: '#fff',fontFamily: 'InterHeadingMedium' }}
                        >
                          Today
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable style={{
                      paddingHorizontal: 15,
                      paddingVertical: 10,
                      borderRadius: 5,
                      backgroundColor: '#f5f5f4',
                    }}
                      onPress={() => setShowCalendar(false)}
                    >
                      <Text style={{fontFamily: 'InterHeadingMedium',color: '#404040'}}>Select</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
              :
              null
            }
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
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    position: 'relative',
  },
  textContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  heading: {
    fontSize: 75,
    fontFamily: 'InterHeadingMedium',
  },
  subHeading: {
    fontSize: 25,
    fontFamily: 'InterHeadingRegular',
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
    fontFamily: 'InterHeadingRegular',
    color: '#000',
    borderRadius: 5,
    marginRight: 20,
  },
  inputText: {
    fontSize: 20,
    fontFamily: 'InterHeadingRegular',
    color: '#404040',
  },
  dateContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 15
  },
  submitContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    borderRadius: 50
  },
  datePickerContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    shadowRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 0 },

    position: 'absolute',
    left: 0,
    right: 0,
    margin: 'auto'
  },
  datePicker: {
    width: 330,
  },
  footer: {
    paddingHorizontal: 5,
    paddingVertical: 5,
    marginTop: 15,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  todayButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
});
