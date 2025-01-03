import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable,Image, Animated, KeyboardAvoidingView, ScrollView } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import DropDownPicker from 'react-native-dropdown-picker';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import AppList from '../../AppList.json';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import isBetween from 'dayjs/plugin/isBetween';
import Carousel from 'react-native-reanimated-carousel';
import Svg, { Path, LinearGradient, Stop, Defs } from 'react-native-svg';
import utc from 'dayjs/plugin/utc';

const AccountPage = () => {
  dayjs.extend(isBetween);
  dayjs.extend(advancedFormat);
  dayjs.extend(isoWeek);
  dayjs.extend(utc);

  const { logout } = useAuth();
  const navigation = useNavigation();
  const width = Dimensions.get('window').width;
  const height = 150;
  const amplitude = 40; // Height of the sine wave
  const frequency = 2; // Number of waves

  const createSinePath = () => {
    let path = `M 0 ${height / 2}`;
    for (let x = 0; x <= width; x++) {
      const y = height / 2 + amplitude * Math.sin((x / width) * frequency * 2 * Math.PI);
      path += ` L ${x} ${y}`;
    }
    // Add a line to the bottom-right and back to the bottom-left without closing the path
    path += ` L ${width} ${height} L 0 ${height}`;
    return path;
  };

  const { fetchScreentime } = useAuth();

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
  const [insights,setInsights] = useState([]);

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

      const insights = generateInsights(transformedData);

      setInsights(insights);
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

  const aggregateScreentimeData = (screentimeArray) => {
    const appUsageMap = {};
  
    screentimeArray.forEach((screentime) => {
      screentime.apps.forEach((app) => {
        if (appUsageMap[app.name]) {
          appUsageMap[app.name].usageMinutes += app.totalMinutes;
        } else {
          appUsageMap[app.name] = {
            usageMinutes: app.totalMinutes,
            appIconUrl: app.appIconUrl, // Store the appIconUrl
          };
        }
      });
    });
  
    const aggregatedData = Object.entries(appUsageMap).map(([name, { usageMinutes, appIconUrl }]) => ({
      name,
      usageMinutes,
      appIconUrl,
    }));
  
    return aggregatedData;
  };  

  const generateInsights = (data) => {
    const avgDaily = calculateAverageScreentime(data);
    const { bestDay, worstDay } = findBestAndWorstDays(data);
    const { currentWeekData, lastWeekData } = getWeekData(data);
    const percentageChange = (calculatePercentageChange(currentWeekData, lastWeekData))?.toFixed(2);
    const { totalDays: fiveYearDays } = calculateProjectedScreentime(avgDaily, 5);
    const { totalDays: fiftyYearDays } = calculateProjectedScreentime(avgDaily, 50);

    const insights = [
      {
        fiveYearDays,
        fiftyYearDays,
        avgDaily, 
      },
      {
        percentageChange,
        avgDaily,
      },
      {
        bestDay,
        worstDay,
      }
    ];

    return insights;
  };

  const calculatePercentageChange = (currentPeriod, previousPeriod) => {
    
    const currentTotal = currentPeriod.reduce((total, day) => total + day.totalScreentime, 0);
    const previousTotal = previousPeriod.reduce((total, day) => total + day.totalScreentime, 0);
  
    if (previousTotal === 0) return null; // Avoid division by zero
  
    return ((currentTotal - previousTotal) / previousTotal) * 100;
  };

  const findBestAndWorstDays = (data) => {
    if (!data || data.length === 0) return { bestDay: null, worstDay: null };
  
    const bestDay = data.reduce((min, day) => (day.totalScreentime < min.totalScreentime ? day : min), data[0]);
    const worstDay = data.reduce((max, day) => (day.totalScreentime > max.totalScreentime ? day : max), data[0]);
  
    const bestDayFormatted = dayjs(bestDay.date).format('Do MMM YYYY');
    const worstDayFormatted = dayjs(worstDay.date).format('Do MMM YYYY');

    return {
      bestDay: { ...bestDay, formattedDate: bestDayFormatted },
      worstDay: { ...worstDay, formattedDate: worstDayFormatted },
    };
  };

  const getWeekData = (data) => {
    const today = dayjs();
  
    // Define the start and end of the current week
    const currentWeekStart = today.startOf('week');
    const currentWeekEnd = today.endOf('week');
  
    // Define the start and end of the last week
    const lastWeekStart = currentWeekStart.subtract(1, 'week');
    const lastWeekEnd = currentWeekStart.subtract(1, 'day'); // Day before current week's start
  
    // Filter data for the current week
    const currentWeekData = data.filter((entry) => {
      const entryDate = dayjs(entry.date, 'DD-MM-YY'); // Parse custom date format
      return entryDate.isBetween(currentWeekStart, currentWeekEnd, 'day', '[]');
    });
  
    // Filter data for the last week
    const lastWeekData = data.filter((entry) => {
      const entryDate = dayjs(entry.date, 'DD-MM-YY'); // Parse custom date format
      return entryDate.isBetween(lastWeekStart, lastWeekEnd, 'day', '[]');
    });
  
    return { currentWeekData, lastWeekData };
  };

  const calculateAverageScreentime = (data) => {
    if (!data || data.length === 0) return 0;
  
    const totalScreentime = data.reduce((total, day) => total + day.totalScreentime, 0);
    const daysLogged = data.length;
  
    return Math.round(totalScreentime / daysLogged);
  };

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
  
        // Create a readable label for the week, regardless of the month
        const weekStartMonth = weekStart.format('MMMM');
        const weekEndMonth = weekEnd.format('MMMM');
        const weekRange =
          weekStartMonth === weekEndMonth
            ? `${weekStart.format('MMMM D')} - ${weekEnd.format('D')}`
            : `${weekStart.format('MMMM D')} - ${weekEnd.format('MMMM D')}`;
  
        return {
          weekLabel: `Week ${Math.ceil(weekStart.date() / 7)}`,
          weekRange,
          weekStartDate: weekStart,
        };
      },
      month: (date) => {
        const month = dayjs(date).month(); // 0-based month index
        const year = dayjs(date).year();
        return { year, month };
      },
      year: (date) => {
        return dayjs(date).year();
      },
    };
  
    const groupedData = data.reduce((acc, item) => {
      const group = groupingStrategies[groupBy](item.date);
  
      if (!group) return acc; // Skip if grouping is not valid
  
      const { weekLabel, weekRange, weekStartDate } = group;
  
      // Determine label based on grouping strategy
      let label;
      if (groupBy === 'week') {
        label = weekLabel;
      } else if (groupBy === 'month') {
        label = `${group.year}-${group.month + 1}`; // Adjust month to 1-based
      } else {
        label = group;
      }
  
      if (!acc[label]) acc[label] = { screentime: 0, range: weekRange || label };
  
      // Add screentime data
      if (selectedApp === 'All Apps') {
        acc[label].screentime += item.totalScreentime;
      } else {
        const appScreentime = item.apps.find((app) => app.name === selectedApp);
        if (appScreentime) acc[label].screentime += appScreentime.totalMinutes;
      }
  
      if (weekStartDate) acc[label].weekStartDate = weekStartDate;
  
      return acc;
    }, {});
  
    // Sort and format grouped data
    const sortedGroupedData = Object.keys(groupedData)
    .sort((a, b) => {
      let aDate, bDate;
    
      if (groupBy === 'month') {
        const [aYear, aMonth] = a.split('-');
        const [bYear, bMonth] = b.split('-');
        
        // Create the dayjs object for proper UTC comparison
        aDate = dayjs.utc(`${aYear}-${aMonth.padStart(2, '0')}-01`, 'YYYY-MM-DD'); // Ensure a valid date format with day
        bDate = dayjs.utc(`${bYear}-${bMonth.padStart(2, '0')}-01`, 'YYYY-MM-DD');
    
      } else {
        aDate = groupedData[a].weekStartDate || dayjs(a, 'MMMM');
        bDate = groupedData[b].weekStartDate || dayjs(b, 'MMMM');
      }
    
      return aDate.isBefore(bDate) ? -1 : 1;
    })
    .reduce((acc, label) => {
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

      if(groupBy=='month'){
        const monthLabels = labels.map((label) => {
          const [year, monthIndex] = label.split('-'); // Split the year and month
          return dayjs.utc(`${year}-${monthIndex.padStart(2, '0')}`).format('MMM YY'); // Format as "Nov 2024"
        });

        const monthRanges = labels.map((label) => {
          const [year, monthIndex] = label.split('-'); // Split the year and month
          return dayjs.utc(`${year}-${monthIndex.padStart(2, '0')}`).format('MMMM YYYY'); // Format as "Nov 2024"
        });

        setChartData({ labels: monthLabels, data: dataset, ranges: monthRanges });
      }
      else{
        setChartData({ labels, data: dataset, ranges });
      }
  
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

  const formatTime = (time) => {
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
    const backgroundColor = animatedValues[key].interpolate({
      inputRange: [0, 1],
      outputRange: ['#fff', '#f5f4f4'],
    });
  
    const scale = animatedValues[key].interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.1],
    });
  
    const opacity = animatedValues[key].interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });
  
    // Return style object without directly reading in render
    return {
      backgroundColor,
      transform: [{ scale }],
      opacity,
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

  const calculateProjectedScreentime = (dailyAverageMinutes, projectionYears) => {
    const yearlyMinutes = dailyAverageMinutes * 365;
    const totalMinutes = yearlyMinutes * projectionYears;
  
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
  
    return { totalMinutes, totalHours, totalDays };
  };

  const updatedLabels = chartData.labels.map((label) => {
    if (label.startsWith("Week")) {
      return label; // Keep the week label as is
    } else if (label.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = label.split('-'); // Split 'YYYY-MM' into year and month
      return `${getMonthName(parseInt(month, 10))}`; // Format as 'MonthName'
    } else if (label.match(/^\d{4}$/)) {
      return label; // Return the 4-digit year as is
    } else {
      return label; // Fallback, keep other labels unchanged
    }
  });  

  return (
    <KeyboardAvoidingView style={{width: '100%',flex:1,backgroundColor: '#f9fbfa',flex: 1,height: '100%'}}>
          <View style={{display: 'flex',justifyContent: 'center',alignItems: 'center',margin: 'auto',paddingTop: 10,width: '100%'}}>
            <View style={{display: 'flex',flexDirection: 'row',justifyContent: 'space-between',width: '90%',paddingHorizontal: 5}}>
              <Pressable>
                <Ionicons name="settings" size={25} color="black" />
              </Pressable>
              <Pressable onPress={handleLogout}>
                <MaterialIcons name="logout" size={25} color="black" />
              </Pressable>
            </View>
            <View style={styles.header}>
              <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              padding: 15, 
              height: 130, 
              width: '100%', 
            }}>
              {/* Profile Picture Section */}
              <Pressable 
                style={{ 
                  width: '35%', 
                  justifyContent: 'center', 
                  alignItems: 'center' ,
                  // iOS shadow
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.1,
                  shadowRadius: 5,
                  // Android shadow
                  elevation: 5,
                }}
              >
                <Image
                  source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4CtMpBDpj9ZrS106hAnAagEFIqo2DesVmXQ&s' }}
                  style={{ 
                    width: 90, 
                    height: 90, 
                    borderRadius: 45, 
                    borderWidth: 2, 
                    borderColor: '#E5E7EB' // Light border for emphasis
                  }}
                  resizeMode="cover"
                />
              </Pressable>
              
              {/* Text and Button Section */}
              <View 
                style={{ 
                  flex: 1, 
                  justifyContent: 'space-between', 
                  height: '100%', 
                  paddingLeft: 16 
                }}
              >
                {/* User Name */}
                <Text 
                  style={{ 
                    fontFamily: 'InterHeadingBold', 
                    fontSize: 20, 
                    color: '#1F2937' // Dark grey for readability 
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Aryaman Todkar
                </Text>
                
                {/* Followers & Following */}
                <Text 
                  style={{ 
                    fontFamily: 'InterHeadingRegular', 
                    fontSize: 14, 
                    color: '#4B5563' // Medium grey for secondary text 
                  }}
                >
                  <Text style={{ fontFamily: 'InterHeadingBold', color: '#111827' }}>13</Text> Followers | 
                  <Text style={{ fontFamily: 'InterHeadingBold', color: '#111827' }}> 12</Text> Following
                </Text>
                
                {/* Follow Button */}
                <Pressable 
                  style={{ 
                    backgroundColor: '#10B981', // Calming green to signify positive action
                    paddingVertical: 8, 
                    paddingHorizontal: 16, 
                    borderRadius: 6, 
                    alignSelf: 'flex-start', // Button will adjust to its content
                    // iOS shadow
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                    // Android shadow
                    elevation: 5,
                  }}
                >
                  <Text 
                    style={{ 
                      color: '#FFFFFF', 
                      fontSize: 14, 
                      fontWeight: '600' 
                    }}
                  >
                    Follow
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
          <View style={{display: 'flex',justifyContent: 'center',alignItems: 'center',margin: 'auto'}}>
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
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container} >
        <View style={styles.chartContainer}>
          <View style={{display: 'flex',alignItems: 'flex-start',width: '100%',marginBottom: 20}}>
            {selectedPointIndex !== null
                ? 
                <View style={{display: 'flex',flexDirection: 'column',width: '100%',justifyContent: 'space-between'}}>
                  <View style={{marginBottom: 10}}>
                    <Text style={[styles.chartHeader,{color: '#000'}]}>{chartData.ranges[selectedPointIndex]}</Text>
                  </View>
                  <View style={{marginTop: 10,display: 'flex',flexDirection: 'column'}}>
                    <View style={{marginBottom: 10}}>
                      <Text style={[styles.chartHeader,{fontSize: 15,color: '#808080'}]}>Screen Time</Text>
                    </View>
                    <Text style={[styles.chartHeader,{fontFamily: 'InterHeadingBold',color: '#000'}]}>{formatTime(chartData.data[selectedPointIndex])}</Text>
                  </View>
                </View>
                : chartData.labels.length
                ? 
                <View style={{display: 'flex',flexDirection: 'column',width: '100%',justifyContent: 'space-between'}}>
                  <View style={{marginBottom: 10}}>
                    <Text style={[styles.chartHeader,{color: '#000'}]}>{chartData.ranges[chartData.labels.length - 1]}</Text>
                  </View>
                  <View style={{marginTop: 10}}>
                    <Text style={[styles.chartHeader,{color: '#000'}]}>{formatTime(chartData.data[chartData.data.length - 1])}</Text>
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
                color: (opacity) => `rgba(232, 124, 0, 0.7)`,
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
                      backgroundColor: isSelected ? '#FF8801' : '#fff',
                      borderWidth: isSelected ? 0 : 2,
                      borderColor: 'rgba(255, 163, 58, 1)',
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
        {
          insights.length
          ?
          <View style={{marginTop: 20,display: 'flex',height: width}}>
            <Carousel
                loop
                width={width*0.9}
                height={width}
                autoPlay={true}
                data={[...new Array(3).keys()]}
                scrollAnimationDuration={2000}
                onSnapToItem={(index) => {}}
                renderItem={({ index }) => (
                    <View
                        style={{
                            flex: 1,
                            borderWidth: 1,
                            justifyContent: 'center',
                            backgroundColor: '#fff',
                            borderRadius: 10,
                            borderWidth: 0,
                            // iOS shadow
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 5 },
                            shadowOpacity: 0.1,
                            shadowRadius: 5,
                            // Android shadow
                            elevation: 5,
                            margin: 10,
                            borderRadius: 10,
                            
                        }}
                    >
                        {
                          index==0
                          ?
                          <View style={{display: 'flex',justifyContent: 'space-between',alignItems: 'center',height: '100%',borderTopWidth: 4,borderTopColor:'#FF4141',borderRadius: 10}}>
                            <View style={{isplay: 'flex',justifyContent: 'center',alignItems: 'center',width: '100%',padding: 20}}>
                              <AntDesign name="exclamationcircle" size={30} color="#FF4141" style={{marginBottom: 20}}/>
                              <Text style={[styles.message,{color: '#404040',fontFamily: 'InterHeadinRegular'}]}>
                                In the next 5 years, you will spend
                              </Text>
                              <Text style={[styles.stats,{color: 'red'}]}>
                                {insights[index]?.fiveYearDays} DAYS
                              </Text>
                              <Text style={[styles.message,{color: '#404040',fontFamily: 'InterHeadinRegular'}]}>
                                on your phone.
                              </Text>
                            </View>
                            <Svg height={height} width="100%" style={{}}>
                              <Defs>
                                <LinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                                  <Stop offset="0%" stopColor="#FF4141" stopOpacity="1" />
                                  <Stop offset="100%" stopColor="#FF4141" stopOpacity="0" />
                                </LinearGradient>
                              </Defs>
                              <Path
                                d={createSinePath()}
                                fill="url(#waveGradient)"
                                stroke="transparent"
                              />
                            </Svg>
                          </View>
                          : 
                          (
                            index==1
                            ?
                            (
                              insights[index]?.percentageChange<0
                                  ?
                                <View style={{display: 'flex',justifyContent: 'space-between',alignItems: 'center',borderTopWidth: 4,borderTopColor:'#00C950',borderRadius: 10,height: '100%'}}>
                                  <View style={{display: 'flex',justifyContent: 'center',alignItems: 'center',width: '100%',padding: 20,}}>
                                      <AntDesign name="checkcircle" size={30} color="#00C950" style={{marginBottom: 20}}/>
                                      <Text style={[styles.message,{color: '#404040',fontFamily: 'InterHeadinRegular'}]}>
                                        Your screen time this week
                                      </Text>
                                      <Text style={[styles.stats,{color: '#15803D'}]}>
                                        {insights[index]?.percentageChange}% LOWER
                                      </Text>
                                      <Text style={[styles.message,{color: '#404040',fontFamily: 'InterHeadinRegular'}]}>
                                        than last week.
                                      </Text>
                                    </View>
                                    <Svg height={height} width="100%" style={{}}>
                                      <Defs>
                                        <LinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                                          <Stop offset="0%" stopColor="#00C950" stopOpacity="1" />
                                          <Stop offset="100%" stopColor="#00C950" stopOpacity="0" />
                                        </LinearGradient>
                                      </Defs>
                                      <Path
                                        d={createSinePath()}
                                        fill="url(#waveGradient)"
                                        stroke="transparent"
                                      />
                                    </Svg>
                                </View>
                                :
                                (
                                  insights[index]?.percentageChange>0
                                  ?
                                  <View style={{display: 'flex',justifyContent: 'space-between',alignItems: 'center',borderTopWidth: 4,borderTopColor:'red',borderRadius: 10,height: '100%'}}>
                                    <View style={{display: 'flex',justifyContent: 'center',alignItems: 'center',width: '100%',padding: 20,}}>
                                        <AntDesign name="exclamationcircle" size={30} color="red" style={{marginBottom: 20}}/>
                                        <Text style={[styles.message,{color: '#404040',fontFamily: 'InterHeadinRegular'}]}>
                                          Your screen time this week
                                        </Text>
                                        <Text style={[styles.stats,{color: 'red'}]}>
                                          {insights[index]?.percentageChange}% HIGHER
                                        </Text>
                                        <Text style={[styles.message,{color: '#404040',fontFamily: 'InterHeadinRegular'}]}>
                                          than last week.
                                        </Text>
                                      </View>
                                      <Svg height={height} width="100%" style={{}}>
                                        <Defs>
                                          <LinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                                            <Stop offset="0%" stopColor="red" stopOpacity="1" />
                                            <Stop offset="100%" stopColor="red" stopOpacity="0" />
                                          </LinearGradient>
                                        </Defs>
                                        <Path
                                          d={createSinePath()}
                                          fill="url(#waveGradient)"
                                          stroke="transparent"
                                        />
                                      </Svg>
                                  </View>
                                  :
                                  <View style={{display: 'flex',justifyContent: 'space-between',alignItems: 'center',borderTopWidth: 4,borderTopColor:'#404040',borderRadius: 10,height: '100%'}}>
                                    <View style={{display: 'flex',justifyContent: 'center',alignItems: 'center',width: '100%',padding: 20,}}>
                                        <AntDesign name="checkcircle" size={30} color="#404040" style={{marginBottom: 20}}/>
                                        <Text style={[styles.message,{color: '#404040',fontFamily: 'InterHeadinRegular'}]}>
                                          Your screen time this week
                                        </Text>
                                        <Text style={styles.stats}>
                                          {insights[index]?.percentageChange}% HIGHER
                                        </Text>
                                        <Text style={[styles.message,{color: '#404040',fontFamily: 'InterHeadinRegular'}]}>
                                          than last week.
                                        </Text>
                                      </View>
                                      <Svg height={height} width="100%" style={{}}>
                                        <Defs>
                                          <LinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                                            <Stop offset="0%" stopColor="#404040" stopOpacity="1" />
                                            <Stop offset="100%" stopColor="#404040" stopOpacity="0" />
                                          </LinearGradient>
                                        </Defs>
                                        <Path
                                          d={createSinePath()}
                                          fill="url(#waveGradient)"
                                          stroke="transparent"
                                        />
                                      </Svg>
                                  </View>
                                )
                            )
                            :
                            <View style={{display: 'flex',justifyContent: 'space-around',alignItems: 'center',borderRadius: 10,height: '100%',padding: 15}}>
                                <Text style={[styles.message,{color: '#404040',fontFamily: 'InterHeadingRegular',fontSize: 18}]}>Screen Time Analysis</Text>
                                <View style={{display: 'flex',justifyContent: 'center',alignItems: 'center',width: '90%',paddingVertical: 10,backgroundColor: '#F0FDF4',borderRadius: 10,shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 5 },
                                  shadowOpacity: 0.1,
                                  shadowRadius: 5,
                                  // Android shadow
                                  elevation: 5,}}>
                                    <View style={{display: 'flex',flexDirection: 'row',alignItems: 'center',justifyContent: 'center',marginVertical: 5}}>
                                      <Text style={{fontFamily: 'InterHeadingRegular',color: '#404040' }}>Your Best Day</Text>
                                      <MaterialIcons name="sunny" size={24} color="orange"  style={{marginLeft: 10}}/>
                                    </View>
                                    <View style={{marginVertical: 5}}>
                                      <Text style={[styles.message,{color: '#15803D',fontSize: 18,marginBottom: 0}]}>{insights[index]?.bestDay?.formattedDate}</Text>
                                    </View>
                                    <View style={{marginVertical: 5}}>
                                      <Text style={[styles.message,{color: '#16A34A',fontSize: 25,marginBottom: 0}]}>{Math.floor(insights[index]?.bestDay?.totalScreentime / 60)}h {insights[index]?.bestDay?.totalScreentime % 60}m</Text>
                                    </View>
                                </View>
                                <View style={{display: 'flex',justifyContent: 'center',alignItems: 'center',width: '90%',paddingVertical: 10,backgroundColor: '#FEF2F2',borderRadius: 10,shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 5 },
                                  shadowOpacity: 0.1,
                                  shadowRadius: 5,
                                  // Android shadow
                                  elevation: 5,
                                  }}>
                                    <View style={{display: 'flex',flexDirection: 'row',alignItems: 'center',justifyContent: 'center',marginVertical: 5}}>
                                      <Text style={{fontFamily: 'InterHeadingRegular',color: '#404040' }}>Your Worst Day</Text>
                                      <AntDesign name="exclamationcircle" size={20} color="red" style={{marginLeft: 10}}/>
                                    </View>
                                    <View style={{marginVertical: 5}}>
                                      <Text style={[styles.message,{color: '#B91C1C',fontSize: 18,marginBottom: 0}]}>{insights[index]?.worstDay?.formattedDate}</Text>
                                    </View>
                                    <View style={{marginVertical: 5}}>
                                      <Text style={[styles.message,{color: '#DC2626',fontSize: 25,marginBottom: 0}]}>{Math.floor(insights[index]?.worstDay?.totalScreentime / 60)}h {insights[index]?.bestDay?.totalScreentime % 60}m</Text>
                                    </View>
                                </View>
                              </View>
                          )
                        }
                    </View>
                )}
            />
          </View>
          :
          <View></View>
        }
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
    width: '100%',
    paddingBottom: 100,
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
    borderWidth: 2,
    borderColor: '#f5f4f4',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,
    
    minHeight: 250,
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
  },
  message: {
    fontSize: 17,
    color: '#777777',
    fontFamily: 'InterHeadingSemiBold',
    marginBottom: 10,
    textAlign: 'center'
  },
  stats: {
    fontSize: 35,
    color: '#000',
    fontFamily: 'InterHeadingBold',
    marginBottom: 10,
    textAlign: 'center'
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
})