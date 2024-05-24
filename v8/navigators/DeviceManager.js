import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons'; // For gear and trash icons

// Navigation to show all selected devices. 
const DeviceManager = ({ route, navigation }) => {
  const { alarm, updateSelectedDevices } = route.params;
  const [selectedDevices, setSelectedDevices] = useState(alarm.devices || []);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Manage Devices",
    });
    const unsubscribe = navigation.addListener('focus', () => {
      setSelectedDevices(alarm.devices || []);
    });
    return unsubscribe;
  }, [alarm, navigation]);

  // Function to delete selected device
  const deleteSelectedDevice = (id) => {
    const newSelectedDevices = selectedDevices.filter(device => device.device !== id);
    setSelectedDevices(newSelectedDevices);
    updateSelectedDevices(newSelectedDevices);
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.wifiButton}
        onPress={() => navigation.navigate('WifiDevicesScreen', {
          alarm,
          selectedDevices,
          updateSelectedDevices: (devices) => {
            setSelectedDevices(devices);
            updateSelectedDevices(devices);
            alarm.devices = devices; // Ensure alarm object is updated with the latest devices
          }
        })}
      >
        <Text style={styles.wifiButtonText}>Show Devices on WiFi</Text>
      </TouchableOpacity>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selected Devices:</Text>
        {selectedDevices.length > 0 ? (
          <ScrollView style={styles.selectedDevicesContainer}>
            {selectedDevices.map(({ device, sku, onOff, hexColor, label }) => (
              <View key={device} style={styles.selectedDevice}>
                <TouchableOpacity
                  style={styles.deviceRow}
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
                  <Ionicons name="settings" size={24} color="#888" style={styles.settingsIcon} />
                  <View style={[styles.deviceIndicator, { backgroundColor: onOff ? hexColor : '#000' }]} />
                  <Text style={styles.deviceText}>{label || sku}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteSelectedDevice(device)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="close" size={24} color="#e74c3c" />
                </TouchableOpacity>
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
  wifiButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
    borderRadius: 8,
  },
  wifiButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedDevicesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedDevice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  settingsButton: {
    padding: 10,
  },
  deleteButton: {
    padding: 10,
  },
  noDevicesText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  deviceIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
    marginLeft: 10,
  },
  settingsIcon: {
    padding: 10,
  },
});

export default DeviceManager;
