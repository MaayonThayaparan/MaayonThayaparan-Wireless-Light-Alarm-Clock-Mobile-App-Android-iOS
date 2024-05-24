import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, Button, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { GlobalStateContext } from "./GlobalStateContext";

const AlarmClocks = ({ navigation }) => {
  const [alarms, setAlarms] = useState([]);
  const { headers, urlGet, urlPost } = useContext(GlobalStateContext);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "",
    })
    loadAlarms();
  }, []);

  const loadAlarms = async () => {
    const storedAlarms = await AsyncStorage.getItem('GoveeAlarms');
    if (storedAlarms) {
      setAlarms(JSON.parse(storedAlarms));
    }
  };

  const saveAlarms = async (newAlarms) => {
    await AsyncStorage.setItem('GoveeAlarms', JSON.stringify(newAlarms));
    setAlarms(newAlarms);
  };

  const addAlarm = () => {
    const newAlarm = {
      id: Date.now(),
      time: new Date(),
      devices: [],
      enabled: true,
    };
    navigation.navigate('AlarmDetails', { alarm: newAlarm, alarms, updateAlarms: saveAlarms, textTitle: "Add Alarm" });
  };

  const deleteAlarm = async (id) => {
    const updatedAlarms = alarms.filter(alarm => alarm.id !== id);
    saveAlarms(updatedAlarms);
  };

  const handleTriggerDevices = async (alarm) => {
    const { devices } = alarm;
    devices.forEach(async (device) => {
      const { sku, device: deviceId, onOff, brightness, color } = device;
      const requestId = uuidv4();

      const createRequestData = (capabilityType, instance, value) => ({
        requestId,
        payload: {
          sku,
          device: deviceId,
          capability: {
            type: capabilityType,
            instance,
            value
          }
        }
      });

      const sendRequest = async (requestData) => {
        try {
          const response = await axios.post(urlPost, requestData, { headers });
          console.log(`Device ${deviceId} updated successfully:`, response.data);
        } catch (error) {
          console.error(`Error updating device ${deviceId}:`, error.message);
        }
      };

      if (!onOff) {
        const requestData = createRequestData('devices.capabilities.on_off', 'powerSwitch', 0);
        sendRequest(requestData);
      } else {
        const onRequestData = createRequestData('devices.capabilities.on_off', 'powerSwitch', 1);
        const brightnessRequestData = createRequestData('devices.capabilities.range', 'brightness', brightness);
        const colorRequestData = createRequestData('devices.capabilities.color_setting', 'colorRgb', color);

        sendRequest(onRequestData);
        sendRequest(brightnessRequestData);
        sendRequest(colorRequestData);
      }
    });

    const updatedAlarms = alarms.map(a => {
      if (a.id === alarm.id) {
        return { ...a, enabled: false };
      }
      return a;
    });
    saveAlarms(updatedAlarms);
  };

  useEffect(() => {
    const checkAlarm = setInterval(() => {
      const currentTime = new Date();
      const updatedAlarms = alarms.map(alarm => {
        const alarmTime = new Date(alarm.time);
        if (
          alarm.enabled &&
          currentTime.getHours() === alarmTime.getHours() &&
          currentTime.getMinutes() === alarmTime.getMinutes()
        ) {
          Alert.alert("Alarm", `Alarm at ${alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          handleTriggerDevices(alarm);
          return { ...alarm, triggered: true };
        }
        return alarm;
      });
      setAlarms(updatedAlarms);
    }, 1000);
    return () => clearInterval(checkAlarm);
  }, [alarms]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAlarms();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Button title="Add New Alarm" onPress={addAlarm} />
        {alarms.length > 0 ? (
          <ScrollView contentContainerStyle={styles.contentContainer}>
            {alarms.map((alarm) => (
              <TouchableOpacity
                key={alarm.id}
                onPress={() => navigation.navigate('AlarmDetails', { alarm, alarms, updateAlarms: saveAlarms, textTitle: "Edit Alarm" })}
              >
                <View style={styles.alarmContainer}>
                  <Text style={styles.alarmText}>{`${new Date(alarm.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</Text>
                  <Switch
                    value={alarm.enabled}
                    onValueChange={(value) => {
                      const updatedAlarms = alarms.map(a => 
                        a.id === alarm.id ? { ...a, enabled: value } : a
                      );
                      saveAlarms(updatedAlarms);
                    }}
                  />
                  <Button title="Delete" onPress={() => deleteAlarm(alarm.id)} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noAlarmsText}>No alarms available</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    alignItems: 'center',
  },
  alarmContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  alarmText: {
    fontSize: 18,
  },
  noAlarmsText: {
    marginTop: 20,
    fontSize: 18,
  },
});

export default AlarmClocks;
