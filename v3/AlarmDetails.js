import React, { useState, useEffect, useCallback, useContext } from "react";
import { View, Text, Button, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from 'axios';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlobalStateContext } from "./GlobalStateContext";

const AlarmDetails = ({ route, navigation }) => {
  const { alarm, alarms, updateAlarms } = route.params;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date(alarm.time));
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState(new Map(Object.entries(alarm.selectedDevices || {}))); // Convert object to Map
  const [showDevices, setShowDevices] = useState(false);
  const {headers, urlGet, urlPost} = useContext(GlobalStateContext); // retrieve global state variables


  // Fetch devices from the API
  const fetchDevicesFromAPI = async () => {
    try {
      const response = await axios.get(urlGet, {headers});
      return response.data.data;
    } catch (error) {
      console.error('Error fetching devices:', error.message);
      return [];
    }
  };

  const handleTimeChange = (event, newTime) => {
    setShowTimePicker(false);
    if (newTime) {
      setSelectedTime(new Date(newTime));
    }
  };

  const saveAlarm = async () => {
    const updatedAlarms = alarms.map(a => { // Create an updated list of alarms by mapping through the current alarms
      if (a.id === alarm.id) {              // Check if the current alarm's id matches the alarm being updated
        return { ...a, time: selectedTime.toISOString(), selectedDevices: Object.fromEntries(selectedDevices) }; // Return a new object with updated properties if the id matches
      }
      return a;                             // Return the alarm unchanged if the id does not match
    });
    await AsyncStorage.setItem('alarms', JSON.stringify(updatedAlarms)); // Save the updated list of alarms to local storage
    updateAlarms(updatedAlarms); // Update the alarms state in the parent component or global context
    navigation.goBack(); // Navigate back to the previous screen
  };

  const fetchDevices = async () => {
    const fetchedDevices = await fetchDevicesFromAPI(); // Fetch the devices from the API
    setDevices(fetchedDevices.map(device => ({  // Map through the fetched devices and add an 'enabled' property
      ...device,
      enabled: selectedDevices.has(device.device)
    })));
    setShowDevices(!showDevices); // Clicking GetDevices button will show/hide this section. 
  };

  const toggleDeviceSelection = (device) => {
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
        const response = await axios.post(urlPost, requestData, {headers});
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
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('DeviceSettings', {
                    device: { ...selectedDevices.get(id), device: id },
                    saveDeviceSettings: (updatedDevice) => {
                      const newSelectedDevices = new Map(selectedDevices);
                      newSelectedDevices.set(id, updatedDevice);
                      setSelectedDevices(newSelectedDevices);
                    },
                  })
                }
              >
                <Text>Settings</Text>
              </TouchableOpacity>
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
