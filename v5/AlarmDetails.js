import React, { useState, useEffect, useCallback, useContext } from "react";
import { View, Text, Button, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from 'axios';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlobalStateContext } from "./GlobalStateContext";

const AlarmDetails = ({ route, navigation }) => {
  const { alarm, alarms, updateAlarms, textTitle } = route.params;
  const [showTimePicker, setShowTimePicker] = useState(true);
  const [selectedTime, setSelectedTime] = useState(new Date(alarm.time));
  const [showDevices, setShowDevices] = useState(false);
  const [devices, setDevices] = useState([]);
  const [showSelectedDevices, setShowSelectedDevices] = useState(true);
  const [selectedDevices, setSelectedDevices] = useState(new Map(Object.entries(alarm.selectedDevices || {}))); // Convert object to Map
  
  const { headers, urlGet, urlPost } = useContext(GlobalStateContext); // retrieve global state variables

  const saveAlarmDetails = useCallback(async () => {
    let updatedAlarms;
    const existingAlarmIndex = alarms.findIndex(a => a.id === alarm.id);

    if (existingAlarmIndex !== -1) {
      // Update existing alarm
      updatedAlarms = alarms.map(a => {
        if (a.id === alarm.id) {
          return { ...a, time: selectedTime.toISOString(), selectedDevices: Object.fromEntries(selectedDevices) };
        }
        return a;
      });
    } else {
      // Add new alarm
      const newAlarm = { ...alarm, time: selectedTime.toISOString(), selectedDevices: Object.fromEntries(selectedDevices) };
      updatedAlarms = [...alarms, newAlarm];
    }

    await AsyncStorage.setItem('alarms', JSON.stringify(updatedAlarms)); // Save the updated list of alarms to local storage
    updateAlarms(updatedAlarms); // Update the alarms state in the parent component or global context
    navigation.goBack(); // Navigate back to the previous screen
  }, [alarm, alarms, selectedTime, selectedDevices, updateAlarms, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: textTitle,
      headerLeft: () => (
        <Button
          onPress={() => navigation.goBack()}
          title="Cancel"
          color="#000"
        />
      ),
      headerRight: () => (
        <Button
          onPress={saveAlarmDetails}
          title="Save"
          color="#000"
        />
      ),
    });
  }, [navigation, saveAlarmDetails, textTitle]);

  // Fetch devices from the API
  const fetchDevicesFromAPI = async () => {
    try {
      const response = await axios.get(urlGet, { headers });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching devices:', error.message);
      return [];
    }
  };

  const handleTimeChange = (event, newTime) => {
    setShowTimePicker(true);
    if (newTime) {
      setSelectedTime(new Date(newTime));
    }
  };

  const fetchDevices = async () => {
    const fetchedDevices = await fetchDevicesFromAPI(); // Fetch the devices from the API
    setDevices(fetchedDevices.map(device => ({  // Map through the fetched devices and add an 'enabled' property
      ...device,
      enabled: selectedDevices.has(device.device)
    })));
    setShowDevices(!showDevices); // Clicking GetDevices button will show/hide this section. 
  };

  const defaultDeviceSettings = {
    onOff: true,
    brightness: 50,
    hexColor: "#ffffff",
    color: 16777215,
  };
  
  const toggleDeviceSelection = async (device) => {
    const newSelectedDevices = new Map(selectedDevices);
    const storageKey = `${alarm.id}-${device.device}`;
  
    if (newSelectedDevices.has(device.device)) {
      newSelectedDevices.delete(device.device);
      await AsyncStorage.removeItem(storageKey);
    } else {
      newSelectedDevices.set(device.device, { sku: device.sku });
      await AsyncStorage.setItem(storageKey, JSON.stringify(defaultDeviceSettings)); // Store default settings
    }
    setSelectedDevices(newSelectedDevices);
  };
  
  const deleteSelectedDevice = async (id) => {
    const newSelectedDevices = new Map(selectedDevices);
    const storageKey = `${alarm.id}-${id}`;
    newSelectedDevices.delete(id);
    await AsyncStorage.removeItem(storageKey);
    setSelectedDevices(newSelectedDevices);
  };
  return (
    <View style={styles.container}>
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={handleTimeChange}
          style={styles.dateTimePicker}
        />
      )}
      <View style={styles.section}>
        <Button
          title={showDevices ? "Hide Devices on WiFi" : "Show Devices on WiFi"}
          onPress={fetchDevices}
          color="#3498db"
        />
      </View>
      {showDevices && (
        <ScrollView style={styles.scrollView}>
          {devices.map((device) => (
            <View key={device.device} style={styles.deviceContainer}>
              <Text style={styles.deviceText}>{device.sku}</Text>
              <Switch
                value={!!selectedDevices.get(device.device)}
                onValueChange={() => toggleDeviceSelection(device)}
                style={styles.switch}
              />
            </View>
          ))}
        </ScrollView>
      )}
      {selectedDevices.size > 0 && (
        <View style={styles.section}>
          <Button
            title={showSelectedDevices ? "Hide Selected Devices" : "Show Selected Devices"}
            onPress={() => setShowSelectedDevices(!showSelectedDevices)}
            color="#3498db"
          />
          {showSelectedDevices && (
            <ScrollView style={styles.selectedDevicesContainer}>
              {Array.from(selectedDevices.entries()).map(([id, { sku }]) => (
                <View key={id} style={styles.selectedDevice}>
                  <Text style={styles.deviceText}>{sku}</Text>
                  <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() =>
                      navigation.navigate('DeviceSettings', {
                        alarmId: alarm.id, // Pass the alarm ID
                        device: { ...selectedDevices.get(id), device: id },
                        saveDeviceSettings: (updatedDevice) => {
                          const newSelectedDevices = new Map(selectedDevices);
                          newSelectedDevices.set(id, updatedDevice);
                          setSelectedDevices(newSelectedDevices);
                        },
                      })
                    }
                  >
                    <Text style={styles.settingsText}>Settings</Text>
                  </TouchableOpacity>
                  <Button
                    title="Delete"
                    onPress={() => deleteSelectedDevice(id)}
                    color="#e74c3c"
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  dateTimePicker: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollView: {
    marginBottom: 16,
  },
  deviceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  deviceText: {
    fontSize: 16,
    color: '#333',
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  selectedDevicesContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedDevice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  settingsButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
  },
  settingsText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AlarmDetails;
