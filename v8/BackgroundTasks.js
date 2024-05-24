import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// This is script is used to trigger the alarms even when the application is closed. 

const BACKGROUND_FETCH_TASK = 'background-fetch-task';

// Function to trigger action per device.
const handleTriggerDevices = async (alarm, userInfo) => {
  const { devices, sound, alertShown, snooze, snoozeDuration, snoozeDeviceAction, snoozeTime } = alarm;
  const { urlPost, apiKey } = userInfo; // will be retrieved from secure storage
  
  // headers for Govee API requests
  const headers = {
    'Content-Type': 'application/json',
    'Govee-API-Key': apiKey,
  };
  
  if (alertShown) {
    return; // Exit if alert has already been shown
  }

  // Update the alarm to indicate the alert has been shown
  const storedAlarms = await AsyncStorage.getItem('GoveeAlarmsStorage');
  if (storedAlarms) {
    const parsedAlarms = JSON.parse(storedAlarms);
    const alarms = parsedAlarms.map(a => {
      if (a.id === alarm.id) {
        return { ...a, alertShown: true };
      }
      return a;
    });

    await AsyncStorage.setItem('GoveeAlarmsStorage', JSON.stringify(alarms)); // since background task, can not update state, must update local storage
  }

  // Trigger devices
  for (const device of devices) {
    const { sku, device: deviceId, onOff, brightness, color } = device;
    const requestId = uuidv4();

    // function to create request data
    const createRequestData = (capabilityType, instance, value) => ({
      requestId,
      payload: {
        sku,
        device: deviceId,
        capability: {
          type: capabilityType,
          instance,
          value,
        },
      },
    });

    // function to send requst
    const sendRequest = async (requestData) => {
      try {
        const response = await axios.post(urlPost, requestData, { headers });
        console.log(`Device ${deviceId} updated successfully:`, response.data);
      } catch (error) {
        console.error(`Error updating device ${deviceId}:`, error.message);
      }
    };
    // If device set to OFF, then only need to send powerSwitch
    if (!onOff) {
      const requestData = createRequestData('devices.capabilities.on_off', 'powerSwitch', 0);
      await sendRequest(requestData);
    
    // if device set to ON, then need to send powerSwitch, brightness, and color. 
    } else {
      const onRequestData = createRequestData('devices.capabilities.on_off', 'powerSwitch', 1);
      const brightnessRequestData = createRequestData('devices.capabilities.range', 'brightness', brightness);
      const colorRequestData = createRequestData('devices.capabilities.color_setting', 'colorRgb', color);

      await sendRequest(onRequestData);
      await sendRequest(brightnessRequestData);
      await sendRequest(colorRequestData);
    }
  }

  // Play alarm sound
  if (sound && sound !== 'None') {
    const soundObject = new Audio.Sound();
    try {
      // selected sound from local storage
      if (sound.startsWith('file://')) { 
        await soundObject.loadAsync({ uri: sound });

      // selected sound from preset sounds
      } else {                                
        const soundPath = soundFiles[sound];
        if (!soundPath) {
          throw new Error(`Sound file not found for sound: ${sound}`);
        }
        await soundObject.loadAsync(soundPath);
      }
      await soundObject.setIsLoopingAsync(true); // Set sound to loop
      await soundObject.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }
};

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const storedUserInfo = await SecureStore.getItemAsync('GoveeUserInfo');
    const storedAlarms = await AsyncStorage.getItem('GoveeAlarmsStorage'); // since background task, must retrieve data from local storage

    if (storedUserInfo && storedAlarms) {
      const userInfo = JSON.parse(storedUserInfo);
      const alarms = JSON.parse(storedAlarms);
      const currentTime = new Date();

      for (let alarm of alarms) {
        const alarmTime = new Date(alarm.time);
        const snoozeEndTime = alarm.snoozeTime ? new Date(alarm.snoozeTime) : null;
        // check alarm time if snooze not enabled, if snooze enabled then check snooze time. 
        if (
          alarm.enabled &&
          ((alarm.snoozeTime == null && currentTime.getHours() === alarmTime.getHours() && currentTime.getMinutes() === alarmTime.getMinutes()) ||
            (alarm.snooze && snoozeEndTime && currentTime.getHours() === snoozeEndTime.getHours() && currentTime.getMinutes() === snoozeEndTime.getMinutes()))
        ) {
          await handleTriggerDevices(alarm, userInfo); // trigger devices
        }
      }
    }
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.Result.Failed;
  }
});

const registerBackgroundFetch = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60, // 1 minute
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background fetch registered successfully');
  } catch (error) {
    console.error('Error registering background fetch:', error);
  }
};

export { registerBackgroundFetch };