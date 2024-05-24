import React, { useState, useEffect, useContext } from "react";
import { View, Text, ScrollView, Switch, StyleSheet } from "react-native";
import axios from 'axios';
import { GlobalStateContext } from "./GlobalStateContext";

const WifiDevicesScreen = ({ route, navigation }) => {
  const { alarm, selectedDevices: initialSelectedDevices, updateSelectedDevices } = route.params;
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState(initialSelectedDevices);
  const { headers, urlGet } = useContext(GlobalStateContext);

  useEffect(() => {
    const fetchDevicesFromAPI = async () => {
      try {
        const response = await axios.get(urlGet, { headers });
        setDevices(response.data.data);
      } catch (error) {
        console.error('Error fetching devices:', error.message);
      }
    };

    fetchDevicesFromAPI();
  }, [headers, urlGet]);

  const toggleDeviceSelection = (device) => {
    const newSelectedDevices = selectedDevices.some(d => d.device === device.device)
      ? selectedDevices.filter(d => d.device !== device.device)
      : [...selectedDevices, { device: device.device, sku: device.sku }];
      
    setSelectedDevices(newSelectedDevices);
    alarm.devices = newSelectedDevices; // Ensure alarm object is updated with the latest devices
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Available Devices",
    })
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      updateSelectedDevices(selectedDevices);
    });
    return unsubscribe;
  }, [navigation, selectedDevices, updateSelectedDevices]);

  return (
    <ScrollView style={styles.container}>
      {devices.map((device) => (
        <View key={device.device} style={styles.deviceContainer}>
          <Text style={styles.deviceText}>{device.sku}</Text>
          <Switch
            value={selectedDevices.some(d => d.device === device.device)}
            onValueChange={() => toggleDeviceSelection(device)}
            style={styles.switch}
          />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
});

export default WifiDevicesScreen;
