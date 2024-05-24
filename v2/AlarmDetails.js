//AlarmDetails.js
import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, ScrollView, Switch, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from 'axios';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';

const ALARM_TASK = 'alarm-task';

const headers = {
  'Content-Type': 'application/json',
  'Govee-API-Key': '714cfe09-7dd5-4ba0-aa53-34c921fabb26'
};

// Fetch devices from the API
const fetchDevicesFromAPI = async () => {
  try {
    const response = await axios.get('https://openapi.api.govee.com/router/api/v1/user/devices', { headers });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching devices:', error.message);
    return [];
  }
};

// Define the background task
TaskManager.defineTask(ALARM_TASK, async () => {
  const alarms = JSON.parse(await AsyncStorage.getItem('alarms')) || [];
  const currentTime = new Date();
  for (let alarm of alarms) {
    const alarmTime = new Date(alarm.time);
    if (currentTime.getHours() === alarmTime.getHours() && currentTime.getMinutes() === alarmTime.getMinutes()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Alarm",
          body: `Alarm at ${alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          sound: true,
        },
        trigger: null,
      });

      // Trigger devices
      const selectedDevices = new Map(Object.entries(alarm.selectedDevices || {}));
      selectedDevices.forEach(async (device, deviceId) => {
        const requestData = {
          requestId: uuidv4(),  // Generate a unique ID for each request
          payload: {
            sku: device.sku,
            device: deviceId,
            capability: {
              type: "devices.capabilities.on_off",
              instance: "powerSwitch",
              value: 1  // Set to '1' for 'on', change as needed
            }
          }
        };
        try {
          await axios.post('https://openapi.api.govee.com/router/api/v1/device/control', requestData, { headers });
        } catch (error) {
          console.error('Error triggering device:', deviceId, error.message);
        }
      });
      break;
    }
  }
  return BackgroundFetch.Result.NewData;
});

// Register the background task
BackgroundFetch.registerTaskAsync(ALARM_TASK, {
  minimumInterval: 1, // run the task every minute
  stopOnTerminate: false,
  startOnBoot: true,
});

const AlarmDetails = ({ route, navigation }) => {
  const { alarm, alarms, updateAlarms } = route.params;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date(alarm.time));
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState(new Map(Object.entries(alarm.selectedDevices || {}))); // Convert object to Map
  const [showDevices, setShowDevices] = useState(false);

  const handleTimeChange = (event, newTime) => {
    setShowTimePicker(false);
    if (newTime) {
      setSelectedTime(new Date(newTime));
    }
  };

  const saveAlarm = async () => {
    const updatedAlarms = alarms.map(a => {
      if (a.id === alarm.id) {
        return { ...a, time: selectedTime.toISOString(), selectedDevices: Object.fromEntries(selectedDevices) }; // Convert Map to object
      }
      return a;
    });
    await AsyncStorage.setItem('alarms', JSON.stringify(updatedAlarms));
    updateAlarms(updatedAlarms);
    navigation.goBack();
  };

  const fetchDevices = async () => {
    const fetchedDevices = await fetchDevicesFromAPI();
    setDevices(fetchedDevices.map(device => ({
      ...device,
      enabled: selectedDevices.has(device.device)
    })));
    setShowDevices(!showDevices);
  };

  const toggleDeviceSelection = (device) => { // CHANGE HERE - Use device object
    const newSelectedDevices = new Map(selectedDevices);
    if (newSelectedDevices.has(device.device)) {
      newSelectedDevices.delete(device.device);
    } else {
      newSelectedDevices.set(device.device, { sku: device.sku }); // Store device ID and SKU
    }
    setSelectedDevices(newSelectedDevices);
  };

  const deleteSelectedDevice = (id) => {
    const newSelectedDevices = new Map(selectedDevices);
    newSelectedDevices.delete(id);
    setSelectedDevices(newSelectedDevices);
  };

  const handleTriggerDevices = () => {
    selectedDevices.forEach(async (device, deviceId) => { // CHANGE HERE - Use device object
      const requestData = {
        requestId: uuidv4(),  // Generate a unique ID for each request
        payload: {
          sku: device.sku,
          device: deviceId,
          capability: {
            type: "devices.capabilities.on_off",
            instance: "powerSwitch",
            value: 1  // Set to '1' for 'on', change as needed
          }
        }
      };

      try {
        const response = await axios.post('https://openapi.api.govee.com/router/api/v1/device/control', requestData, {
          headers: {
            'Content-Type': 'application/json',
            'Govee-API-Key': '714cfe09-7dd5-4ba0-aa53-34c921fabb26'
          }
        });
        console.log('Device triggered successfully:', deviceId, response.data);
      } catch (error) {
        console.error('Error triggering device:', deviceId, error.message);
      }
    });
  };

  useEffect(() => {
    const checkAlarm = setInterval(() => {
      const currentTime = new Date();
      if (
        currentTime.getHours() === selectedTime.getHours() &&
        currentTime.getMinutes() === selectedTime.getMinutes()
      ) {
        Alert.alert("Alarm", "It is time!");
        handleTriggerDevices();
        clearInterval(checkAlarm);
      }
    }, 1000);
    return () => clearInterval(checkAlarm);
  }, [selectedTime, selectedDevices]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{`Alarm at ${selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</Text>
      <Button title="Edit Time" onPress={() => setShowTimePicker(true)} />
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={handleTimeChange}
        />
      )}
      <Button title="Get Devices" onPress={fetchDevices} color="#3498db" />
      {showDevices && (
        <ScrollView>
          {devices.map((device) => (
            <View key={device.device} style={styles.deviceContainer}>
              <Text>{`${device.sku} (${device.device})`}</Text>
              <Switch
                value={!!selectedDevices.get(device.device)}
                onValueChange={() => toggleDeviceSelection(device)}
              />
            </View>
          ))}
        </ScrollView>
      )}
      {selectedDevices.size > 0 && (
        <View style={styles.selectedDevicesContainer}>
          <Text style={styles.selectedDevicesTitle}>Selected Devices:</Text>
          {Array.from(selectedDevices.keys()).map((id) => (
            <View key={id} style={styles.selectedDevice}>
              <Text>{id}</Text>
              <Button title="Delete" onPress={() => deleteSelectedDevice(id)} />
            </View>
          ))}
        </View>
      )}
      <Button title="Save Changes" onPress={saveAlarm} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  deviceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedDevicesContainer: {
    marginTop: 16,
  },
  selectedDevicesTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  selectedDevice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default AlarmDetails;