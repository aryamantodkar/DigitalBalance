import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable,Image,Modal , Animated, ScrollView,ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AppList from '../../AppList.json';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import { LineChart, ContributionGraph } from 'react-native-chart-kit';
import DropDownPicker from 'react-native-dropdown-picker';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native'; 

const HomePage = () => {
  const { fetchScreentime, fetchUserDetails } = useAuth();
  const navigation = useNavigation(); 

  const [userData,setUserData] = useState(null);
  const [overtheLimit,setOvertheLimit] = useState(0);
  const [timeSpent,setTimeSpent] = useState(0);
  const [insights,setInsights] = useState([]);

  const [chartData, setChartData] = useState({ labels: [], data: [] });
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [groupBy, setGroupBy] = useState('week');
  const [open, setOpen] = useState(false); // Controls dropdown visibility
  const [selectedApp, setSelectedApp] = useState('All Apps'); // Selected app
  const [availableApps, setAvailableApps] = useState([
    { label: 'All Apps', value: 'All Apps', icon: () => (<AntDesign style={styles.icon} name="appstore-o" size={26} color="#ddd" />) },
  ]);
  const [heatmapData,setHeatmapData] = useState(heatmapData);
  const [streak,setStreak] = useState(0);

  const animatedValue = useRef(new Animated.Value(8)).current; // Ref for dot size animation
  const animatedOpacity = useRef(new Animated.Value(1)).current;

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const animatedValues = {
    year: new Animated.Value(groupBy === 'year' ? 1 : 0),
    month: new Animated.Value(groupBy === 'month' ? 1 : 0),
    week: new Animated.Value(groupBy === 'week' ? 1 : 0),
  };


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

  const fetchData = async () => {
    try {
      const records = await fetchScreentime();
      const userDetails = await fetchUserDetails();

      const transformedData = records.map(transformScreentimeData);
      
      let heatmapData = transformedData.map(data => {
        return {
          date: data.date,
          count: (data.totalScreentime/60)
        }
      })

      heatmapData.sort((a, b) => new Date(a.date) - new Date(b.date));

      const appsMap = new Map();
      appsMap.set('All Apps', { label: 'All Apps', value: 'All Apps', appIconUrl: 'appstore-o' });

      let limit = userDetails.data.screentimeLimit*60;
      let overTheLimit = 0;
      let totalTime = 0;

      transformedData.map(data => {
        overTheLimit += (data.totalScreentime-limit);
        totalTime += data.totalScreentime;
      })

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
              <AntDesign style={styles.icon} name="appstore-o" size={26} color="#ddd" />
              :
              <Image source={{ uri: app.appIconUrl }} style={styles.icon} />
            ) : null,
        }
      });
      const insights = generateInsights(transformedData);
      const preprocessedData = preprocessData(heatmapData);
      const streak = getLongestStreak(preprocessedData);

      setHeatmapData(preprocessedData);
      setStreak(streak);
      setAvailableApps(formattedApps);
      updateChartData(transformedData, groupBy, selectedApp);
      setInsights(insights);
      setTimeSpent(totalTime);
      setOvertheLimit(overTheLimit);
      setUserData(userDetails.data);
    } catch (error) {
      console.error('Error fetching screentime:', error.message);
    }
  };

  const calculatePercentageChange = (currentPeriod, previousPeriod) => {
    
    const currentTotal = currentPeriod.reduce((total, day) => total + day.totalScreentime, 0);
    const previousTotal = previousPeriod.reduce((total, day) => total + day.totalScreentime, 0);
  
    if (previousTotal === 0) return null; // Avoid division by zero
  
    return parseInt(((currentTotal - previousTotal) / previousTotal) * 100);
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
    const currentWeekStart = today.startOf('isoweek');
    const currentWeekEnd = today.endOf('isoweek');
  
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

  const calculateProjectedScreentime = (dailyAverageMinutes, projectionYears) => {
    const yearlyMinutes = dailyAverageMinutes * 365;
    const totalMinutes = yearlyMinutes * projectionYears;
  
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
  
    return { totalMinutes, totalHours, totalDays };
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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    fetchData();
  }, [groupBy, selectedApp]);

  const generateInsights = (data) => {
    const avgDaily = calculateAverageScreentime(data);
    const { bestDay, worstDay } = findBestAndWorstDays(data);
    const { currentWeekData, lastWeekData } = getWeekData(data);
    const percentageChange = (calculatePercentageChange(currentWeekData, lastWeekData));
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

  const convertToYear = (days) => {
    if(days<365) return days;
    else{
      let year = Math.floor(days/365);
      let remDays = (days%365);

      if(remDays>0){
        let months = Math.floor(remDays/12);
        return `${year} Years ${months} Months`;
      }
      return `${year} Years`;
    }
  }

  //chart functions

  const groupData = (data, groupBy) => {
    const currentDate = dayjs(); // Get today's date
  
    const groupingStrategies = {
      week: (date) => {
        const weekStart = dayjs(date).startOf('isoWeek'); // Use isoWeek to start the week on Monday
        const weekEnd = weekStart.endOf('isoWeek');
  
        // Check if the week belongs to the current month
        const isCurrentMonth = weekStart.month() === currentDate.month() || weekEnd.month() === currentDate.month(); // Include weeks that overlap months
        if (!isCurrentMonth) return null; // Skip weeks that aren't in the current month
  
        // If the start and end month are different, display both months with full names
        const weekStartMonth = weekStart.format('MMMM');
        const weekEndMonth = weekEnd.format('MMMM');
  
        let weekRange = `${weekStart.format('MMMM D')} - ${weekEnd.format('D')}`;
        if (weekStartMonth !== weekEndMonth) {
          weekRange = `${weekStart.format('MMMM D')} - ${weekEnd.format('MMMM D')}`;
        }
  
        // Use ISO week for consistent week labels
        return {
          weekLabel: `Week ${weekStart.isoWeek()}`, // Use isoWeek for accurate week numbering
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
  
      const label = groupBy === 'week' ? weekLabel : groupBy === 'month' ? `${group[0]}-${group[1]}` : group;
  
      if (!acc[label]) acc[label] = { screentime: 0, range: weekRange || group };
  
      if (selectedApp === 'All Apps') {
        acc[label].screentime += item.totalScreentime;
        acc[label].range = weekRange || group;
      } else {
        const appScreentime = item.apps.find((app) => app.name === selectedApp);
        if (appScreentime){
          acc[label].screentime += appScreentime.totalMinutes;
          acc[label].range = weekRange || group;
        }
      }
  
      if (weekStartDate) acc[label].weekStartDate = weekStartDate;
  
      return acc;
    }, {});

    const addMissingPeriods = () => {
      if (groupBy === "week") {
        const minDate = dayjs(Object.values(groupedData)
          .map((item) => item.weekStartDate)
          .reduce((earliest, date) => (earliest && earliest.isBefore(dayjs(date)) ? earliest : dayjs(date)), null) || currentDate.startOf("isoWeek"));
    
        const maxDate = currentDate.startOf("isoWeek");
        let currentWeek = minDate;
    
        while (currentWeek.isBefore(maxDate) || currentWeek.isSame(maxDate)) {
          const week = groupingStrategies.week(currentWeek);
          if (!groupedData[week.weekLabel]) {
            groupedData[week.weekLabel] = {
              screentime: 0,
              range: week.weekRange,
              weekStartDate: week.weekStartDate,
            };
          }
          currentWeek = currentWeek.add(1, "week");
        }
      } else if (groupBy === "month") {
        const minDate = dayjs(Object.values(groupedData)
          .map((item) => dayjs(`${item.range[0]}-${item.range[1]}-01`, "YYYY-MM-DD"))
          .reduce((earliest, date) => (earliest && earliest.isBefore(date) ? earliest : date), null) || currentDate.startOf("month"));
    
        const maxDate = currentDate.startOf("month");
        let currentMonth = minDate;
    
        while (currentMonth.isBefore(maxDate) || currentMonth.isSame(maxDate)) {
          const currentMonthData = groupingStrategies.month(currentMonth);
          const currentMonthLabel = `${currentMonthData[0]}-${currentMonthData[1]}`;
          if (!groupedData[currentMonthLabel]) {
            groupedData[currentMonthLabel] = {
              screentime: 0,
              range: currentMonthData, // [year, month]
            };
          }
          currentMonth = currentMonth.add(1, "month");
        }
      } else if (groupBy === "year") {
        const minYear = Math.min(
          ...Object.values(groupedData).map((item) => item.range),
          currentDate.year()
        );
        const maxYear = currentDate.year();
    
        for (let year = minYear; year <= maxYear; year++) {
          if (!groupedData[year]) {
            groupedData[year] = {
              screentime: 0,
              range: year,
            };
          }
        }
      }
      return groupedData;
    };
    
    const completeGroupedData = addMissingPeriods();
    
    // Sort the data based on the start date for week or month groupings
    const sortedGroupedData = Object.keys(completeGroupedData)
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
          const monthName = dayjs().month(monthIndex - 1).format('MMMM'); // Get the full month name
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
      outputRange: ['#212121', '#323232'],
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

  const preprocessData = (data, numDays = 90) => {
    const today = new Date();
    const allDates = [];
  
    // Generate the past 90 days' dates
    for (let i = 0; i < numDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      allDates.push(formattedDate);
    }
  
    // Create a map for the input data
    const dataMap = new Map(data.map(item => [item.date, item.count]));
  
    // Fill missing dates with count = 0
    const result = allDates.map(date => ({
      date,
      count: dataMap.get(date) || 0,
    }));
  
    // Sort the result by date in ascending order (latest date should come at the end)
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
  
    return result;
  };

  const getLongestStreak = (data) => {
    let longestStreak = 0;
    let currentStreak = 0;
    let previousDate = null;
  
    // Loop through the sorted data
    for (let i = 0; i < data.length; i++) {
      const currentDay = data[i];
      const currentDate = new Date(currentDay.date);
  
      // Check if the current day has a screen time log (count > 0)
      if (currentDay.count > 0) {
        // If it's the first day or the current day is consecutive to the previous day within the same month
        if (
          previousDate === null ||
          (currentDate.getMonth() === previousDate.getMonth() && currentDate.getFullYear() === previousDate.getFullYear() && currentDate.getDate() === previousDate.getDate() + 1)
        ) {
          currentStreak++;
        } else {
          // Reset streak if there's a gap (even if the current day has screen time)
          currentStreak = 1;
        }
  
        // Update the longest streak
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        // Reset the streak if count is 0 for any day
        currentStreak = 0;
      }
  
      // Update previousDate for next iteration
      previousDate = currentDate;
    }
  
    return longestStreak;
  };

  if(userData){
    return (
      <View style={styles.container}>
        <Pressable onPress={() => {
          navigation.navigate('Track')
        }} style={styles.logBtn}>
          <Entypo name="plus" size={40} color="#171717" />
        </Pressable>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {
            userData
            ?
            <View style={{marginBottom: 10,display: 'flex',flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',width: '100%',paddingHorizontal: 10}}>
              <View>
                <Text style={styles.headerText}>Hello,</Text>
                <Text style={styles.headerUserName}>{userData.name.split(' ')[0]}.</Text>
              </View>
              <Pressable onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="settings" size={30} color="#ddd" />
              </Pressable>
            </View>
            :
            null
          }

          <View style={{display: 'flex',justifyContent: 'center',alignItems: 'center',margin: 'auto',backgroundColor: '#171717',padding: 10,borderRadius: 15,marginTop: 10}}>
            <TouchableWithoutFeedback onPress={() => setOpen(false)}>
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
                  ArrowDownIconComponent={({ style }) => (
                    <Ionicons name="chevron-down" size={20} color="#ddd" />
                  )}
                  ArrowUpIconComponent={({ style }) => (
                    <Ionicons name="chevron-up" size={20} color="#ddd" />
                  )}
                  TickIconComponent={({ style }) => (
                    <AntDesign name="check" size={20} color="#ddd" />
                  )}
                />
            </TouchableWithoutFeedback>
          </View>

          <View style={styles.chartContainer}>
              {selectedPointIndex !== null
                    ? 
                    <View style={{display: 'flex',flexDirection: 'column',justifyContent: 'space-between',paddingHorizontal: 15}}>
                      <View style={{marginBottom: 10}}>
                        <Text style={[styles.chartHeader,{color: '#fff'}]}>{chartData?.ranges?.[selectedPointIndex]}</Text>
                      </View>
                      <View style={{marginTop: 10,display: 'flex',flexDirection: 'column'}}>
                        <View style={{marginBottom: 10}}>
                          <Text style={[styles.chartHeader,{fontSize: 15,color: 'grey'}]}>Screen Time</Text>
                        </View>
                        <Text style={[styles.chartHeader,{fontFamily: 'OutfitSemiBold',color: '#00A663'}]}>{formatTime(chartData?.data?.[selectedPointIndex])}</Text>
                      </View>
                    </View>
                    : chartData.labels.length
                    ? 
                    <View style={{display: 'flex',flexDirection: 'column',justifyContent: 'space-between',paddingHorizontal: 15}}>
                      <View style={{marginBottom: 10}}>
                        <Text style={[styles.chartHeader,{color: '#fff'}]}>{chartData?.ranges[chartData?.labels?.length - 1]}</Text>
                      </View>
                      <View style={{marginTop: 10}}>
                        <Text style={[styles.chartHeader,{color: '#fff'}]}>{formatTime(chartData?.data[chartData?.data?.length - 1])}</Text>
                      </View>
                    </View>
                    : 
                    <Text>No data available</Text>
                  }
              <Animated.View style={{ opacity: animatedOpacity,marginTop: 20}}>
                <LineChart
                  data={{
                    labels: updatedLabels?.length ? updatedLabels : ['No Data'], // Use updated month names
                    datasets: [{ data: chartData?.data?.length ? chartData?.data : [0] }],
                  }}
                  width={Dimensions.get('window').width - 60} // Parent container's width 90% - padding*2
                  height={200}
                  chartConfig={{
                    backgroundColor: '#171717',
                    backgroundGradientFrom: '#171717',
                    backgroundGradientTo: '#171717',
                    decimalPlaces: 0,
                    color: (opacity) => `rgba(0, 166, 99, ${opacity})`, // Bright blue for the line
                    labelColor: (opacity) => `rgba(255, 255, 255, ${opacity})`,
                    strokeWidth: 4, // Thicker line for more visibility
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '6', // Larger dots
                      strokeWidth: '2',
                      stroke: '#00A663', // Warm orange border for dots
                    },
                  }}
                  withDots={true} // Disable default dots
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
                          backgroundColor: isSelected ? '#00A663' : '#ffffff',
                          borderWidth: isSelected ? 0 : 2,
                          borderColor: 'rgba(74, 118, 118, 1)', // Glowing orange border for selected dots
                          position: 'absolute',
                          left: isSelected ? x-4 : x - 6,
                          top: isSelected ? y-4 : y - 6,
                          elevation: isSelected ? 8 : 4, // Elevation for better pop effect
                          shadowColor: '#00A663',
                          shadowOffset: { width: 0, height: 5 },
                          shadowOpacity: 0.3,
                          shadowRadius: 5,
                        }}
                      />
                    );
                  }}
                  formatYLabel={formatTime}
                  segments={chartData?.data?.length}
                  onDataPointClick={handleDataPointClick}
                  style={styles.chart}
                />
              </Animated.View>
              
              <View style={styles.dateCategory}>
                {['year', 'month', 'week'].map((key) => (
                  <Pressable style={{backgroundColor: '#212121',}} key={key} onPress={() => handlePress(key)}>
                    <Animated.View style={[styles.dateGroup, getStyleForGroup(key),{opacity: 1}]}>
                      <Text style={{ fontFamily: 'OutfitRegular',color:'#ddd' }}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}ly
                      </Text>
                    </Animated.View>
                  </Pressable>
                ))}
              </View>
          </View>
        <View style={{width: '100%',backgroundColor: '#171717',marginVertical: 20,minWidth: '100%',borderRadius: 15}}>
          <View style={{marginBottom: 30,padding: 20,paddingBottom: 0}}>
            <Text style={[styles.timeText,{color: '#ddd',fontFamily: 'OutfitMedium'}]}>Insights</Text>
          </View>
          <View style={{display: 'flex',justifyContent: 'center',alignSelf: 'flex-start',width: '100%'}}>
            <ContributionGraph
              values={heatmapData}
              endDate={new Date()}
              numDays={80}
              width={Dimensions.get('window').width*0.8}
              height={220}
              chartConfig={{
                backgroundColor: '#171717',
                backgroundGradientFrom: '#171717',
                backgroundGradientTo: '#171717',
                decimalPlaces: 0,
                color: (opacity) => (opacity!=0.15 ? `rgba(0, 166, 99, ${opacity})` : `rgba(52, 52, 52, ${opacity})`), // Modify color when count is 0 (Gray for no activity)
                labelColor: (opacity) => `rgba(255, 255, 255, ${opacity})`,
                strokeWidth: 4, // Thicker line for more visibility
                style: {
                  borderRadius: 16,
                },
                
              }}
              gutterSize={4}
              style={{marginLeft: 0}}
            />
            <View style={{marginTop: 10,display: 'flex',justifyContent: 'center',alignItems: 'center'}}>
              <Text style={[styles.timeText,{color: 'grey',fontFamily: 'OutfitRegular',fontSize: 14}]}>Past 80 Days</Text>
            </View>
            {
              insights.length
              ?
              <View style={styles.insightStats}>
                <View style={styles.interestsContainer}>
                  <View style={styles.messageContainer}>
                      <View>
                        <Text style={{ fontFamily: 'OutfitRegular', fontSize: 16, color: 'grey' }}>Max Days In A Row</Text> 
                      </View>
                      <View>
                        <Text style={[styles.timeText,{fontSize: 18,color: '#ddd'}]}>{streak ? streak : 0} Days</Text> 
                      </View>
                  </View>
                  {overtheLimit > 0 ? (
                    <View style={styles.messageContainer}>
                      <View>
                        <Text style={{ fontFamily: 'OutfitRegular', fontSize: 16, color: '#404040' }}>Over Spent</Text> 
                      </View>
                      <View>
                        <Text style={[styles.timeText,{color: '#ddd',fontSize: 18}]}>{convertTime(Math.abs(overtheLimit))}</Text> 
                      </View>
                    </View>
                  ) : (
                    <View style={styles.messageContainer}>
                      <View>
                        <Text style={{ fontFamily: 'OutfitRegular', fontSize: 16, color: 'grey' }}>Time Saved</Text> 
                      </View>
                      <View>
                        <Text style={[styles.timeText,{fontSize: 18,color: '#ddd'}]}>{convertTime(Math.abs(overtheLimit))}</Text> 
                      </View>
                    </View>
                  )}
                  <View style={styles.messageContainer}>
                      <View>
                        <Text style={{ fontFamily: 'OutfitRegular', fontSize: 16, color: 'grey' }}>Daily Average</Text> 
                      </View>
                      <View>
                        <Text style={[styles.timeText,{fontSize: 18,color: '#ddd'}]}>{convertTime(insights?.[0]?.avgDaily)}</Text> 
                      </View>
                  </View>
                  <View style={styles.messageContainer}>
                      <View>
                        <Text style={{ fontFamily: 'OutfitRegular', fontSize: 16, color: 'grey' }}>Weekly Change</Text> 
                      </View>
                      <View>
                        {
                          Number(insights?.[1]?.percentageChange)>0
                          ?
                          <Text style={[styles.timeText,{fontSize: 18,color: '#ddd'}]}>+ {Math.abs(Number(insights?.[1]?.percentageChange))} %</Text> 
                          :
                          <Text style={[styles.timeText,{fontSize: 18,color: '#ddd'}]}>- {Math.abs(Number(insights?.[1]?.percentageChange))} %</Text> 
                        }
                      </View>
                  </View>
                  <View style={styles.messageContainer}>
                      <View>
                        <Text style={{ fontFamily: 'OutfitRegular', fontSize: 16, color: 'grey' }}>5 Year Projection</Text> 
                      </View>
                      <View>
                        <Text style={[styles.timeText,{fontSize: 18,color: '#ddd'}]}>{insights?.[0]?.fiveYearDays} Days</Text> 
                      </View>
                  </View>
                  <View style={styles.messageContainer}>
                      <View>
                        <Text style={{ fontFamily: 'OutfitRegular', fontSize: 16, color: 'grey' }}>50 Year Projection</Text> 
                      </View>
                      <View>
                        <Text style={[styles.timeText,{fontSize: 18,color: '#ddd'}]}>{convertToYear(insights?.[0]?.fiftyYearDays)}</Text> 
                      </View>
                  </View>
                </View>
              </View>
              : 
              null
            }
          </View>
        </View>
        </ScrollView>
      </View>
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
    paddingTop: 20,
    backgroundColor: '#111',
    position: 'relative'
  },
  scrollContent: {
    width: '95%',
    padding: 10,
    paddingBottom: 100, // Adjust this to leave space above the navbar
    alignItems: 'center', // Center content if needed,
    paddingTop: 40
  },
  headerText: {
    fontSize: 22,
    color: '#ddd', // Subtle gray text
    fontFamily: 'OutfitRegular',
    opacity: 0.5
  },
  headerUserName: {
    fontSize: 40,
    color: '#ddd',
    fontFamily: 'OutfitMedium',
  },

  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  insightStats: {
    flex: 1,
    marginTop: 10,
    width: '100%'
  },
  messageContainer: {
    // marginBottom: 20,
    paddingVertical: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  timeText: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 25,
    color: '#4A7676',
  },
  interestsContainer: {
    backgroundColor: '#171717',
    borderRadius: 10,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
    minWidth: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  chart: {
    marginVertical: 12,
  },
  label: {
    fontSize: 18,
    fontFamily: 'OutfitRegular',
    marginBottom: 10,
  },
  chartHeader: {
    fontFamily: 'OutfitRegular',
    color: '#404040',
    fontSize: 22
  },
  dateCategory: {
    display: 'flex',
    flexDirection: 'row',
    padding: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto',
    backgroundColor: '#212121',

    // iOS shadow
    shadowColor: '#212121',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,
  },
  dateGroup: {
    backgroundColor: '#212121',
    padding: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 2
  },
  dropdown: {
    width: '100%',

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto',

    backgroundColor: '#171717',
    borderWidth: 0,
  },
  dropdownContainer: {
    width: '100%',
    borderWidth: 0,
    marginTop: 15,
    padding: 10,
    backgroundColor: '#212121',
  
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,
    minHeight: 250,
  },
  dropdownText: {
    fontSize: 14,
    color: '#ddd',
    fontFamily: 'OutfitRegular',
  },
  icon: {
    width: 30, // Adjust as needed
    height: 30,
    resizeMode: 'contain',
    marginRight: 10, // Space between icon and label
    borderRadius: 5
  },
  chartContainer: {
    backgroundColor: '#171717',
    borderRadius: 15,
    paddingVertical: 20,
    marginTop: 20,
    paddingHorizontal: 10,

    width: '100%',
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,
  },
  logBtn: {
    backgroundColor: '#00A663',
    padding: 10,
    borderRadius: 50,
    position: 'absolute',
    bottom: 40,
    right: 40,
    zIndex: 2
  },
});
