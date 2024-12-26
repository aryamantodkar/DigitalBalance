import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker'; // Updated import
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import AppList from '../AppList.json';

dayjs.extend(advancedFormat);
dayjs.extend(isoWeek);

const HomePage = () => {
  const { fetchScreentime } = useAuth();

  const [chartData, setChartData] = useState({ labels: [], data: [] });
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [groupBy, setGroupBy] = useState('week');
  const [selectedApp, setSelectedApp] = useState('All Apps');
  const [availableApps, setAvailableApps] = useState(['All Apps']);

  const fetchData = async () => {
    try {
      const records = await fetchScreentime();
      const transformedData = records.map(transformScreentimeData);

      // Extract app names for filtering
      const apps = new Set(['All Apps']);
      transformedData.forEach((record) =>
        record.apps.forEach((app) => apps.add(app.name))
      );

      setAvailableApps([...apps]);
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
      };
      return {
        id: appId,
        name: appInfo.appName,
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
    const groupedData = groupData(data, groupBy);
    const labels = Object.keys(groupedData).sort();
    const dataset = labels.map((label) => groupedData[label].screentime);
    const ranges = labels.map((label) => groupedData[label].range);
  
    setChartData({ labels, data: dataset, ranges }); // Save both labels and ranges
  };

  const formatTime = (value) => {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleDataPointClick = (data) => {
    setSelectedPointIndex(data.index);
  };

  return (
    <View style={styles.container}>
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
        <Picker
          selectedValue={selectedApp}
          onValueChange={(itemValue) => setSelectedApp(itemValue)}
          style={styles.picker}
        >
          {availableApps.map((app, index) => (
            <Picker.Item key={index} label={app} value={app} />
          ))}
        </Picker>
        <LineChart
          data={{
            labels: chartData.labels.length ? chartData.labels : ['No Data'],
            datasets: [{ data: chartData.data.length ? chartData.data : [0] }],
          }}
          width={Dimensions.get('window').width * 0.9 - 20} // Parent container's width 90% - padding*2
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity) => `rgba(64, 64, 64, ${opacity})`,
            labelColor: (opacity) => `rgba(0, 0, 0, ${opacity})`,
          }}
          withDots={true} // Disable default dots
          bezier
          renderDotContent={({ x, y, index }) => (
            <View
              key={index}
              style={{
                width: selectedPointIndex === null
                  ? chartData.data.length - 1 === index
                    ? 12
                    : 8
                  : selectedPointIndex === index
                  ? 12
                  : 8,
                height: selectedPointIndex === null
                  ? chartData.data.length - 1 === index
                    ? 12
                    : 8
                  : selectedPointIndex === index
                  ? 12
                  : 8,
                borderRadius: 6,
                backgroundColor:
                  selectedPointIndex === null
                    ? chartData.data.length - 1 === index
                      ? '#000'
                      : '#fff'
                    : selectedPointIndex === index
                    ? '#000'
                    : '#fff',
                borderWidth: selectedPointIndex === index ? 0 : 2,
                borderColor: '#000',
                position: 'absolute',
                left: x - (selectedPointIndex === index ? 6 : 4),
                top: y - (selectedPointIndex === index ? 6 : 4),
              }}
            />
          )}
          formatYLabel={formatTime}
          segments={chartData.data.length}
          onDataPointClick={handleDataPointClick}
          style={styles.chart}
        />
        <View style={styles.dateCategory}>
          <Pressable onPress={() => {
            setGroupBy('year')
          }} style={groupBy=='year' ? styles.dateGroupActive : {padding:10}}>
            <Text style={{fontFamily: 'MontserratMedium'}}>Yearly</Text>
          </Pressable>
          <Pressable onPress={() => {
            setGroupBy('month')
          }} style={groupBy=='month' ? styles.dateGroupActive : {padding:10}}>
            <Text style={{fontFamily: 'MontserratMedium'}}>Monthly</Text>
          </Pressable>
          <Pressable onPress={() => {
            setGroupBy('week')
          }} style={groupBy=='week' ? styles.dateGroupActive : {padding:10}}>
            <Text style={{fontFamily: 'MontserratMedium'}}>Weekly</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f4f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
  },
  label: {
    fontSize: 18,
    fontFamily: 'MontserratMedium',
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    marginVertical: 10,
  },
  chartHeader: {
    fontFamily: 'MontserratSemiBold',
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
  dateGroupActive: {
    backgroundColor: '#f5f4f4',
    padding: 10,
    borderRadius: 5,
  }
});
