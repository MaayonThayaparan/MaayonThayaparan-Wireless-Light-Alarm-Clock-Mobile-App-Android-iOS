import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Button, StyleSheet, ScrollView, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const AlarmDetails = ({ route, navigation }) => {
  const { alarm, alarms, updateAlarms, textTitle } = route.params;
  const [showTimePicker, setShowTimePicker] = useState(true);
  const [selectedTime, setSelectedTime] = useState(new Date(alarm.time));
  const [selectedDevices, setSelectedDevices] = useState(alarm.devices || []);
  const [sound, setSound] = useState(alarm.sound);
  const [snooze, setSnooze] = useState(alarm.snooze);

  const saveAlarmDetails = useCallback(() => {
    let updatedAlarms;
    const existingAlarmIndex = alarms.findIndex(a => a.id === alarm.id);

    if (existingAlarmIndex !== -1) {
      updatedAlarms = alarms.map(a => {
        if (a.id === alarm.id) {
          return { ...a, time: selectedTime.toISOString(), devices: selectedDevices, sound, snooze };
        }
        return a;
      });
    } else {
      const newAlarm = { ...alarm, time: selectedTime.toISOString(), devices: selectedDevices, sound, snooze };
      updatedAlarms = [...alarms, newAlarm];
    }

    updateAlarms(updatedAlarms);
    navigation.goBack();
  }, [alarm, alarms, selectedTime, selectedDevices, sound, snooze, updateAlarms, navigation]);

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
    setShowTimePicker(true);
    if (newTime) {
      setSelectedTime(new Date(newTime));
    }
  };

  const updateSelectedDevices = (newSelectedDevices) => {
    setSelectedDevices(newSelectedDevices);
  };

  const updateSound = (newSound) => {
    setSound(newSound);
  };

  const updateSnooze = (newSnooze) => {
    setSnooze(newSnooze);
  };

  return (
    <ScrollView style={styles.container}>
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
          title="Devices"
          onPress={() => navigation.navigate('DeviceManager', { 
            alarm: { ...alarm, devices: selectedDevices }, 
            updateSelectedDevices 
          })}
          color="#3498db"
        />
        <Button
          title="Sound"
          onPress={() => Alert.alert('Sound Settings')}
          color="#3498db"
        />
        <Button
          title="Snooze"
          onPress={() => Alert.alert('Snooze Settings')}
          color="#3498db"
        />
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
});

export default AlarmDetails;
