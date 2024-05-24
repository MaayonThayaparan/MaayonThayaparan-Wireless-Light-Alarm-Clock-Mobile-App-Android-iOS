//AlarmClocks.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Button, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';


const fetchDevicesFromAPI = async () => {
  try {
    const response = await axios.get('https://openapi.api.govee.com/router/api/v1/user/devices', {
      headers: {
        'Content-Type': 'application/json',
        'Govee-API-Key': '714cfe09-7dd5-4ba0-aa53-34c921fabb26'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching devices:', error.message);
    return [];
  }
};

const AlarmClocks = ({ navigation }) => {
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    loadAlarms();
  }, []);

  const loadAlarms = async () => {
    const storedAlarms = await AsyncStorage.getItem('alarms');
    if (storedAlarms) {
      setAlarms(JSON.parse(storedAlarms));
    }
  };

  const saveAlarms = async (newAlarms) => {
    await AsyncStorage.setItem('alarms', JSON.stringify(newAlarms));
    setAlarms(newAlarms);
  };

  const addAlarm = () => {
    const newAlarm = {
      id: Date.now(),
      time: new Date(),
      devices: [],
      selectedDevices: new Map(),
      triggered: false, // Add triggered flag
    };
    saveAlarms([...alarms, newAlarm]);
  };

  const deleteAlarm = (id) => {
    const updatedAlarms = alarms.filter(alarm => alarm.id !== id);
    saveAlarms(updatedAlarms);
  };

  const handleTriggerDevices = async (alarm) => {
    const selectedDevices = new Map(Object.entries(alarm.selectedDevices || {}));
    selectedDevices.forEach(async (device, deviceId) => {
      const requestData = {
        requestId: uuidv4(),
        payload: {
          sku: device.sku,
          device: deviceId,
          capability: {
            type: "devices.capabilities.on_off",
            instance: "powerSwitch",
            value: 1
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
    // Set triggered flag to true after handling devices
    const updatedAlarms = alarms.map(a => {
      if (a.id === alarm.id) {
        return { ...a, triggered: true };
      }
      return a;
    });
    saveAlarms(updatedAlarms);
  };

  useEffect(() => {
    const checkAlarm = setInterval(() => {
      const currentTime = new Date();
      const updatedAlarms = alarms.map(alarm => {
        const alarmTime = new Date(alarm.time);
        if (
          !alarm.triggered &&
          currentTime.getHours() === alarmTime.getHours() &&
          currentTime.getMinutes() === alarmTime.getMinutes()
        ) {
          Alert.alert("Alarm", `Alarm at ${alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          handleTriggerDevices(alarm);
          return { ...alarm, triggered: true };
        }
        return alarm;
      });
      setAlarms(updatedAlarms);
    }, 1000);
    return () => clearInterval(checkAlarm);
  }, [alarms]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Button title="Add New Alarm" onPress={addAlarm} />
        {alarms.length > 0 ? (
          <ScrollView contentContainerStyle={styles.contentContainer}>
            {alarms.map((alarm) => (
              <TouchableOpacity
                key={alarm.id}
                onPress={() => navigation.navigate('AlarmDetails', { alarm, alarms, updateAlarms: saveAlarms })}
              >
                <View style={styles.alarmContainer}>
                  <Text style={styles.alarmText}>{`Alarm at ${new Date(alarm.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</Text>
                  <Button title="Delete" onPress={() => deleteAlarm(alarm.id)} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noAlarmsText}>No alarms available</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    alignItems: 'center',
  },
  alarmContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  alarmText: {
    fontSize: 18,
  },
  noAlarmsText: {
    marginTop: 20,
    fontSize: 18,
  },
});

export default AlarmClocks;
