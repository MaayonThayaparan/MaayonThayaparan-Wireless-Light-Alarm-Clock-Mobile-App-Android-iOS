import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GlobalStateContext } from '../context/GlobalStateContext';

// This navigation shows the details for an individual alarm.

const AlarmDetails = ({ route, navigation }) => {
  const { alarm, textTitle } = route.params;
  const { alarms, saveStoredData, deleteAlarm } = useContext(GlobalStateContext);
  const [id, setID] = useState(alarm.id || Date.now());
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios'); // Always show for iOS
  const [selectedTime, setSelectedTime] = useState(new Date(alarm.time) || new Date());
  const [enabled, setEnabled] = useState(alarm.enabled || true); 
  const [alertShown, setAlertShown] = useState(alarm.alertShown || false);
  const [selectedDevices, setSelectedDevices] = useState(alarm.devices || []);
  const [sound, setSound] = useState(alarm.sound || 'None');
  const [snooze, setSnooze] = useState(alarm.snooze || false);
  const [snoozeDuration, setSnoozeDuration] = useState(alarm.snoozeDuration || 5);
  const [snoozeDeviceAction, setSnoozeDeviceAction] = useState(alarm.snoozeDeviceAction || 'None');
  const [label, setLabel] = useState(alarm.label || 'Alarm');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const labelInputRef = useRef(null);

  // Save alarms, will be stored to local storage.
  const saveAlarmDetails = () => {
    let updatedAlarms;
    const existingAlarmIndex = alarms.findIndex(a => a.id === alarm.id);

    if (existingAlarmIndex !== -1) {
      updatedAlarms = alarms.map(a => {
        if (a.id === alarm.id) {
          return { ...a, time: selectedTime.toISOString(), devices: selectedDevices, sound, snooze, snoozeDuration, snoozeDeviceAction, label };
        }
        return a;
      });
    } else {
      const newAlarm = { ...alarm, time: selectedTime.toISOString(), devices: selectedDevices, sound, snooze, snoozeDuration, snoozeDeviceAction, label };
      updatedAlarms = [...alarms, newAlarm];
    }

    saveStoredData(null, updatedAlarms);
    navigation.goBack();
  };

  // Set the navigation headers
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

  const handleTimeChange = (event, newTime) => {
    if (newTime) {
      setSelectedTime(new Date(newTime));
    }
    if (Platform.OS === 'android') {
      setShowTimePicker(false); // Hide the picker after selection on Android, it was causing issues
    }
  };

  const showTimePickerForAndroid = () => {
    setShowTimePicker(true); // Show the picker on button press for Android
  };

  const updateSelectedDevices = (newSelectedDevices) => {
    setSelectedDevices(newSelectedDevices);
  };

  const updateSound = (newSound) => {
    setSound(newSound);
  };

  const updateSnoozeSettings = (snooze, snoozeDuration, snoozeDeviceAction) => {
    setSnooze(snooze);
    setSnoozeDuration(snoozeDuration);
    setSnoozeDeviceAction(snoozeDeviceAction);
  };

  // Display user friendly sound name
  const formatSoundName = (name) => {
    if (name.startsWith('file://')) {
      return 'Custom';
    }
    return name.replace('.mp3', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Display when the alarm is onning devices, offing devices, combination, or no devices. 
  const getDeviceStatus = () => {
    if (selectedDevices.length === 0) return 'No Devices';
    const allOn = selectedDevices.every(device => device.onOff);
    const allOff = selectedDevices.every(device => !device.onOff);
    if (allOn) return `${selectedDevices.length} Devices (ON)`;
    if (allOff) return `${selectedDevices.length} Devices (OFF)`;
    return `${selectedDevices.length} Devices (Hybrid)`;
  };

  const focusLabelInput = () => {
    setIsEditingLabel(true);
    setTimeout(() => {
      if (labelInputRef.current) {
        labelInputRef.current.focus();
      }
    }, 100); // Timeout ensures that the ref is properly set before focusing
  };

  const handleDeleteAlarm = () => {
    deleteAlarm(alarm.id);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.form}>
        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'} // for iOS timepicker should always show, causes issues for Android
            onChange={handleTimeChange}
            style={styles.dateTimePicker}
          />
        )}
        <TouchableOpacity style={styles.row} onPress={focusLabelInput}> 
          <Text style={styles.label}>Label</Text>
          {isEditingLabel ? (
            <TextInput
              ref={labelInputRef}
              style={styles.value}
              value={label}
              onChangeText={setLabel}
              onBlur={() => setIsEditingLabel(false)}
            />
          ) : (
            <Text style={[styles.value, !label && { color: 'grey' }]}>{label || 'Alarm'}</Text>
          )}
        </TouchableOpacity>
        {Platform.OS === 'android' && ( 
          <TouchableOpacity style={styles.row} onPress={showTimePickerForAndroid}>  
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('DeviceManager', { alarm: { ...alarm, devices: selectedDevices }, updateSelectedDevices })}> 
          <Text style={styles.label}>Devices</Text>
          <Text style={styles.value}>{getDeviceStatus()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('SoundManager', { updateSound, currentSound: sound })}>
          <Text style={styles.label}>Sound</Text>
          <Text style={styles.value}>{formatSoundName(sound)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('SnoozeManager', { updateSnoozeSettings, snooze, snoozeDuration, snoozeDeviceAction, devices: selectedDevices })}>
          <Text style={styles.label}>Snooze</Text>
          <Text style={styles.value}>{snooze ? `Enabled (${snoozeDuration} min, ${snoozeDeviceAction})` : 'Disabled'}</Text>
        </TouchableOpacity>
      </ScrollView>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAlarm}
      >
        <Text style={styles.deleteButtonText}>Delete Alarm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  form: {
    flex: 1,
  },
  dateTimePicker: {
    marginBottom: 16,
  },
  row: {
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
  value: {
    fontSize: 18,
    color: '#888',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AlarmDetails;
