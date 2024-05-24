import React, { useState, useEffect, useContext } from "react";
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlobalStateContext } from "./GlobalStateContext";

const DeviceManager = ({ route, navigation }) => {
  const { alarm, updateSelectedDevices } = route.params;
  const [selectedDevices, setSelectedDevices] = useState(new Map(Object.entries(alarm.selectedDevices || {})));

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setSelectedDevices(new Map(Object.entries(alarm.selectedDevices || {})));
    });
    return unsubscribe;
  }, [alarm, navigation]);

  const deleteSelectedDevice = async (id) => {
    const newSelectedDevices = new Map(selectedDevices);
    const storageKey = `${alarm.id}-${id}`;
    newSelectedDevices.delete(id);
    await AsyncStorage.removeItem(storageKey);
    setSelectedDevices(newSelectedDevices);
    updateSelectedDevices(Object.fromEntries(newSelectedDevices));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Button
          title="Show Devices on WiFi"
          onPress={() => navigation.navigate('WifiDevicesScreen', { 
            alarm, 
            selectedDevices, 
            updateSelectedDevices: (devices) => {
              setSelectedDevices(new Map(Object.entries(devices)));
              updateSelectedDevices(devices);
            } 
          })}
          color="#3498db"
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selected Devices:</Text>
        {selectedDevices.size > 0 ? (
          <ScrollView style={styles.selectedDevicesContainer}>
            {Array.from(selectedDevices.entries()).map(([id, { sku }]) => (
              <View key={id} style={styles.selectedDevice}>
                <Text style={styles.deviceText}>{sku}</Text>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() =>
                    navigation.navigate('DeviceSettings', {
                      alarmId: alarm.id,
                      device: { ...selectedDevices.get(id), device: id },
                      saveDeviceSettings: (updatedDevice) => {
                        const newSelectedDevices = new Map(selectedDevices);
                        newSelectedDevices.set(id, updatedDevice);
                        setSelectedDevices(newSelectedDevices);
                        updateSelectedDevices(Object.fromEntries(newSelectedDevices));
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
        ) : (
          <Text style={styles.noDevicesText}>No Devices Selected</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
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
  deviceText: {
    fontSize: 16,
    color: '#333',
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
  noDevicesText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default DeviceManager;
