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
  ActivityIndicator
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView } from 'react-native-gesture-handler';
import CircularProgress from 'react-native-circular-progress-indicator';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native'; 
import LoadingScreen from '../../components/LoadingScreen';
import AppList from '../../AppList.json';
import _ from 'lodash';

const LogTime = ({ setIsNavbarVisible }) => {
  const { width } = Dimensions.get('window');
  const navigation = useNavigation(); 

  const { fetchUserDetails, submitScreentime,fetchScreentime } = useAuth();
  const [date, setDate] = useState(null);
  const [displayDate, setDisplayDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [userData, setUserData] = useState(null);
  const [screentimeHours,setScreentimeHours] = useState(0);
  const [screentimeMinutes,setScreentimeMinutes] = useState(0);
  const [screentimeLimit,setScreentimeLimit] = useState(null);
  const [progressValue, setProgressValue] = useState(null);
  const [inputValues, setInputValues] = useState({}); 
  const [btnDisabled,setBtnDisabled] = useState(true);
  const [convertedTimeLimit,setConvertedTimeLimit] = useState(null);
  const [remainingTime,setRemainingTime] = useState(0);
  const [todaysData,setTodaysData] = useState(null);
  const [transformedData,setTransformedData] = useState(null);
  const [edit,setEdit] = useState(false);
  const [isUpdateAllowed,setIsUpdateAllowed] = useState(false);

  const [originalScreentime, setOriginalScreentime] = useState(0);
  const [originalAppValues,setOriginalAppValues] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const loadingAnim = new Animated.Value(0); // Initial opacity 0

  const scrollViewRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      // Reset scroll position when the page gains focus
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }, [])
  );

  useEffect(() => {
    // Fade in text and loader after the component mounts
    Animated.timing(loadingAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const loadingTimeout = setTimeout(() => {
      setIsLoading(false); // Hide loader after 3 seconds
    }, 3000);

    return () => clearTimeout(loadingTimeout); // Cleanup timeout if component unmounts
  }, [isLoading]);

  dayjs.extend(advancedFormat);

  useFocusEffect(
    useCallback(() => {
      setDate(dayjs().format('YYYY-MM-DD'));
      setDisplayDate(dayjs().format('DD-MMMM-YYYY').split('-'));
      fetchData();

      if(screentimeHours>screentimeLimit){
        setRemainingTime(convertTime(screentimeHours-screentimeLimit));
      }
      else{
        setRemainingTime(convertTime(screentimeLimit-screentimeHours));
      }
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

  const transformScreentimeData = (screentime) => {
    const { apps, totalScreentime, date } = screentime;
  
    const appDetails = Object.entries(apps).map(([appId, time]) => {
      const appInfo = AppList.find((app) => app.id === appId) || {
        appName: 'Unknown App',
        appIconUrl: '', // Default empty icon if not found
      };
  
      return {
        id: appId,
        name: appInfo.appName,
        appIconUrl: appInfo.appIconUrl, // Add appIconUrl
        hours: Number(time.hours),
        minutes: Number(time.minutes),
        totalMinutes: Number(time.hours) * 60 + Number(time.minutes),
      };
    });
  
    return {
      date: dayjs(date).format('YYYY-MM-DD'),
      totalScreentime: Number(totalScreentime),
      apps: appDetails,
    };
  };

  const getTodaysData = (transformedData,date) => {
    const today = dayjs(date).format('YYYY-MM-DD');
  
    const todaysData = transformedData.find((record) => record.date === today);
  
    return todaysData || null; 
  };

  const fetchData = async () => {
    try {
      const userDetails = await fetchUserDetails();
      const records = await fetchScreentime();
      const transformedData = records.map(transformScreentimeData);

      const timeLimit = userDetails?.data?.screentimeLimit*60;
      const convertedTimeLimit = convertTime(userDetails?.data?.screentimeLimit*60);

      setTransformedData(transformedData);
      setUserData(userDetails?.data);
      setScreentimeLimit(timeLimit);
      setConvertedTimeLimit(convertedTimeLimit);
    } catch (error) {
      console.error('Error fetching screentime:', error.message);
    }
  };

  const updateInputChange = (id, field_1,field_2, value_1,value_2) => {
    setInputValues((prevValues) => ({
      ...prevValues,
      [id]: {
          ...prevValues[id],
          [field_1]: value_1,
          [field_2]: value_2,
      },
  }));
  }

  const handleInputChange = (id, field_1,field_2, value_1,value_2) => {
    if(!inputValues[id]?.[field_2]){
      setInputValues((prevValues) => ({
          ...prevValues,
          [id]: {
              ...prevValues[id],
              [field_1]: value_1,
              [field_2]: value_2,
          },
      }));
    }
    else{
      setInputValues((prevValues) => ({
          ...prevValues,
          [id]: {
              ...prevValues[id],
              [field_1]: value_1,
          },
      }));
    }
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
    if (time > (screentimeLimit/60)) {
      return {
        color: '#8B0000',
        gradient: ['#FF6F6F', '#FF4C4C', '#8B0000']
      };
    }
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

  const isValidAppTime = () => {
      let flag = true;
      let keys = Object.keys(inputValues);

      if(keys.length>0){
          keys.map(key => {
              if((inputValues[key]["hours"]==undefined || inputValues[key]["hours"]=="") || inputValues[key]["minutes"]==undefined || inputValues[key]["minutes"]==""){
                  flag = false;
              }
          })
      }

      return keys.length==userData?.selectedApps.length && flag;
  };

  const handleSubmit = async () => {
      let totalMinutes = Number(screentimeHours*60) + Number(screentimeMinutes);
      const screentimeData = {
          totalScreentime: totalMinutes, // Total screen time in minutes
          date: date, // ISO format date
          apps: inputValues
      };
      try {
        const response = await submitScreentime(screentimeData);
        setInputValues({});
        setScreentimeHours(0);
        setScreentimeMinutes(0);
        setIsLoading(true);

        setTimeout(() => {
          navigation.navigate('Home'); // Navigate to the final destination
        }, 2000);

        console.log('Screentime submitted successfully:', response);
      } catch (error) {
        console.error('Error submitting screentime:', error.message);
      }
  };

  useEffect(()=>{
    setInputValues({});
    setIsUpdateAllowed(false);
    setOriginalAppValues({});
    setOriginalScreentime(0);

    if(transformedData){
      const todaysData = getTodaysData(transformedData,date);

      if(todaysData!=null){
        setScreentimeHours(String(Math.floor(todaysData.totalScreentime/60)));
        setScreentimeMinutes(String(todaysData.totalScreentime%60));
        setTodaysData(todaysData);
        setEdit(true);

        const todaysAppValues = todaysData?.apps;

        let appValues = todaysAppValues.reduce((acc, app) => {
          acc[app.id] = {
            hours: `${app.hours}`,
            minutes: `${app.minutes}`,
          };
          return acc;
        }, {});
        
        setOriginalAppValues(appValues);
        setOriginalScreentime(todaysData.totalScreentime);

        if(todaysAppValues){
          todaysAppValues.map(app => {
            updateInputChange(app.id, 'hours','minutes', String(app.hours),String(app.minutes));
          })
        }
      }
      else{
        setScreentimeHours(0);
        setScreentimeMinutes(0);
        setEdit(false);
        setInputValues({});
      }
    }
  },[date,transformedData]);


  useEffect(()=>{
    if(isValidAppTime()) setBtnDisabled(false);
    else setBtnDisabled(true);

    let totalMinutes = Number(screentimeHours*60) + Number(screentimeMinutes);

    const areEqual = _.isEqual(
      _.sortBy(originalAppValues, Object.keys),
      _.sortBy(inputValues, Object.keys)
    );

    if(((Number(originalScreentime))!=Number(totalMinutes)) || !areEqual){
      setIsUpdateAllowed(true);
    }
    else{
      setIsUpdateAllowed(false);
    }
  },[inputValues])

  useEffect(()=>{
    Animated.timing(marginTop, {
      toValue: screentimeHours === 0 && screentimeMinutes === 0 ? -20 : 0, // Target marginTop value
      duration: 300, // Duration of the animation
      useNativeDriver: false, // useNativeDriver is false because we're animating layout properties like marginTop
    }).start();

    let totalScreentime = ((Number(screentimeHours)*60) + Number(screentimeMinutes));

    if((screentimeHours*60)>screentimeLimit){
      setRemainingTime(convertTime((screentimeHours*60)-screentimeLimit));
    }
    else{
      setRemainingTime(convertTime(screentimeLimit-(screentimeHours*60)));
    }

    if(totalScreentime>screentimeLimit){
      setProgressValue(100);
    }
    else{
      let remainder = (totalScreentime / screentimeLimit) * 100;
      setProgressValue(remainder);
    }
  },[screentimeHours,screentimeMinutes]);

  if(isLoading){
    return <LoadingScreen navigationType='Submit'/>
  }
  if(userData){
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <LinearGradient
            colors={['#E7F6F6', '#FBEFEF', '#F9FBFA']}
            style={[styles.container, { padding: 20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                <View style={{marginVertical: 15,display: 'flex',justifyContent: 'center',alignItems: 'center'}}>
                  <Text style={[styles.label,{fontSize: 26,fontFamily: 'OutfitMedium'}]}>Log Time</Text>
                </View>
                <View style={[styles.datePickerContainer,styles.shadow]}>
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
                                    onPress={() => {
                                      const selectedDate = new Date();
                                      const localDate = new Date(
                                        selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
                                      );
      
                                      setDate(localDate);
                                      setDisplayDate(
                                        dayjs(localDate).format('DD-MMMM-YYYY').split('-')
                                      );
                                    }}
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
  
                <View style={[styles.timeInputContainer,styles.shadow]}>
                  <View style={{marginBottom: 20,display: 'flex',flexDirection: 'column',justifyContent: 'center'}}>
                    <Text style={[styles.label,{fontSize: 22,fontFamily: 'OutfitMedium'}]}>{edit ? 'Update ' : ''}Screen Time</Text>
                    <View style={{}}>
                      <Text style={[styles.label,{fontSize: 16,fontFamily: 'OutfitRegular',textAlign: 'center'}]}>Limit : {convertedTimeLimit}</Text>
                    </View>
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
                  {
                    (screentimeHours*60) > screentimeLimit ? (
                      screentimeHours>0 || screentimeMinutes>0
                      ?
                      <View style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20 }}>
                        <Text
                          style={[
                            styles.label,
                            {
                              fontSize: 17,
                              fontFamily: 'OutfitRegular',
                              textAlign: 'center',
                              color: 'red', // Red/Maroon for exceeding the limit
                            },
                          ]}
                        >
                          You’ve exceeded your Screen Time limit for today by <Text style={{fontFamily: 'OutfitSemiBold',}}>{remainingTime}</Text>.
                        </Text>
                      </View>
                      :
                      null
                    ) : (
                      screentimeHours>0 || screentimeMinutes>0
                      ?
                      <View style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20 }}>
                        <Text
                          style={[
                            styles.label,
                            {
                              fontSize: 17,
                              fontFamily: 'OutfitRegular',
                              textAlign: 'center',
                              color: '#4A7676', // Teal for staying within the limit
                            },
                          ]}
                        >
                          You’re <Text style={{fontFamily: 'OutfitSemiBold',}}>{remainingTime}</Text> under your Screen Time limit.
                        </Text>
                      </View>
                      :
                      null
                    )
                  }
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
  
                <View style={[styles.appTimesContainer,styles.shadow]}>
                  <View style={{marginBottom: 10}}>
                    <Text style={[styles.label,{fontSize: 22,fontFamily: 'OutfitMedium'}]}>Track Apps</Text>
                  </View>
                  {userData?.selectedApps.map(app => {
                    const appValues = inputValues[app.id] || { hours: '0', minutes: '0' };
                    

                    let hours = String(appValues.hours);
                    let mins = String(appValues.minutes);

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
                                onValueChange={(value) => handleInputChange(app.id, 'hours','minutes', value,'0')}
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
                                onValueChange={(value) => handleInputChange(app.id, 'minutes','hours', value,'0')}
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
                {
                  edit
                  ?
                  (
                    isUpdateAllowed
                    ?
                    <Pressable onPress={handleSubmit} style={[styles.submitButton,styles.shadow]}>
                      <Text style={[styles.label,{textAlign: 'center',color: '#fff',marginBottom: 0,fontFamily: 'OutfitMedium'}]}>Update</Text>
                    </Pressable>
                    :
                    <Pressable style={[styles.submitButton,styles.shadow,{backgroundColor: '#f5f4f4'}]}>
                      <Text style={[styles.label,{textAlign: 'center',color: '#ddd',marginBottom: 0,fontFamily: 'OutfitMedium'}]}>Update</Text>
                    </Pressable>
                  )
                  :
                  (
                    btnDisabled
                    ?
                    <Pressable style={[styles.submitButton,styles.shadow,{backgroundColor: '#f5f4f4'}]}>
                      <Text style={[styles.label,{textAlign: 'center',color: '#ddd',marginBottom: 0,fontFamily: 'OutfitMedium'}]}>Log</Text>
                    </Pressable>
                    :
                    <Pressable onPress={handleSubmit} style={[styles.submitButton,styles.shadow]}>
                      <Text style={[styles.label,{textAlign: 'center',color: '#fff',marginBottom: 0,fontFamily: 'OutfitMedium'}]}>Log</Text>
                    </Pressable>
                  )
                }
              </Animated.View>
            </ScrollView>
          </LinearGradient>
        </TouchableWithoutFeedback>
    );
  }
  else{
    return(
      <SafeAreaView style={[styles.container]}>
        <ActivityIndicator size="large" color="#4A7676" />
      </SafeAreaView>
    )
  }
  
};

export default LogTime;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
  },
  datePickerContainer: {
      marginBottom: 30,
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 20,
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
      elevation: 5,

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
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  scrollContent: {
    width: '100%',
    paddingBottom: 90, 
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

