import React, { useState, useEffect, useContext } from "react";
import { View, Text, ScrollView, Switch, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import axios from 'axios';
import { GlobalStateContext } from "../context/GlobalStateContext";

// Navigation to view devices on network, can toggle devices to select them. 

const WifiDevicesScreen = ({ route, navigation }) => {
  const { alarm, selectedDevices: initialSelectedDevices, updateSelectedDevices } = route.params;
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState(initialSelectedDevices);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userInfo, headers } = useContext(GlobalStateContext);

  // Use GET request to find devices on network (must be connected on Govee Home first)
  useEffect(() => {
    const fetchDevicesFromAPI = async () => {
      try {
        const response = await axios.get(userInfo.urlGet, { headers });
        setDevices(response.data.data);
      } catch (error) {
        setError('Connection error, please see Troubleshoot section.');
        console.error('Error fetching devices:', error.message);
      } finally {
        setLoading(false); // Stop loading animation after fetching
      }
    };

    fetchDevicesFromAPI();
  }, [headers, userInfo]);

  // Function to determine what happens on toggle on each device
  const toggleDeviceSelection = (device) => {
    const deviceIndex = selectedDevices.findIndex(d => d.device === device.device);
    let newSelectedDevices;

    if (deviceIndex > -1) {
      // Device is already selected, remove it
      newSelectedDevices = selectedDevices.filter(d => d.device !== device.device);
    } else {
      // Device is not selected, add it with default settings
      const defaultDeviceSettings = {
        device: device.device,
        sku: device.sku,
        onOff: true,
        brightness: 50,
        hexColor: "#ffffff",
        color: 16777215,
        label: device.label || '' // Add the label if it exists
      };
      newSelectedDevices = [...selectedDevices, defaultDeviceSettings];
    }

    setSelectedDevices(newSelectedDevices);
    alarm.devices = newSelectedDevices; // Ensure alarm object is updated with the latest devices
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Available Devices",
    });
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      updateSelectedDevices(selectedDevices);
    });
    return unsubscribe;
  }, [navigation, selectedDevices, updateSelectedDevices]);

  // Function to get the display name of the device
  const getDeviceDisplayName = (device) => {
    const selectedDevice = selectedDevices.find(d => d.device === device.device);
    return selectedDevice && selectedDevice.label ? selectedDevice.label : device.sku;
  };

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loadingIndicator} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Troubleshoot')}>
            <Text style={styles.hyperlink}>Troubleshoot</Text>
          </TouchableOpacity>
        </View>
      ) : devices.length === 0 ? (
        <Text style={styles.noDevicesText}>No Devices on Network. Ensure devices are connected to WiFi on Govee Home app.</Text>
      ) : (
        devices.map((device) => (
          <View key={device.device} style={styles.deviceContainer}>
            <Text style={styles.deviceText}>{getDeviceDisplayName(device)}</Text> 
            <Switch
              value={selectedDevices.some(d => d.device === device.device)}
              onValueChange={() => toggleDeviceSelection(device)}
              style={styles.switch}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingIndicator: {
    marginTop: 20,
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
  errorContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginBottom: 10,
  },
  noDevicesText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  hyperlink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default WifiDevicesScreen;
