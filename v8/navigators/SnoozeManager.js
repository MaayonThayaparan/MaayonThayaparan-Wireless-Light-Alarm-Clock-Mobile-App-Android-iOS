import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from 'react-native'; // Assuming you use react-native-elements for buttons

// Navigation for snooze settings per alarm. Options to on/off, duration, and device actions. 
const SnoozeManager = ({ route, navigation }) => {
  const { updateSnoozeSettings, snooze, snoozeDuration, snoozeDeviceAction, devices } = route.params;
  const [isSnoozeEnabled, setIsSnoozeEnabled] = useState(snooze);
  const [duration, setDuration] = useState(String(snoozeDuration));
  const [deviceAction, setDeviceAction] = useState(snoozeDeviceAction);

  // if no devices, device action should automatically be set to 'None'. 
  useEffect(() => {
    if (devices.length === 0) {
      setDeviceAction('None');
    }
  }, [devices]);

  const handleSave = () => {
    updateSnoozeSettings(isSnoozeEnabled, parseInt(duration), deviceAction);
    navigation.goBack();
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Snooze",
      headerRight: () => (
        <Button
          onPress={handleSave}
          title="Save"
          type="clear"
          titleStyle={{ color: '#007AFF' }}
        />
      ),
    });
  }, [navigation, handleSave]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formRow}>
        <Text style={styles.label}>Enable Snooze?</Text>
        <Switch 
          value={isSnoozeEnabled} 
          onValueChange={setIsSnoozeEnabled} 
        />
      </View>
      <View style={styles.formRow}>
        <Text style={styles.label}>Duration (min)</Text>
        <TextInput 
          style={[styles.input, (!isSnoozeEnabled && styles.disabledInput)]}
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
          editable={isSnoozeEnabled} // Make input read-only if snooze is disabled
        />
      </View>
      <View style={styles.formRow}>
        <Text style={styles.label}>Device Action</Text>
        <View style={styles.buttonGroup}>
          {['None', 'ON', 'OFF'].map(action => (
            <TouchableOpacity
              key={action}
              style={[
                styles.actionButton,
                deviceAction === action && styles.selectedButton,
                (!isSnoozeEnabled || devices.length === 0) && styles.disabledButton // Disable button if snooze is disabled or no devices
              ]}
              onPress={() => isSnoozeEnabled && devices.length > 0 && setDeviceAction(action)} 
            >
              <Text style={[
                styles.buttonText,
                deviceAction === action && styles.selectedButtonText
              ]}>
                {action}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selected Devices:</Text> 
        {devices.length > 0 ? (
          devices.map(({ device, sku, label }) => (
            <View key={device} style={styles.selectedDevice}>
              <Text style={styles.deviceText}>{label || sku}</Text>
            </View>
          ))
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
    backgroundColor: '#f2f2f7',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
  },
  input: {
    height: 40,
    width: 60,
    borderColor: '#ccc',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#e0e0e0',
    borderColor: '#aaa',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedButtonText: {
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedDevice: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  deviceText: {
    fontSize: 16,
  },
  noDevicesText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default SnoozeManager;
