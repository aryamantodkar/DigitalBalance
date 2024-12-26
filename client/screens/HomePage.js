import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
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
      week: (date) => `Week ${Math.ceil(dayjs(date).date() / 7)}`,
      month: (date) => dayjs(date).format('MMMM YYYY'),
      year: (date) => dayjs(date).year(),
    };
    return data.reduce((acc, item) => {
      const key = groupingStrategies[groupBy](item.date);

      if (!acc[key]) acc[key] = 0;

      if (selectedApp === 'All Apps') {
        acc[key] += item.totalScreentime;
      } else {
        const appScreentime = item.apps.find((app) => app.name === selectedApp);
        if (appScreentime) acc[key] += appScreentime.totalMinutes;
      }

      return acc;
    }, {});
  };

  const updateChartData = (data, groupBy, selectedApp) => {
    const groupedData = groupData(data, groupBy);
    const labels = Object.keys(groupedData).sort();
    const dataset = labels.map((label) => groupedData[label]);

    setChartData({ labels, data: dataset });
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
      <Text style={styles.label}>
        {selectedPointIndex !== null
          ? `${chartData.labels[selectedPointIndex]}: ${formatTime(chartData.data[selectedPointIndex])}`
          : 'Select a point on the chart'}
      </Text>
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
        width={Dimensions.get('window').width - 16}
        height={220}
        chartConfig={{
          backgroundColor: '#e26a00',
          decimalPlaces: 0,
          color: (opacity) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity) => `rgba(255, 255, 255, ${opacity})`,
        }}
        bezier
        renderDotContent={({ x, y, index }) => (
          <View
            key={index}
            style={{
              width: selectedPointIndex === index ? 12 : 8,
              height: selectedPointIndex === index ? 12 : 8,
              borderRadius: 6,
              backgroundColor: selectedPointIndex === index ? '#fff' : '#000',
              borderWidth: selectedPointIndex === index ? 0 : 2,
              borderColor: '#fff',
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
    borderRadius: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  picker: {
    width: '80%',
    marginVertical: 10,
  },
});
