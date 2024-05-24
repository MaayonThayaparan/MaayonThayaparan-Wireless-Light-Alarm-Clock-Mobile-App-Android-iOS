import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import axios from 'axios';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Alert } from 'react-native';
import { soundFiles } from '../resources/soundFiles';
import { GOVEE_API_KEY, GOVEE_URL_GET, GOVEE_URL_POST } from '@env';

// Initialize global variables and functions for application. 

export const GlobalStateContext = createContext();

export const GlobalStateProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState({
    apiKey: GOVEE_API_KEY,
    urlGet: GOVEE_URL_GET,
    urlPost: GOVEE_URL_POST,
  });
  const [alarms, setAlarms] = useState([]);
  const [soundObject, setSoundObject] = useState(null);

  // headers are the same for all requests
  const headers = {
    'Content-Type': 'application/json',
    'Govee-API-Key': userInfo.apiKey,
  };

  useEffect(() => {
    loadStoredData();
  }, []);

  // Retrieve data from local storage
  const loadStoredData = async () => {
    try {
      const storedUserInfo = await SecureStore.getItemAsync('GoveeUserInfo');
      const storedAlarms = await AsyncStorage.getItem('GoveeAlarmsStorage');
      
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }
      if (storedAlarms) {
        setAlarms(JSON.parse(storedAlarms));
      }
    } catch (error) {
      console.error('Failed to load data from storage', error);
    }
  };

  // Save data to local storage
  const saveStoredData = async (newUserInfo, newAlarms) => {
    if (newUserInfo) {
      try {
        await SecureStore.setItemAsync('GoveeUserInfo', JSON.stringify(newUserInfo));
        setUserInfo(newUserInfo);
      } catch (error) {
        console.error('Failed to save userInfo to SecureStore', error);
      }
    }

    if (newAlarms) {
      try {
        await AsyncStorage.setItem('GoveeAlarmsStorage', JSON.stringify(newAlarms));
        setAlarms(newAlarms);
      } catch (error) {
        console.error('Failed to save alarms to AsyncStorage', error);
      }
    }
  };

  // delete alarm and update local storage
  const deleteAlarm = async (id) => {
    const updatedAlarms = alarms.filter(alarm => alarm.id !== id);
    saveStoredData(null, updatedAlarms);
  };

  // Used in testing to see if alarm logic worked, this will solely be done by background task in production. 
  const handleTriggerDevices = async (alarm) => {
    const { devices, sound, alertShown, snooze, snoozeDuration, snoozeDeviceAction, snoozeTime } = alarm;
    if (alertShown) {
      return; // Exit if alert has already been shown
    }

    // Update the alarm to indicate the alert has been shown
    const updatedAlarms = alarms.map(a => {
      if (a.id === alarm.id) {
        return { ...a, alertShown: true };
      }
      return a;
    });
    saveStoredData(null, updatedAlarms);

    // Trigger devices first
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
          const response = await axios.post(userInfo.urlPost, requestData, { headers });
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

    // Play alarm sound
    let soundObjectInstance = null;
    if (sound && sound !== 'None') {
      const newSoundObject = new Audio.Sound();
      try {
        if (sound.startsWith('file://')) {
          await newSoundObject.loadAsync({ uri: sound });
        } else {
          const soundPath = soundFiles[sound];
          if (!soundPath) {
            throw new Error(`Sound file not found for sound: ${sound}`);
          }
          await newSoundObject.loadAsync(soundPath);
        }
        await newSoundObject.setIsLoopingAsync(true); // Set sound to loop
        await newSoundObject.playAsync();
        setSoundObject(newSoundObject);
        soundObjectInstance = newSoundObject;
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }

    // Prepare alert buttons
    const alertButtons = [
      {
        text: "Stop",
        onPress: async () => {
          if (soundObjectInstance) {
            await soundObjectInstance.stopAsync();
            await soundObjectInstance.unloadAsync();
            setSoundObject(null); // Clean up the sound object
          }

          // Update alarms
          const updatedAlarms = alarms.map(a => {
            if (a.id === alarm.id) {
              return { ...a, enabled: false, alertShown: false, snoozeTime: null };
            }
            return a;
          });
          saveStoredData(null, updatedAlarms);
        }
      }
    ];
    
    // determine what happens if alarm is snoozed
    if (snooze) {
      alertButtons.push({
        text: `Snooze (${snoozeDuration} min)`,
        onPress: async () => {
          if (soundObjectInstance) {
            await soundObjectInstance.stopAsync();
            await soundObjectInstance.unloadAsync();
            setSoundObject(null); // Clean up the sound object
          }

          // Calculate snooze time
          const snoozeEndTime = new Date();
          snoozeEndTime.setMinutes(snoozeEndTime.getMinutes() + snoozeDuration);

          // Update alarms
          const updatedAlarms = alarms.map(a => {
            if (a.id === alarm.id) {
              return { ...a, snoozeTime: snoozeEndTime.toISOString(), alertShown: false };
            }
            return a;
          });
          saveStoredData(null, updatedAlarms);

          // Handle snooze device action
          if (snoozeDeviceAction !== 'None') {
            devices.forEach(async (device) => {
              const { sku, device: deviceId } = device;
              const requestId = uuidv4();
              const actionValue = snoozeDeviceAction === 'ON' ? 1 : 0;

              const requestData = {
                requestId,
                payload: {
                  sku,
                  device: deviceId,
                  capability: {
                    type: 'devices.capabilities.on_off',
                    instance: 'powerSwitch',
                    value: actionValue
                  }
                }
              };

              try {
                const response = await axios.post(userInfo.urlPost, requestData, { headers });
                console.log(`Device ${deviceId} updated successfully:`, response.data);
              } catch (error) {
                console.error(`Error updating device ${deviceId}:`, error.message);
              }
            });
          }
        }
      });
    }

    // Show alert with conditional buttons
    Alert.alert(
      "Alarm",
      `Alarm at ${new Date(alarm.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      alertButtons
    );
  };

  return (
    <GlobalStateContext.Provider value={{ userInfo, setUserInfo, alarms, headers, saveStoredData, loadStoredData, deleteAlarm, handleTriggerDevices }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export default GlobalStateProvider;