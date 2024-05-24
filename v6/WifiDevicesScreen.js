import React, { useState, useEffect, useContext } from "react";
import { View, Text, ScrollView, Switch, StyleSheet } from "react-native";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      await AsyncStorage.setItem(storageKey, JSON.stringify(defaultDeviceSettings));
    }
    setSelectedDevices(newSelectedDevices);
    updateSelectedDevices(Object.fromEntries(newSelectedDevices));
  };

  useEffect(() => {
    navigation.addListener('beforeRemove', () => {
      updateSelectedDevices(Object.fromEntries(selectedDevices));
    });
  }, [navigation, selectedDevices, updateSelectedDevices]);

  return (
    <ScrollView style={styles.container}>
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
