import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable,Image, Animated, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ScreenTimeClock from '../components/ScreenTimeClock';
import AppList from '../AppList.json';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import Ionicons from '@expo/vector-icons/Ionicons';

const HomePage = () => {
  const { fetchScreentime } = useAuth();
  const [todaysData,setTodaysData] = useState(null);

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
      const transformedData = records.map(transformScreentimeData);
      const todaysData = getTodaysData(transformedData);
      setTodaysData(todaysData);

      console.log("today",todaysData)
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

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={{marginBottom: 0,display: 'flex',flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',width: '90%',padding: 10}}>
          <View>
            <Text style={styles.headerText}>Hello,</Text>
            <Text style={styles.headerUserName}>Aryaman.</Text>
          </View>
          <Ionicons name="notifications" size={30} color="black" />
        </View>
        <ScreenTimeClock 
          screentime={todaysData ? todaysData.totalScreentime : 0} 
          limit={180}
        />
        {
          todaysData!=null
          ?
          <View style={styles.topApps}>
            <View style={{marginBottom: 20}}>
              <Text style={{fontFamily: 'MontserratSemiBold',fontSize: 25}}>Today's App Usage</Text>
            </View>
            {
              todaysData.apps.map(app => {
                return(
                  <View style={styles.appContainer} key={app.id}>
                      <View style={{display: 'flex',flexDirection: 'row',alignItems: 'center',maxWidth: '75%',overflow: 'hidden'}}>
                          <Image
                              source={{ uri: app.appIconUrl }}
                              style={{ width: 35, height: 35, marginRight: 15, borderRadius: 10 }}
                              resizeMode="contain"
                          />
                          <Text style={{fontFamily: 'MontserratMedium',}}>{app.name}</Text>
                      </View>
                      <View>
                        <Text style={{fontFamily: 'MontserratSemiBold',color: '#000'}}>{convertTime(app.totalMinutes)}</Text>
                      </View>
                  </View>
                )
              })
            }
          </View>
          :
          null
        }
      </ScrollView>
    </View>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f4f4',
    // justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    width: '100%',
    paddingBottom: 100, // Adjust this to leave space above the navbar
    alignItems: 'center', // Center content if needed
    
  },
  headerText: {
    fontSize: 30,
    color: '#636e72', // Subtle gray text
    fontFamily: 'MontserratMedium',
    opacity: 0.5
  },
  headerUserName: {
    fontSize: 45,
    color: '#404040',
    fontFamily: 'MontserratSemiBold',
  },
  appContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#f5f4f4',
    padding: 15,
    borderRadius: 10
  },
  topApps: {
    backgroundColor: '#fff',
    width: "90%",
    padding: 15,
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 20
  }
});
