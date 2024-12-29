import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable,Image, Animated, KeyboardAvoidingView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import DropDownPicker from 'react-native-dropdown-picker';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import AppList from '../AppList.json';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AccountPage = () => {
  const { logout } = useAuth();
  const navigation = useNavigation();

  const { fetchScreentime } = useAuth();

  dayjs.extend(advancedFormat);
  dayjs.extend(isoWeek);
  const [chartData, setChartData] = useState({ labels: [], data: [] });
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [groupBy, setGroupBy] = useState('week');
  const [open, setOpen] = useState(false); // Controls dropdown visibility
  const [selectedApp, setSelectedApp] = useState('All Apps'); // Selected app
  const [availableApps, setAvailableApps] = useState([
    { label: 'All Apps', value: 'All Apps', icon: () => (<AntDesign style={styles.icon} name="appstore-o" size={26} color="black" />) },
  ]);
  const animatedValue = useRef(new Animated.Value(8)).current; // Ref for dot size animation
  const animatedOpacity = useRef(new Animated.Value(1)).current;

  const animatedValues = {
    year: new Animated.Value(groupBy === 'year' ? 1 : 0),
    month: new Animated.Value(groupBy === 'month' ? 1 : 0),
    week: new Animated.Value(groupBy === 'week' ? 1 : 0),
  };

  const fetchData = async () => {
    try {
      const records = await fetchScreentime();
      const transformedData = records.map(transformScreentimeData);

      const appsMap = new Map();
      appsMap.set('All Apps', { label: 'All Apps', value: 'All Apps', appIconUrl: 'appstore-o' });

      transformedData.forEach((record) => {
        record.apps.forEach((app) => {
          if (!appsMap.has(app.name)) {
            appsMap.set(app.name, {
              label: app.name,
              value: app.name,
              appIconUrl: app.appIconUrl,
            });
          }
        });
      });

      // Convert the Map values to an array and format them for the dropdown
      const formattedApps = Array.from(appsMap.values()).map((app) => {
        return {
          label: app.label,
          value: app.value,
          icon: () =>
            app.appIconUrl ? (
              app.label === 'All Apps'
              ?
              <AntDesign style={styles.icon} name="appstore-o" size={26} color="black" />
              :
              <Image source={{ uri: app.appIconUrl }} style={styles.icon} />
            ) : null,
        }
      });

      setAvailableApps(formattedApps);
      updateChartData(transformedData, groupBy, selectedApp);
    } catch (error) {
      console.error('Error fetching screentime:', error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupBy, selectedApp]);

  useFocusEffect(
    React.useCallback(() => {
      fetchData(); // Refresh data when the screen is focused
    }, [])
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
  

  const groupData = (data, groupBy) => {
    const groupingStrategies = {
      week: (date) => {
        // Calculate the week number
        const weekStart = dayjs(date).startOf('week');
        const weekEnd = weekStart.endOf('week');
        return {
          weekLabel: `Week ${Math.ceil(dayjs(date).date() / 7)}`,
          weekStart: weekStart.format('MMM D'),
          weekEnd: weekEnd.format('D'),
        };
      },
      month: (date) => dayjs(date).format('MMMM YYYY'),
      year: (date) => dayjs(date).year(),
    };
  
    return data.reduce((acc, item) => {
      const { weekLabel, weekStart, weekEnd } = groupingStrategies[groupBy](item.date);
      const weekRange = `${weekStart} to ${weekEnd}`;
  
      if (!acc[weekLabel]) acc[weekLabel] = { screentime: 0, range: weekRange };
  
      if (selectedApp === 'All Apps') {
        acc[weekLabel].screentime += item.totalScreentime;
      } else {
        const appScreentime = item.apps.find((app) => app.name === selectedApp);
        if (appScreentime) acc[weekLabel].screentime += appScreentime.totalMinutes;
      }
  
      return acc;
    }, {});
  };
  
  const updateChartData = (data, groupBy, selectedApp) => {
    Animated.timing(animatedOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      const groupedData = groupData(data, groupBy);
      const labels = Object.keys(groupedData).sort();
      const dataset = labels.map((label) => groupedData[label].screentime);
      const ranges = labels.map((label) => groupedData[label].range);

      setChartData({ labels, data: dataset, ranges });

      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const formatTime = (value) => {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${hours}h ${minutes}m`;
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

  const handlePress = (newGroupBy) => {
    Object.keys(animatedValues).forEach((key) => {
      Animated.timing(animatedValues[key], {
        toValue: key === newGroupBy ? 1 : 0,
        duration: 200,
        useNativeDriver: false, // Scale and opacity don't support native driver
      }).start();
    });
    setGroupBy(newGroupBy);
  };

  const getStyleForGroup = (key) => {
    return {
      backgroundColor: animatedValues[key].interpolate({
        inputRange: [0, 1],
        outputRange: ['#fff', '#f5f4f4'],
      }),
      transform: [
        {
          scale: animatedValues[key].interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.1],
          }),
        },
      ],
      opacity: animatedValues[key].interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
      }),
    };
  };

  const handleLogout = () => {
    logout(navigation); // Call the logout function and pass the navigation prop to navigate after logout
  };
  return (
    <KeyboardAvoidingView style={{width: '100%',flex:1}}>
      <SafeAreaView edges={['right', 'left']} style={styles.container} >
      <View style={styles.header}>
          <Pressable>
            <AntDesign name="user" size={30} color="black" />
          </Pressable>
          <View style={{display: 'flex',flexDirection: 'row'}}>
            <Pressable style={{marginRight: 15}} onPress={handleLogout}>
              <MaterialIcons name="logout" size={30} color="black" />
            </Pressable>
            <Pressable>
              <Ionicons name="settings" size={30} color="black" />
            </Pressable>
          </View>
      </View>
      <View style={{backgroundColor: '#fff',width: '90%',borderRadius: 10,padding: 15,display: 'flex',justifyContent: 'center',alignItems: 'center',marginVertical: 10}}>
        <View style={{display: 'flex',alignItems: 'flex-start',width: '100%',marginBottom: 20}}>
          {selectedPointIndex !== null
              ? 
              <View style={{display: 'flex',flexDirection: 'row',width: '100%',justifyContent: 'space-between'}}>
                <Text style={styles.chartHeader}>{chartData.ranges[selectedPointIndex]}</Text>
                <Text style={styles.chartHeader}>{formatTime(chartData.data[selectedPointIndex])}</Text>
              </View>
              : chartData.labels.length
              ? 
              <View style={{display: 'flex',flexDirection: 'row',width: '100%',justifyContent: 'space-between'}}>
                <Text style={styles.chartHeader}>{chartData.ranges[chartData.labels.length - 1]}</Text>
                <Text style={styles.chartHeader}>{formatTime(chartData.data[chartData.data.length - 1])}</Text>
              </View>
              : 
              <Text>No data available</Text>}
        </View>
        <DropDownPicker
          open={open}
          value={selectedApp}
          items={availableApps}
          setOpen={setOpen}
          setValue={setSelectedApp}
          setItems={setAvailableApps}
          placeholder="Select an App"
          dropDownContainerStyle={styles.dropdownContainer}
          style={styles.dropdown}
          textStyle={styles.dropdownText}
        />
        <Animated.View style={{ opacity: animatedOpacity }}>
          <LineChart
            data={{
              labels: chartData.labels.length ? chartData.labels : ['No Data'],
              datasets: [{ data: chartData.data.length ? chartData.data : [0] }],
            }}
            width={Dimensions.get('window').width * 0.9 - 20} // Parent container's width 90% - padding*2
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity) => `rgba(64, 64, 64, ${opacity})`,
              labelColor: (opacity) => `rgba(0, 0, 0, ${opacity})`,
            }}
            withDots={true} // Disable default dots
            // bezier
            renderDotContent={({ x, y, index }) => {
              const isSelected = selectedPointIndex === index;
            
              return (
                <Animated.View
                  key={index}
                  style={{
                    width: isSelected ? animatedValue : 8,
                    height: isSelected ? animatedValue : 8,
                    borderRadius: 6,
                    backgroundColor: isSelected ? '#000' : '#fff',
                    borderWidth: isSelected ? 0 : 2,
                    borderColor: '#000',
                    position: 'absolute',
                    left: x - 4,
                    top: y - 4,
                  }}
                />
              );
            }}
            formatYLabel={formatTime}
            segments={chartData.data.length}
            onDataPointClick={handleDataPointClick}
            style={styles.chart}
          />
        </Animated.View>
        
        <View style={styles.dateCategory}>
          {['year', 'month', 'week'].map((key) => (
            <Pressable key={key} onPress={() => handlePress(key)}>
              <Animated.View style={[styles.dateGroup, getStyleForGroup(key)]}>
                <Text style={{ fontFamily: 'InterHeadingRegular' }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}ly
                </Text>
              </Animated.View>
            </Pressable>
          ))}
        </View>
      </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

export default AccountPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f4f4',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%'
  },
  chart: {
    marginVertical: 8,
  },
  label: {
    fontSize: 18,
    fontFamily: 'InterHeadingRegular',
    marginBottom: 10,
  },
  chartHeader: {
    fontFamily: 'InterHeadingMedium',
    color: '#000',
    fontSize: 18
  },
  dateCategory: {
    display: 'flex',
    flexDirection: 'row',
    width: '90%',
    padding: 5,
    borderRadius: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f5f4f4'
  },
  dateGroup: {
    backgroundColor: '#f5f4f4',
    padding: 10,
    borderRadius: 5,
  },
  dropdown: {
    width: '100%',
    borderRadius: 5,
    padding: 10,
    marginVertical: 15,
    backgroundColor: '#f5f4f4',
    borderWidth: 0
  },
  dropdownContainer: {
    width: '100%',
    borderWidth: 0,
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f5f4f4',
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'InterHeadingRegular',
  },
  icon: {
    width: 30, // Adjust as needed
    height: 30,
    resizeMode: 'contain',
    marginRight: 10, // Space between icon and label
    borderRadius: 5
  },
})