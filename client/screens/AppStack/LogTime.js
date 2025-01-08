import React, { useState, useRef, useEffect,useCallback } from 'react';
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
  Image,
  Modal,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';
import ScreenTime from '../../components/ScreenTime';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView } from 'react-native-gesture-handler';
import CircularProgress from 'react-native-circular-progress-indicator';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const LogTime = ({ setIsNavbarVisible }) => {
  const { fetchUserDetails } = useAuth();
  const [displayScreenTime, setDisplayScreenTime] = useState(false);
  const [date, setDate] = useState(null);
  const [displayDate, setDisplayDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [userData, setUserData] = useState(null);
  const [screentimeHours,setScreentimeHours] = useState(0);
  const [screentimeMinutes,setScreentimeMinutes] = useState(0);
  const [screentimeLimit,setScreentimeLimit] = useState(null);
  const [progressValue, setProgressValue] = useState(null);
  const [inputValues, setInputValues] = useState({}); 
  
  dayjs.extend(advancedFormat);

  useFocusEffect(
    React.useCallback(() => {
      setDate(dayjs().format('YYYY-MM-DD'));
      setDisplayDate(dayjs().format('DD-MMMM-YYYY').split('-'));
    }, [])
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const marginTop = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      // Reset animation values
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
  
      // Start animations
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
  
      // Cleanup if needed (not applicable here but added for structure)
      return () => {
        fadeAnim.stopAnimation();
        slideAnim.stopAnimation();
      };
    }, [fadeAnim, slideAnim]) // Add dependencies if necessary
  );

  const fetchData = async () => {
    try {
      const userDetails = await fetchUserDetails();
      setUserData(userDetails?.data);
      setScreentimeLimit(userDetails?.data?.screentimeLimit);
    } catch (error) {
      console.error('Error fetching screentime:', error.message);
    }
  };

  const handleInputChange = (id, field, value) => {
    setInputValues((prevValues) => ({
        ...prevValues,
        [id]: {
            ...prevValues[id],
            [field]: value,
        },
    }));
  };

  const convertTime = time => {
    const hours = Math.floor(time / 60);
    const minutes = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getThemeColors = (time) => {
    if (time == 0 && screentimeMinutes==0) {
      return {
        color: '#E7F6F6',
        gradient: ['#E7F6F6', '#F5FAFA', '#D1F0F0']
      };
    } else if (time < 2) {
      return {
        color: '#A8DADA', // A lighter version of #6D9E9E
        gradient: ['#C2EDED', '#A8DADA', '#D6F5F5'] // Lighter gradient shades
      };
    } else if (time >= 2 && time<4) {
      return {
        color: '#6D9E9E',
        gradient: ['#8AC7C7', '#6D9E9E', '#A2D4D4']
      };
    } else if (time <= 4) {
      return {
        color: '#449292',
        gradient: ['#2F8E8E', '#449292', '#006E6E']
      };
    } else if (time <= 6) {
      return {
        color: '#2A8A8A',
        gradient: ['#004F4F', '#026767', '#2A8A8A']
      };
    } else {
      return{
        color: '#026767',
        gradient: ['#003A3A', '#004E4E', '#002828']
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(()=>{
    Animated.timing(marginTop, {
      toValue: screentimeHours === 0 && screentimeMinutes === 0 ? -20 : 0, // Target marginTop value
      duration: 300, // Duration of the animation
      useNativeDriver: false, // useNativeDriver is false because we're animating layout properties like marginTop
    }).start();

    let noLimitValue = ((Number(screentimeHours)*60) + Number(screentimeMinutes))/10;
    let limitValue = ((Number(screentimeHours)*60) + Number(screentimeMinutes))*100;
    limitValue /= (screentimeLimit*60);

    if(screentimeLimit==null){
      if(noLimitValue>100){
        setProgressValue(100);
      }
      else setProgressValue(noLimitValue);
    }
    else{
      if(limitValue>100){
        setProgressValue(100);
      }
      else setProgressValue(limitValue);
    }
  },[screentimeHours,screentimeMinutes]);

  if (displayScreenTime) {
    return (
      <ScreenTime
        hours={hours}
        minutes={minutes}
        date={date}
        displayScreenTime={displayScreenTime}
        setDisplayScreenTime={setDisplayScreenTime}
        setIsNavbarVisible={setIsNavbarVisible}
      />
    );
  } else {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <LinearGradient
            colors={['#E7F6F6', '#FBEFEF', '#F9FBFA']}
            style={[styles.container, { padding: 20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                <View style={{marginVertical: 15,display: 'flex',justifyContent: 'center',alignItems: 'center'}}>
                  <Text style={[styles.label,{fontSize: 26,fontFamily: 'OutfitMedium'}]}>Log Time</Text>
                </View>
                <View style={[styles.datePickerContainer]}>
                  <Pressable
                    style={styles.datePickerButton}
                    onPress={() => setShowCalendar(true)}
                  >
                    <View style={{position: 'absolute',left: 20}}>
                      <FontAwesome5 name="calendar-alt" size={24} color="#4A7676" />
                    </View>
                    <View style={{display: 'flex',flexDirection: 'row'}}>
                      <View style={{marginHorizontal: 5}}>
                        <Text style={styles.dateText}>{displayDate?.[0]}</Text>
                      </View>
                      <View style={{marginHorizontal: 5}}>
                        <Text style={styles.dateText}>{displayDate?.[1]}</Text>
                      </View>
                      <View style={{marginHorizontal: 5}}>
                        <Text style={styles.dateText}>{displayDate?.[2]}</Text>
                      </View>
                    </View>
                  </Pressable>
                  
                    {showCalendar && (
                      <TouchableWithoutFeedback onPress={() => setShowCalendar(false)}>
                        <Modal
                          transparent
                          animationType="fade"
                          visible={showCalendar}
                          onRequestClose={() => setShowCalendar(false)}
                        >
                          {/* Blur and Background Overlay */}
                          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill}>
                            <Pressable
                              style={styles.overlay}
                              onPress={() => setShowCalendar(false)}
                            />
                          </BlurView>

                          {/* Calendar Container */}
                          <View style={styles.centeredContainer}>
                            <View style={styles.datePickerContainerCalendar}>
                              {/* DateTimePicker */}
                              <DateTimePicker
                                mode="single"
                                date={date}
                                locale="en"
                                displayFullDays
                                onChange={(params) => {
                                  const selectedDate = new Date(params.date);

                                  const localDate = new Date(
                                    selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
                                  );

                                  setDate(localDate);
                                  setDisplayDate(
                                    dayjs(localDate).format('DD-MMMM-YYYY').split('-')
                                  );
                                }}
                                headerButtonColor="#6D9E9E"
                                selectedItemColor="#6D9E9E"
                                selectedTextStyle={{
                                  fontWeight: 'bold',
                                  color: '#fff',
                                }}
                                todayContainerStyle={{
                                  borderWidth: 1,
                                }}
                              />

                              {/* Footer Buttons */}
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
                                        { backgroundColor: '#6D9E9E' },
                                      ]}
                                    >
                                      <Text
                                        style={{
                                          color: '#fff',
                                          fontFamily: 'OutfitMedium',
                                        }}
                                      >
                                        Today
                                      </Text>
                                    </View>
                                  </Pressable>
                                  <Pressable
                                    style={{
                                      paddingHorizontal: 15,
                                      paddingVertical: 10,
                                      borderRadius: 5,
                                      backgroundColor: '#f5f5f4',
                                    }}
                                    onPress={() => setShowCalendar(false)}
                                  >
                                    <Text
                                      style={{
                                        fontFamily: 'OutfitMedium',
                                        color: '#404040',
                                      }}
                                    >
                                      Select
                                    </Text>
                                  </Pressable>
                                </View>
                              </View>
                            </View>
                          </View>
                        </Modal>
                      </TouchableWithoutFeedback>
                    )}
                </View>

                <View style={styles.timeInputContainer}>
                  <View style={{marginBottom: 20}}>
                    <Text style={[styles.label,{fontSize: 22,fontFamily: 'OutfitRegular'}]}>Screen Time</Text>
                  </View>
                  <View style={{marginBottom: 20,position: 'relative',display: 'flex',justifyContent: 'center',alignItems:'center'}}>
                    <CircularProgress
                        value={progressValue}
                        title={`${screentimeHours}h ${screentimeMinutes}m`}
                        radius={120}
                        titleColor='#fff'
                        titleFontSize={25}
                        activeStrokeColor={getThemeColors(screentimeHours).color}
                        inActiveStrokeColor='#E7F6F6'
                        inActiveStrokeOpacity={0.5}
                        inActiveStrokeWidth={40}
                        activeStrokeWidth={20}
                        showProgressValue={false}
                        titleStyle={{fontFamily: 'OutfitMedium',
                          zIndex: 1,
                          color: (screentimeHours==0 && screentimeMinutes==0) ? '#6D9E9E' : '#fff'
                        }}
                    />
                    <LinearGradient
                      colors={getThemeColors(screentimeHours).gradient}
                      style={{
                        width: 150,
                        height: 150,
                        borderRadius: 100,
                        position: 'absolute', // Position absolutely to the parent
                        top: '50%', // Center vertically
                        left: '50%', // Center horizontally
                        marginTop: -75, // Offset by half the height to perfectly center
                        marginLeft: -110, // Offset by half the width to perfectly center
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.5
                      }}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    ></LinearGradient>
                  </View>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerWrapper}>
                      <Text style={styles.pickerLabel}>Hours</Text>
                      <Animated.View style={{marginTop}} key={`${screentimeHours}-${screentimeMinutes}`}>
                        <Picker
                          selectedValue={screentimeHours}
                          style={[styles.picker]}
                          onValueChange={(value) => setScreentimeHours(value)}
                          itemStyle={{color: '#4A7676',height: 150}}
                        >
                          {Array.from({ length: 25 }, (_, i) => (
                            <Picker.Item key={i} label={`${i}`} value={`${i}`} />
                          ))}
                        </Picker>
                      </Animated.View>
                    </View>
                    <View style={styles.pickerWrapper}>
                      <Text style={styles.pickerLabel}>Minutes</Text>
                      <Animated.View style={{marginTop}} key={`${screentimeHours}-${screentimeMinutes}`}>
                        <Picker
                          selectedValue={screentimeMinutes}
                          style={[styles.picker]}
                          onValueChange={(value) => setScreentimeMinutes(value)}
                          itemStyle={{color: '#4A7676',height: 150}}
                          selectionColor='#4A7676'
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <Picker.Item key={i} label={`${i}`} value={`${i}`} />
                          ))}
                        </Picker>
                      </Animated.View>
                    </View>
                  </View>
                </View>

                <View style={[styles.appTimesContainer]}>
                  <View style={{marginBottom: 10}}>
                    <Text style={[styles.label,{fontSize: 22,fontFamily: 'OutfitRegular'}]}>Track Apps</Text>
                  </View>
                  {userData?.selectedApps.map(app => {
                    const appValues = inputValues[app.id] || { hours: '0', minutes: '0' };
                    let hours = appValues.hours;
                    let mins = appValues.minutes;

                    if(!hours) hours = 0;
                    if(!mins) mins = 0;
                    return (
                      <View key={app.id} style={[styles.appRow,{flexDirection: 'column',minWidth: '100%'}]}>
                        <View style={{display: 'flex',flexDirection: 'row',alignItems: 'center',justifyContent: 'space-between',marginVertical: 10}}>
                          <View style={{display: 'flex',flexDirection: 'row',alignItems: 'center',width: '80%'}}>
                            <Image
                              source={{ uri: app.appIconUrl }}
                              style={{ width: 35, height: 35, marginRight: 10, borderRadius: 10 }}
                              resizeMode="contain"
                            />
                            <Text style={[styles.appName,{maxWidth: '70%'}]}>{app.appName}</Text>
                          </View>
                          <View style={{width: '20%',display: 'flex',flexDirection: 'row',alignItems: 'center',justifyContent: 'center'}}>
                            <Text style={[styles.appName,{fontFamily: 'OutfitSemiBold',color: '#4A7676'}]}>{hours}h {mins}m</Text>
                          </View>
                        </View>
                        <View style={styles.pickerContainer}>
                          <View style={styles.pickerWrapper}>
                            <Text style={[styles.pickerLabel,{fontSize: 15}]}>Hours</Text>
                            <Picker
                                selectedValue={appValues.hours}
                                style={[styles.picker]}
                                onValueChange={(value) => handleInputChange(app.id, 'hours', value)}
                                itemStyle={{color: '#4A7676',height: 150}}
                              >
                                {Array.from({ length: 25 }, (_, i) => (
                                  <Picker.Item key={i} label={`${i}`} value={`${i}`} />
                                ))}
                              </Picker>
                          </View>
                          <View style={styles.pickerWrapper}>
                            <Text style={[styles.pickerLabel,{fontSize: 15}]}>Minutes</Text>
                            <Picker
                                selectedValue={appValues.minutes}
                                style={[styles.picker]}
                                onValueChange={(value) => handleInputChange(app.id, 'minutes', value)}
                                itemStyle={{color: '#4A7676',height: 150}}
                                selectionColor='#4A7676'
                              >
                                {Array.from({ length: 60 }, (_, i) => (
                                  <Picker.Item key={i} label={`${i}`} value={`${i}`} />
                                ))}
                            </Picker>
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </View>
                <Pressable style={styles.submitButton}>
                  <Text style={[styles.label,{textAlign: 'center',color: '#fff',marginBottom: 0,fontFamily: 'OutfitMedium'}]}>Log</Text>
                </Pressable>
              </Animated.View>
            </ScrollView>
          </LinearGradient>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }
};

export default LogTime;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginTop: 20
  },
  datePickerContainer: {
      marginBottom: 30,
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 20
  },
  datePickerButton: {
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF88',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,

      flexDirection: 'row',
      position: 'relative'
  },
  dateText: {
      fontSize: 16,
      color: '#4A7676',
      fontFamily: 'OutfitMedium',
  },
  label: {
      fontSize: 16,
      color: '#4A7676',
      marginBottom: 10,
      fontFamily: 'OutfitRegular',
  },
  timeInputContainer: {
      marginBottom: 30,
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 20,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
  },
  timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '70%'
  },
  input: {
      height: 50,
      flex: 1,
      backgroundColor: '#FFFFFF88',
      borderRadius: 12,
      paddingHorizontal: 15,
      fontSize: 16,
      color: '#333333',
      marginHorizontal: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
  },
  appTimesContainer: {
      marginBottom: 20,
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 20,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
  },
  appRow: {
      flexDirection: 'row',
      marginBottom: 15,
  },
  appIcon: {
      marginRight: 10,
  },
  appName: {
      fontSize: 16,
      color: '#4A7676',
      fontFamily: 'OutfitRegular',
  },
  appInput: {
      height: 50,
      width: 50,
      backgroundColor: '#FFFFFF88',
      borderRadius: 8,
      paddingHorizontal: 10,
      fontSize: 14,
      color: '#4A7676',
      textAlign: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
  },

  datePickerContainerCalendar: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 0 },

    position: 'absolute',
    left: 0,
    right: 0,
    margin: 'auto',
    zIndex: 2,
  },
  datePicker: {
    width: 330,
  },
  openCalendarButton: {
    padding: 15,
    backgroundColor: '#6D9E9E',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
  },
  openCalendarText: {
    color: '#fff',
    fontFamily: 'OutfitMedium',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    margin: 'auto'
  },
  datePickerContainerCalendar: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  footer: {
    marginTop: 20,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  todayButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5
  },
  scrollContent: {
    width: '100%',
    paddingBottom: 100, 
    alignItems: 'center', 
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  pickerWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 18,
    color: '#6D9E9E',
    marginBottom: 5,
    fontFamily: 'OutfitRegular',
  },
  picker: {
    height: 150,
    width: 100,
    display: 'flex',
  },
  submitButton: {
    backgroundColor: '#6D9E9E',
    display: 'flex',
    alignItems: 'center',
    padding: 15,
    borderRadius: 50,
    justifyContent: 'center'
  }
});

