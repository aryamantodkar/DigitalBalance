import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable,Image, Animated, KeyboardAvoidingView, ScrollView } from 'react-native';
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
import moment from 'moment';

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
    const currentDate = dayjs(); // Get today's date
    const groupingStrategies = {
      week: (date) => {
        const weekStart = dayjs(date).startOf('week');
        const weekEnd = weekStart.endOf('week');
      
        // Check if the week belongs to the current month
        const isCurrentMonth = weekStart.month() === currentDate.month();
        if (!isCurrentMonth) return null; // Skip weeks that aren't in the current month
      
        // If the start and end month are different, display both months with full names
        const weekStartMonth = weekStart.format('MMMM');
        const weekEndMonth = weekEnd.format('MMMM');
    
        let weekRange = `${weekStart.format('MMMM D')} - ${weekEnd.format('D')}`;
        if (weekStartMonth !== weekEndMonth) {
          weekRange = `${weekStart.format('MMMM D')} - ${weekEnd.format('MMMM D')}`;
        }
    
        return {
          weekLabel: `Week ${Math.ceil(dayjs(date).date() / 7)}`,
          weekStart: weekStart.format('MMMM D'),
          weekEnd: weekEnd.format('D'),
          weekRange,
          weekStartDate: weekStart, // Add start date for sorting
        };
      },
      month: (date) => {
        // Return month as a number (0-11) and year for sorting, adjust to 1-indexed month
        return [dayjs(date).year(), dayjs(date).month() + 1]; // Adjust month by adding 1
      },
      year: (date) => {
        return dayjs(date).year(); // Group by year for all available years in the data
      },
    };
  
    // Group the data based on the selected grouping strategy (week, month, year)
    const groupedData = data.reduce((acc, item) => {
      const group = groupingStrategies[groupBy](item.date);
  
      if (!group) return acc; // Skip data that doesn't fit the selected grouping strategy
  
      const { weekLabel, weekRange, weekStartDate } = group;
    
      // For "week" and "month" grouping, use the same weekLabel for simplicity
      const label = groupBy === 'week' ? weekLabel : groupBy === 'month' ? `${group[0]}-${group[1]}` : group;
    
      if (!acc[label]) acc[label] = { screentime: 0, range: weekRange || group };
    
      if (selectedApp === 'All Apps') {
        acc[label].screentime += item.totalScreentime;
      } else {
        const appScreentime = item.apps.find((app) => app.name === selectedApp);
        if (appScreentime) acc[label].screentime += appScreentime.totalMinutes;
      }
    
      acc[label].range = weekRange || group;
    
      // Store the start date for sorting the data by date in ascending order
      if (weekStartDate) acc[label].weekStartDate = weekStartDate;
    
      return acc;
    }, {});
  
    // Sort the data based on the start date for week or month groupings
    const sortedGroupedData = Object.keys(groupedData)
  .sort((a, b) => {
    let aDate, bDate;
  
    // Parse date for months and years
    if (groupBy === 'month') {
      const aMonth = groupedData[a].range[1]; // Month number (e.g., 12 for December)
      const bMonth = groupedData[b].range[1]; // Month number (e.g., 11 for November)
      const aYear = groupedData[a].range[0]; // Year (e.g., 2024)
      const bYear = groupedData[b].range[0]; // Year (e.g., 2024)

      // Create date objects properly with the correct month and year
      aDate = dayjs(`${aYear}-${aMonth}-01`, 'YYYY-MM-DD').month(aMonth); // Adjust for 0-indexed months
      bDate = dayjs(`${bYear}-${bMonth}-01`, 'YYYY-MM-DD').month(bMonth);
    } else {
      // Sort weeks and years normally (if needed)
      aDate = groupedData[a].weekStartDate || dayjs(a, 'MMMM');
      bDate = groupedData[b].weekStartDate || dayjs(b, 'MMMM');
    }
  
    // Sort by ascending order to show the latest month/week on the right
    return aDate.isBefore(bDate) ? -1 : 1;
  })
  .reduce((acc, label) => {
    // After sorting, convert month numbers to month names
    if (groupBy === 'month') {
      const monthIndex = groupedData[label].range[1]; // Convert to 0-based index
      const monthName = dayjs().month(monthIndex-1).format('MMMM'); // Get the full month name
      groupedData[label].range = monthName + ' ' + groupedData[label].range[0]; // e.g., "December 2024"
    }
    
    acc[label] = groupedData[label];
    return acc;
  }, {});
  
    return sortedGroupedData;
  };
  
  
  const updateChartData = (data, groupBy, selectedApp) => {
    Animated.timing(animatedOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Group data based on the selected strategy (week, month, etc.)
      const groupedData = groupData(data, groupBy);
      const labels = Object.keys(groupedData).sort();
      const dataset = labels.map((label) => groupedData[label].screentime);
      const ranges = labels.map((label) => groupedData[label].range);
  
      // Update chart data state
      setChartData({ labels, data: dataset, ranges });
  
      // Set the selected point index to the last data point by default
      setSelectedPointIndex(dataset.length - 1);
  
      // Animate the chart data opacity back to full visibility
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

  const getMonthName = (month) => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return monthNames[month - 1] || ''; // Convert 1-indexed month to 0-indexed
  };

  const updatedLabels = chartData.labels.map((label) => {
    const [year, month] = label.split('-'); // Split 'YYYY-MM' into year and month
    return `${getMonthName(parseInt(month, 10))}`; // Format as 'MonthName Year'
  });

  return (
    <KeyboardAvoidingView style={{width: '100%',flex:1,backgroundColor: '#f9fbfa',}}>
      <View style={{display: 'flex',justifyContent: 'center',alignItems: 'center',margin: 'auto',paddingTop: 10}}>
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
      </View>
      <ScrollView contentContainerStyle={styles.container} >
      
      <View style={styles.chartContainer}>
        <View style={{display: 'flex',alignItems: 'flex-start',width: '100%',marginBottom: 20}}>
          {selectedPointIndex !== null
              ? 
              <View style={{display: 'flex',flexDirection: 'column',width: '100%',justifyContent: 'space-between'}}>
                <View style={{marginBottom: 10}}>
                  <Text style={styles.chartHeader}>{chartData.ranges[selectedPointIndex]}</Text>
                </View>
                <View style={{marginTop: 10,display: 'flex',flexDirection: 'column'}}>
                  <View style={{marginBottom: 10}}>
                    <Text style={[styles.chartHeader,{fontSize: 15,color: '#808080'}]}>Screen Time</Text>
                  </View>
                  <Text style={[styles.chartHeader,{fontFamily: 'InterHeadingBold'}]}>{formatTime(chartData.data[selectedPointIndex])}</Text>
                </View>
              </View>
              : chartData.labels.length
              ? 
              <View style={{display: 'flex',flexDirection: 'column',width: '100%',justifyContent: 'space-between'}}>
                <View style={{marginBottom: 10}}>
                  <Text style={styles.chartHeader}>{chartData.ranges[chartData.labels.length - 1]}</Text>
                </View>
                <View style={{marginTop: 10}}>
                  <Text style={styles.chartHeader}>{formatTime(chartData.data[chartData.data.length - 1])}</Text>
                </View>
              </View>
              : 
              <Text>No data available</Text>}
        </View>
        <Animated.View style={{ opacity: animatedOpacity }}>
          <LineChart
            data={{
              labels: updatedLabels.length ? updatedLabels : ['No Data'], // Use updated month names
              datasets: [{ data: chartData.data.length ? chartData.data : [0] }],
            }}
            width={Dimensions.get('window').width * 0.9 - 20} // Parent container's width 90% - padding*2
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity) => `rgba(0, 241, 96, 0.6)`,
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
                    backgroundColor: isSelected ? '#00C950' : '#fff',
                    borderWidth: isSelected ? 0 : 2,
                    borderColor: 'rgba(0, 201, 80, 1)',
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
            <Pressable style={{}} key={key} onPress={() => handlePress(key)}>
              <Animated.View style={[styles.dateGroup, getStyleForGroup(key)]}>
                <Text style={{ fontFamily: 'InterHeadingRegular' }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}ly
                </Text>
              </Animated.View>
            </Pressable>
          ))}
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default AccountPage

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fbfa',
    alignItems: 'center',
    margin: 'auto',
    flexDirection: 'column',
    height: '100%',
    width: '100%'
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 20
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
    color: '#404040',
    fontSize: 22
  },
  dateCategory: {
    display: 'flex',
    flexDirection: 'row',
    width: '90%',
    padding: 5,
    borderRadius: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,
  },
  dateGroup: {
    backgroundColor: '#f5f4f4',
    padding: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  dropdown: {
    width: '90%',
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderWidth: 0,

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,
  },
  dropdownContainer: {
    width: '90%',
    borderWidth: 0,
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f5f4f4',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,
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
  chartContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f5f4f4',
    width: '90%',
    borderRadius: 10,
    padding: 15,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,
  }
})