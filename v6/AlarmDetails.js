import React, { useState, useEffect, useCallback, useContext } from "react";
import { View, Text, Button, StyleSheet, ScrollView, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlobalStateContext } from "./GlobalStateContext";

const AlarmDetails = ({ route, navigation }) => {
  const { alarm, alarms, updateAlarms, textTitle } = route.params;
  const [showTimePicker, setShowTimePicker] = useState(true);
  const [selectedTime, setSelectedTime] = useState(new Date(alarm.time));
  const [selectedDevices, setSelectedDevices] = useState(new Map(Object.entries(alarm.selectedDevices || {})));

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

  const handleTimeChange = (event, newTime) => {
    setShowTimePicker(true);
    if (newTime) {
      setSelectedTime(new Date(newTime));
    }
  };

  const updateSelectedDevices = (newSelectedDevices) => {
    setSelectedDevices(new Map(Object.entries(newSelectedDevices)));
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
          title="Device Settings"
          onPress={() => navigation.navigate('DeviceManager', { alarm, updateSelectedDevices })}
          color="#3498db"
        />
        <Button
          title="Sound Settings"
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
