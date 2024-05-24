import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

const DeviceManager = ({ route, navigation }) => {
  const { alarm, updateSelectedDevices } = route.params;
  const [selectedDevices, setSelectedDevices] = useState(alarm.devices || []);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Manage Devices",
    })
    const unsubscribe = navigation.addListener('focus', () => {
      setSelectedDevices(alarm.devices || []);
    });
    return unsubscribe;
  }, [alarm, navigation]);

  const deleteSelectedDevice = (id) => {
    const newSelectedDevices = selectedDevices.filter(device => device.device !== id);
    setSelectedDevices(newSelectedDevices);
    updateSelectedDevices(newSelectedDevices);
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
              setSelectedDevices(devices);
              updateSelectedDevices(devices);
              alarm.devices = devices; // Ensure alarm object is updated with the latest devices
            } 
          })}
          color="#3498db"
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selected Devices:</Text>
        {selectedDevices.length > 0 ? (
          <ScrollView style={styles.selectedDevicesContainer}>
            {selectedDevices.map(({ device, sku }) => (
              <View key={device} style={styles.selectedDevice}>
                <Text style={styles.deviceText}>{sku}</Text>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() =>
                    navigation.navigate('DeviceSettings', {
                      alarmId: alarm.id,
                      device: selectedDevices.find(d => d.device === device),
                      saveDeviceSettings: (updatedDevice) => {
                        const newSelectedDevices = selectedDevices.map(d =>
                          d.device === device ? updatedDevice : d
                        );
                        setSelectedDevices(newSelectedDevices);
                        updateSelectedDevices(newSelectedDevices);
                        alarm.devices = newSelectedDevices; // Ensure alarm object is updated with the latest devices
                      },
                    })
                  }
                >
                  <Text style={styles.settingsText}>Settings</Text>
                </TouchableOpacity>
                <Button
                  title="Delete"
                  onPress={() => deleteSelectedDevice(device)}
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
