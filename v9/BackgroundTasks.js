import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { soundFiles } from './resources/soundFiles';

// This script is used to trigger the alarms even when the application is closed.

const BACKGROUND_FETCH_TASK = 'com.limitlesscreator.wifilightalarm.taskIdentifier';
let soundObjectInstance = null; // Global variable to keep track of the sound object instance

// Function to trigger action per device.
const handleTriggerDevices = async (alarm, userInfo) => {
  const { devices, sound, alertShown, snooze, snoozeDuration, snoozeDeviceAction } = alarm;
  const { urlPost, apiKey } = userInfo; // will be retrieved from secure storage
  
  // Headers for Govee API requests
  const headers = {
    'Content-Type': 'application/json',
    'Govee-API-Key': apiKey,
  };
  
  if (alertShown) {
    console.log('Alert already shown, exiting.');
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

    // Function to create request data
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

    // Function to send request
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
    
    // If device set to ON, then need to send powerSwitch, brightness, and color. 
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
    const newSoundObject = new Audio.Sound();
    try {
      // selected sound from local storage
      if (sound.startsWith('file://')) { 
        await newSoundObject.loadAsync({ uri: sound });

      // selected sound from preset sounds
      } else {                                
        const soundPath = soundFiles[sound];
        if (!soundPath) {
          throw new Error(`Sound file not found for sound: ${sound}`);
        }
        await newSoundObject.loadAsync(soundPath);
      }
      await newSoundObject.setIsLoopingAsync(true); // Set sound to loop
      await newSoundObject.playAsync();
      soundObjectInstance = newSoundObject;
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  // Schedule a notification
  await scheduleNotification(alarm, soundObjectInstance);
};

// Stop alarm
const stopAlarm = async (alarmId) => {
  const storedAlarms = await AsyncStorage.getItem('GoveeAlarmsStorage');
  if (storedAlarms) {
    const parsedAlarms = JSON.parse(storedAlarms);
    const updatedAlarms = parsedAlarms.map(a => {
      if (a.id === alarmId) {
        return { ...a, enabled: false, alertShown: false, snoozeTime: null };
      }
      return a;
    });
    await AsyncStorage.setItem('GoveeAlarmsStorage', JSON.stringify(updatedAlarms));
  }

  if (soundObjectInstance) {
    await soundObjectInstance.stopAsync();
    await soundObjectInstance.unloadAsync();
    soundObjectInstance = null; // Clean up the sound object
  }
};

// Snooze alarm
const snoozeAlarm = async (alarmId, snoozeDuration, snoozeDeviceAction) => {
  const snoozeEndTime = new Date();
  snoozeEndTime.setMinutes(snoozeEndTime.getMinutes() + snoozeDuration);

  // Disable alarm sound upon stop
  const storedAlarms = await AsyncStorage.getItem('GoveeAlarmsStorage');
  if (storedAlarms) {
    const parsedAlarms = JSON.parse(storedAlarms);
    const updatedAlarms = parsedAlarms.map(a => {
      if (a.id === alarmId) {
        return { ...a, snoozeTime: snoozeEndTime.toISOString(), alertShown: false };
      }
      return a;
    });
    await AsyncStorage.setItem('GoveeAlarmsStorage', JSON.stringify(updatedAlarms));
  }

  // Disable alarm sound upon snooze
  console.log("Stopping sound object");
  if (soundObjectInstance) {
    try {
      await soundObjectInstance.stopAsync();
      await soundObjectInstance.unloadAsync();
      soundObjectInstance = null; // Clean up the sound object
      console.log("Sound object stopped and unloaded");
    } catch (error) {
      console.error('Error stopping/unloading sound object:', error);
    }
  } else {
    console.log("No sound object instance to stop");
  }

  // Handle snooze device action
  if (snoozeDeviceAction !== 'None') {
    console.log("Handling snooze device action");
    const storedUserInfo = await SecureStore.getItemAsync('GoveeUserInfo');
    if (storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo);

      // headers for Govee API requests
      const headers = {
        'Content-Type': 'application/json',
        'Govee-API-Key': parsedUserInfo.apiKey,
      };

      const alarm = JSON.parse(storedAlarms).find(a => a.id === alarmId);
      for (const device of alarm.devices) {
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
              value: actionValue,
            },
          },
        };

        console.log("Sending request to device:", deviceId, "with action value:", actionValue);
        console.log("Request data:", requestData);
        console.log("Request headers:", headers);

        try {
          const response = await axios.post(parsedUserInfo.urlPost, requestData, { headers });
          console.log(`Device ${deviceId} updated successfully:`, response.data);
        } catch (error) {
          console.error(`Error updating device ${deviceId}:`, error.message);
          if (error.response) {
            console.error('Error response data:', error.response.data);
          }
        }
      }
    } else {
      console.log("No user info found in SecureStore");
    }
  } else {
    console.log("Snooze device action is 'None'");
  }
};

// Function to schedule a notification
const scheduleNotification = async (alarm, soundObjectInstance) => {
  const { snooze, snoozeDuration, snoozeDeviceAction } = alarm;

  let actions = [
    {
      identifier: 'STOP_ALARM',
      buttonTitle: 'Stop',
      options: {
        opensAppToForeground: true,
      },
    }
  ];

  if (snooze) {
    actions.push({
      identifier: 'SNOOZE_ALARM',
      buttonTitle: `Snooze (${snoozeDuration} min)`,
      options: {
        opensAppToForeground: true,
      },
    });
  }

  await Notifications.setNotificationCategoryAsync('alarm', actions);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Alarm',
      body: `Alarm at ${new Date(alarm.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      sound: soundObjectInstance ? soundObjectInstance : undefined,
      categoryIdentifier: 'alarm',
      data: { alarmId: alarm.id, snoozeDuration, snoozeDeviceAction },
    },
    trigger: null,
  });
};

// Function to handle notification responses
const handleNotificationResponse = async (response) => {
  const { alarmId, snoozeDuration, snoozeDeviceAction } = response.notification.request.content.data;
  const actionIdentifier = response.actionIdentifier;

  if (actionIdentifier === 'STOP_ALARM') {
    await stopAlarm(alarmId);
  } else if (actionIdentifier === 'SNOOZE_ALARM') {
    await snoozeAlarm(alarmId, snoozeDuration, snoozeDeviceAction);
  }
};


// Set up notification response listener
Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

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
      minimumInterval: 10, // 1 minute
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background fetch registered successfully');
  } catch (error) {
    console.error('Error registering background fetch:', error);
  }
};

export { registerBackgroundFetch };
