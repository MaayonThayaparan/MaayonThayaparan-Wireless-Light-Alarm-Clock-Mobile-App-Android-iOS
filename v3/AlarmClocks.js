import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, Button, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { GlobalStateContext } from "./GlobalStateContext";


const AlarmClocks = ({ navigation }) => {
  const [alarms, setAlarms] = useState([]); // variable with list of alarms and function to update list
  const { headers, urlGet, urlPost} = useContext(GlobalStateContext);

  useEffect(() => {
    loadAlarms();
  }, []);

  const fetchDevicesFromAPI = async () => {
    try {
      const response = await axios.get(urlGet, {headers});
      return response.data.data;
    } catch (error) {
      console.error('Error fetching devices:', error.message);
      return [];
    }
  };

  const loadAlarms = async () => { 
    const storedAlarms = await AsyncStorage.getItem('alarms'); // Retrieve the JSON object representing alarms from local storage
    if (storedAlarms) {                                        // Check if storedAlarms exists
      setAlarms(JSON.parse(storedAlarms));                     // Parse the JSON string back into a JavaScript object/array and update state with retrieved object
    }
  };

  const saveAlarms = async (newAlarms) => {
    await AsyncStorage.setItem('alarms', JSON.stringify(newAlarms)); // Save the new list of alarms to local storage
    setAlarms(newAlarms);                                            // Update the state with the new list of alarms
  };

  const addAlarm = () => {
    const newAlarm = {
      id: Date.now(),               //unique identifier
      time: new Date(),             // alarm date initialized to current date/time
      devices: [],                  //initialize empty array
      selectedDevices: new Map(),   //initialize empty map of devices
      triggered: false,             // Add triggered flag
    };
    saveAlarms([...alarms, newAlarm]); // save new list which is copy of old list of alarms plus the new alarm
  };

  const deleteAlarm = (id) => { // takes the id of alarm and filters it from the alarm list, and saves the new list
    const updatedAlarms = alarms.filter(alarm => alarm.id !== id);
    saveAlarms(updatedAlarms);
  };

  const handleTriggerDevices = async (alarm) => {
    const selectedDevices = new Map(Object.entries(alarm.selectedDevices || {})); // Retrieve selectedDevices from alarm and convert to map
    selectedDevices.forEach(async (device, deviceId) => { // iterate over selectedDevices, device is the value (the details), deviceID is the key
      if (device.onOff === 0) { // post request when turning off light (only need to consider power switch)
        const requestData = {
          requestId: uuidv4(),
          payload: {
            sku: device.sku,
            device: deviceId,
            capability: {
              type: "devices.capabilities.on_off",
              instance: "powerSwitch",
              value: 0
            }
          }
        };
        try {
          const response = await axios.post(urlPost, requestData, {headers});
          console.log('Device turned off successfully:', deviceId, response.data);
        } catch (error) {
          console.error('Error turning off device:', deviceId, error.message);
        }
      } else { // post requests when turning on device
        const brightnessRequestData = {
          requestId: uuidv4(),
          payload: {
            sku: device.sku,
            device: deviceId,
            capability: {
              type: "devices.capabilities.range",
              instance: "brightness",
              value: device.brightness
            }
          }
        };
        const colorRequestData = {
          requestId: uuidv4(),
          payload: {
            sku: device.sku,
            device: deviceId,
            capability: {
              type: "devices.capabilities.color_setting",
              instance: "colorRgb",
              value: device.color
            }
          }
        };
        const onOffRequestData = {
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
          await axios.post(urlPost, brightnessRequestData, {headers});
          await axios.post(urlPost, colorRequestData, {headers});
          const response = await axios.post(urlPost, onOffRequestData, {headers});
          console.log('Device turned on successfully:', deviceId, response.data);
        } catch (error) {
          console.error('Error turning on device:', deviceId, error.message);
        }
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAlarms();
    });

    return unsubscribe;
  }, [navigation]);

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
                  <Text style={styles.alarmText}>{`${new Date(alarm.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</Text>
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
