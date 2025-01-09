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

const HomePage = () => {
  const { fetchScreentime, fetchUserDetails } = useAuth();
  const [todaysData,setTodaysData] = useState(null);
  const [userData,setUserData] = useState(null);

  dayjs.extend(advancedFormat);
  dayjs.extend(isoWeek);

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
    } catch (error) {
      console.error('Error fetching screentime:', error.message);
    }
  };

  const convertTime = (time) => {
    const hours = Math.floor(time / 60);
    const minutes = Math.floor(time % 60);

    if(hours>0){
      return `${hours}h ${minutes}m`;
    }
    else{
      return `${minutes}m`;
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // useEffect(() => {
  //   fetchData();
  // }, []);

  if(userData){
    return (
      <LinearGradient
              colors={['#E7F6F6', '#FBEFEF', '#F9FBFA']}
              style={[styles.container, { padding: 20 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={{marginBottom: 0,display: 'flex',flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',width: '95%',padding: 10}}>
            <View>
              <Text style={styles.headerText}>Hello,</Text>
              <Text style={styles.headerUserName}>Aryaman.</Text>
            </View>
            <Ionicons name="notifications" size={30} color="black" />
          </View>
          {
            todaysData ? (
              <View style={styles.topApps}>
                
                <View style={{ display: 'flex', flexDirection: 'row',justifyContent: 'space-between',padding: 15, }}>
                  <View>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontFamily: 'OutfitRegular', fontSize: 14, color: '#404040' }}>Screen Time</Text>
                    </View>
                    <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 25, color: '#000' }}>{convertTime(todaysData.totalScreentime)}</Text>
                  </View>
                  <View>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontFamily: 'OutfitRegular', fontSize: 14, color: '#404040' }}>Time Remaining</Text>
                    </View>
                    <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 25, color: '#000' }}>{(userData?.screentimeLimit*60-todaysData.totalScreentime) > 0 ? convertTime((userData?.screentimeLimit*60)-todaysData.totalScreentime) : 0}</Text>
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
                <View style={{ display: 'flex', flexDirection: 'row',justifyContent: 'space-between',padding: 15, }}>
                  <View>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontFamily: 'OutfitRegular', fontSize: 14, color: '#404040' }}>Screen Time</Text>
                    </View>
                    <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 25, color: '#000' }}>0h 0m</Text>
                  </View>
                  <View>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontFamily: 'OutfitRegular', fontSize: 14, color: '#404040' }}>Time Remaining</Text>
                    </View>
                    <Text style={{ fontFamily: 'OutfitSemiBold', fontSize: 25, color: '#000' }}>{convertTime(userData?.screentimeLimit*60)}</Text>
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
    width: '100%',
    paddingBottom: 100, // Adjust this to leave space above the navbar
    alignItems: 'center', // Center content if needed
    
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
  appContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    padding: 15,
    borderRadius: 10,
    // backgroundColor: '#fff',
    // // iOS shadow
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 5 },
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // // Android shadow
    // elevation: 5,
  },
  topApps: {
    width: "95%",
    padding: 10,
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,

    marginTop: 20
  },
  progressBarContainer: {
    height: 10, // Height of the progress bar
    backgroundColor: '#e0e0e0', // Background of the bar for visibility
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 8, // Space between the progress bar and app details
    width: '100%', // Full width of the container
  },
  progressBar: {
    height: '100%', // Match the height of the container
    borderRadius: 5,
  },
});
