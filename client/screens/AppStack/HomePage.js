import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable,Image, Animated, ScrollView,ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AppList from '../../AppList.json';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import { LineChart } from 'react-native-chart-kit';
import DropDownPicker from 'react-native-dropdown-picker';
import AntDesign from '@expo/vector-icons/AntDesign';

const HomePage = () => {
  const { fetchScreentime, fetchUserDetails } = useAuth();
  const [todaysData,setTodaysData] = useState(null);
  const [userData,setUserData] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], data: [] });
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [weeklyScreentime, setWeeklyScreentime] = useState(null);

  const animatedValue = useRef(new Animated.Value(8)).current; // Ref for dot size animation
  const animatedOpacity = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  dayjs.extend(isBetween);
  dayjs.extend(advancedFormat);
  dayjs.extend(isoWeek);
  dayjs.extend(utc);

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

  const getTodaysData = (transformedData) => {
    const today = dayjs().format('YYYY-MM-DD');
  
    const todaysData = transformedData.find((record) => record.date === today);
  
    return todaysData || null; 
  };

  const fetchData = async () => {
    try {
      const records = await fetchScreentime();
      const userDetails = await fetchUserDetails();

      const transformedData = records.map(transformScreentimeData);
      const todaysData = getTodaysData(transformedData);

      setTodaysData(todaysData);
      setUserData(userDetails.data);
      updateChartDataForWeek(transformedData);
    } catch (error) {
      console.error('Error fetching screentime:', error.message);
    }
  };

  const convertTime = (time) => {
    const hours = Math.floor(time / 60);
    const minutes = Math.floor(time % 60);

    const days = Math.floor(hours / 24);
    const remHours = Math.floor(hours % 24);

    if(hours>0){
      if(hours>=24){
        return `${days}d ${remHours}h`;
      }
      return `${hours}h ${minutes}m`;
    }
    else{
      return `${minutes}m`;
    }
  }

  const updateChartDataForWeek = (data) => {
    Animated.timing(animatedOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      const groupedWeekData = groupByWeek(data);

      let weekData = 0;

      groupedWeekData.map(day => {
        weekData += Number(day.totalScreentime);
      });
      setWeeklyScreentime(weekData);

      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dataset = Array(7).fill(0); 
  
      labels.forEach((dayLabel, index) => {
        const dayData = groupedWeekData.find((day) => day.day === dayLabel);
  
        if (dayData) {
          dataset[index] = dayData.totalScreentime || 0; 
        }
      });
  
      setChartData({ labels, data: dataset });

      const lastNonZeroIndex = dataset.map((value, index) => (value > 0 ? index : null)).filter((v) => v !== null).pop();
      setSelectedPointIndex(lastNonZeroIndex ?? 0);

      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };  

  const groupByWeek = (data) => {
    const currentWeekStart = dayjs().startOf('isoWeek');
    const currentWeekEnd = dayjs().endOf('isoWeek'); 
  
    // Filter data to include only entries within the current week
    const currentWeekData = data.filter((entry) => {
      const entryDate = dayjs(entry.date); // Ensure entry.date is in a compatible format
      return entryDate.isBetween(currentWeekStart, currentWeekEnd, null, '[]'); // Include start and end dates
    });
  
    // Initialize an object to group data by day of the week
    const groupedData = {};
  
    // Populate groupedData
    currentWeekData.forEach((entry) => {
      const dayOfWeek = dayjs(entry.date).format('ddd'); // "Mon", "Tue", etc.
      if (!groupedData[dayOfWeek]) {
        groupedData[dayOfWeek] = {
          totalScreentime: 0,
        };
      }
  
      groupedData[dayOfWeek].totalScreentime += entry.totalScreentime;
    });
  
    // Convert to an array of objects for easier iteration
    return Object.entries(groupedData).map(([day, value]) => ({
      day,
      ...value,
    }));
  };  

  const handleDataPointClick = (data) => {
    setSelectedPointIndex(data.index);

    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 12,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValue, {
        toValue: 8,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };
  
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const animateText = () => {
    // Fade out animation
    Animated.sequence([
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateText(); // Trigger animation whenever selectedPointIndex changes
  }, [selectedPointIndex, weeklyScreentime]);

  const formatYLabel = (value) => {
    const hours = Math.floor(value / 60); // Get the whole number of hours
    const minutes = value % 60; // Get the remaining minutes
  
    if (hours >= 1) {
      return `${hours}h`; // Display hours only if hours >= 1
    } else if (minutes > 0) {
      return `${minutes}m`; // Display minutes if less than an hour
    } else {
      return '0m'; // Return '0m' for zero screentime
    }
  };
  
  const dayAbbreviations = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  };

  if(userData){
    return (
      <LinearGradient
              colors={['#E7F6F6', '#FBEFEF', '#F9FBFA']}
              style={[styles.container, { }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={{marginBottom: 10,display: 'flex',flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',width: '100%'}}>
            <View>
              <Text style={styles.headerText}>Hello,</Text>
              <Text style={styles.headerUserName}>Aryaman.</Text>
            </View>
            <Ionicons name="notifications" size={30} color="black" />
          </View>
          {
            todaysData ? (
              <View style={styles.topApps}>
                <View style={{ display: 'flex', flexDirection: 'row',justifyContent: 'space-between', marginVertical: 20,paddingHorizontal: 10 }}>
                  <View>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontFamily: 'OutfitRegular', fontSize: 14, color: '#404040' }}>Screen Time</Text>
                    </View>
                    <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 25, color: '#4A7676' }}>{convertTime(todaysData.totalScreentime)}</Text>
                  </View>
                  <View>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontFamily: 'OutfitRegular', fontSize: 14, color: '#404040' }}>Time Remaining</Text>
                    </View>
                    <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 25, color: 'red' }}>{(userData?.screentimeLimit*60-todaysData.totalScreentime) > 0 ? convertTime((userData?.screentimeLimit*60)-todaysData.totalScreentime) : 0}</Text>
                  </View>
                </View>
                {
                  todaysData.apps.map((app) => {
                    const percentage = Math.min((app.totalMinutes / (userData?.screentimeLimit*60)) * 100, 100); // Assuming 180 is the limit
                    // Define the dynamic color based on percentage
                    const getColor = (percent) => {
                      if (percent < 25) return '#52C5FF'; 
                      if (percent < 50) return '#A8D5BA'; 
                      if (percent < 75) return '#FFB84D'; 
                      return '#FF5E4F'; 
                    };
                    
                
                    return (
                      <View style={styles.appContainer} key={app.id}>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
                          <Image
                            source={{ uri: app.appIconUrl }}
                            style={{ width: 35, height: 35, marginRight: 15, borderRadius: 10 }}
                            resizeMode="contain"
                          />
                          <View style={{display: 'flex',flexDirection: 'column',maxWidth: '70%',minWidth: '70%'}}>
                            <Text style={{ fontFamily: 'OutfitRegular' }}>{app.name}</Text>
                            <View style={styles.progressBarContainer}>
                            <View
                              style={[
                                styles.progressBar,
                                { width: `${percentage}%`, backgroundColor: getColor(percentage) },
                              ]}
                            />
                          </View>
                          </View>
                        </View>
                        <View>
                          <Text style={{ fontFamily: 'OutfitMedium', color: '#000' }}>{convertTime(app.totalMinutes)}</Text>
                        </View>
                      </View>
                    )
                  })
                }
              </View>
            ) : (
              <View style={styles.topApps}>
                <View style={{ display: 'flex', flexDirection: 'row',justifyContent: 'space-between',paddingHorizontal: 10, marginVertical: 20 }}>
                  <View>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontFamily: 'OutfitRegular', fontSize: 14, color: '#404040' }}>Screen Time</Text>
                    </View>
                    <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 25, color: '#4A7676' }}>0h 0m</Text>
                  </View>
                  <View>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontFamily: 'OutfitRegular', fontSize: 14, color: '#404040' }}>Time Remaining</Text>
                    </View>
                    <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 25, color: 'red' }}>{convertTime(userData?.screentimeLimit*60)}</Text>
                  </View>
                </View>
                {
                  userData?.selectedApps.map((app) => {
                    const percentage = 0; // Assuming 180 is the limit
                
                    // Define the dynamic color based on percentage
                    const getColor = (percent) => {
                      if (percent < 25) return '#A2C8FF'; 
                      if (percent < 50) return '#A8D5BA'; 
                      if (percent < 75) return '#FFB84D'; 
                      return '#FF5E4F'; 
                    };
                    
                
                    return (
                      <View style={styles.appContainer} key={app.id}>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
                          <Image
                            source={{ uri: app.appIconUrl }}
                            style={{ width: 35, height: 35, marginRight: 15, borderRadius: 10 }}
                            resizeMode="contain"
                          />
                          <View style={{display: 'flex',flexDirection: 'column',maxWidth: '70%',minWidth: '70%'}}>
                            <Text style={{ fontFamily: 'OutfitRegular' }}>{app.appName}</Text>
                            <View style={styles.progressBarContainer}>
                            <View
                              style={[
                                styles.progressBar,
                                { width: `${percentage}%`, backgroundColor: getColor(percentage) },
                              ]}
                            />
                          </View>
                          </View>
                        </View>
                        <View>
                          <Text style={{ fontFamily: 'OutfitMedium', color: '#000' }}>0m</Text>
                        </View>
                      </View>
                    )
                  })
                }
              </View>
            )
          }

        <View style={styles.chartContainer}>
          <Animated.View style={{display: 'flex',flexDirection: 'row',justifyContent: 'space-between',width: '100%', opacity: textOpacity,paddingHorizontal: 15}}>
            <View style={{marginBottom: 20,display: 'flex',alignSelf: 'flex-start',padding: 10}}>
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontFamily: 'OutfitRegular', fontSize: 14, color: '#404040' }}>This Week</Text>
              </View>
              <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 25, color: '#4A7676' }}>{convertTime(weeklyScreentime)}</Text>
            </View>
            <View style={{marginBottom: 20,display: 'flex',alignSelf: 'flex-start',padding: 10}}>
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontFamily: 'OutfitRegular', fontSize: 14, color: '#404040' }}>{dayAbbreviations[chartData?.labels?.[selectedPointIndex]]}</Text>
              </View>
              <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 25, color: '#4A7676' }}>{convertTime(chartData?.data?.[selectedPointIndex])}</Text>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: animatedOpacity }}>
            <LineChart
              data={{
                labels: chartData?.labels?.length ? chartData.labels : ['No Data'], 
                datasets: [{ data: chartData.data.length ? chartData.data : [0] }],
              }}
              width={Dimensions.get('window').width* 0.95 - 40} // Parent container's width 90% - padding*2
              height={250}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity) => `rgba(62, 193, 141, ${opacity})`, // Bright blue for the line
                labelColor: (opacity) => `rgba(0, 0, 0, ${opacity})`,
                strokeWidth: 4, // Thicker line for more visibility
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6', // Larger dots
                  strokeWidth: '2',
                  stroke: '#4A7676', // Warm orange border for dots
                },
              }}
              withDots={true}
              bezier
              renderDotContent={({ x, y, index }) => {
                const isSelected = selectedPointIndex === index;
                
                return (
                  <Animated.View
                    key={index}
                    style={{
                      width: isSelected ? animatedValue : 12, // Larger size for selected dot
                      height: isSelected ? animatedValue : 12,
                      borderRadius: 12,
                      backgroundColor: isSelected ? '#4A7676' : '#ffffff',
                      borderWidth: isSelected ? 0 : 2,
                      borderColor: 'rgba(74, 118, 118, 1)', // Glowing orange border for selected dots
                      position: 'absolute',
                      left: isSelected ? x-4 : x - 6,
                      top: isSelected ? y-4 : y - 6,
                      elevation: isSelected ? 8 : 4, // Elevation for better pop effect
                      shadowColor: '#4A7676',
                      shadowOffset: { width: 0, height: 5 },
                      shadowOpacity: 0.3,
                      shadowRadius: 5,
                    }}
                  />
                );
              }}
              formatYLabel={formatYLabel}
              segments={chartData.data.every(value => value === 0) ? 0 : 4}
              onDataPointClick={handleDataPointClick}
              style={styles.chart}
            />
          </Animated.View>
        </View>

        </ScrollView>
      </LinearGradient>
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

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  scrollContent: {
    width: '95%',
    padding: 10,
    paddingBottom: 100, // Adjust this to leave space above the navbar
    alignItems: 'center', // Center content if needed,
    paddingTop: 40
  },
  topApps: {
    width: '100%',
    paddingHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,
    marginTop: 10,
  },

  headerText: {
    fontSize: 25,
    color: '#636e72', // Subtle gray text
    fontFamily: 'OutfitRegular',
    opacity: 0.5
  },
  headerUserName: {
    fontSize: 40,
    color: '#404040',
    fontFamily: 'OutfitMedium',
  },

  screenTimeLabel: {
    fontSize: 16,
    color: '#636e72',
    fontFamily: 'OutfitRegular',
  },

  screenTime: {
    fontSize: 30,
    fontFamily: 'OutfitSemiBold',
    color: '#000',
    marginTop: 5,
  },

  remainingTimeLabel: {
    fontSize: 16,
    color: '#636e72',
    fontFamily: 'OutfitRegular',
  },

  remainingTime: {
    fontSize: 30,
    fontFamily: 'OutfitSemiBold',
    color: '#FF5E4F',
    marginTop: 5,
  },

  appContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#FFFFFF88',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },

  appDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%',
  },

  appIcon: {
    width: 40,
    height: 40,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
  },

  appInfo: {
    flexDirection: 'column',
    maxWidth: '70%',
  },

  appName: {
    fontSize: 16,
    color: '#404040',
    fontFamily: 'OutfitRegular',
    marginBottom: 5,
  },

  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 8,
    width: '100%',
  },

  progressBar: {
    height: '100%',
    borderRadius: 5,
  },

  appTime: {
    fontFamily: 'OutfitMedium',
    fontSize: 16,
    color: '#404040',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f5f4f4',
    borderRadius: 20,
    paddingVertical: 15,
    marginTop: 20,

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,
  },
  chart: {
    marginVertical: 8,
  },
  label: {
    fontSize: 18,
    fontFamily: 'OutfitRegular',
    marginBottom: 10,
  },
  chartHeader: {
    fontFamily: 'OutfitMedium',
    color: '#404040',
    fontSize: 22
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
});
