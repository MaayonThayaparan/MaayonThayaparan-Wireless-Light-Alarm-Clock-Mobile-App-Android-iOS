import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';

const ALARM_TASK = 'alarm-task';

// Define the background task
TaskManager.defineTask(ALARM_TASK, async () => {
    const alarms = JSON.parse(await AsyncStorage.getItem('alarms')) || [];
    const currentTime = new Date();
    for (let alarm of alarms) {
      const alarmTime = new Date(alarm.time);
      if (currentTime.getHours() === alarmTime.getHours() && currentTime.getMinutes() === alarmTime.getMinutes()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Alarm",
            body: `Alarm at ${alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            sound: true,
          },
          trigger: null,
        });
  
        // Trigger devices
        const selectedDevices = new Map(Object.entries(alarm.selectedDevices || {}));
        selectedDevices.forEach(async (device, deviceId) => {
          if (device.onOff === 0) {
            const requestData = {
              requestId: uuidv4(),
              payload: {
                sku: device.sku,
                device: deviceId,
                capability: {
                  type: "devices.capabilities.on_off",
                  instance: "powerSwitch",
                  value: 0
                }
              }
            };
            try {
              const response = await axios.post(urlPost, requestData, {headers});
              console.log('Device turned off successfully:', deviceId, response.data);
            } catch (error) {
              console.error('Error turning off device:', deviceId, error.message);
            }
          } else {
            const brightnessRequestData = {
              requestId: uuidv4(),
              payload: {
                sku: device.sku,
                device: deviceId,
                capability: {
                  type: "devices.capabilities.range",
                  instance: "brightness",
                  value: device.brightness
                }
              }
            };
            const colorRequestData = {
              requestId: uuidv4(),
              payload: {
                sku: device.sku,
                device: deviceId,
                capability: {
                  type: "devices.capabilities.color_setting",
                  instance: "colorRgb",
                  value: device.color
                }
              }
            };
            const onOffRequestData = {
              requestId: uuidv4(),
              payload: {
                sku: device.sku,
                device: deviceId,
                capability: {
                  type: "devices.capabilities.on_off",
                  instance: "powerSwitch",
                  value: 1
                }
              }
            };
            try {
              await axios.post(urlPost, brightnessRequestData, {headers});
              await axios.post(urlPost, colorRequestData, {headers});
              const response = await axios.post(urlPost, onOffRequestData, {headers});
              console.log('Device turned on successfully:', deviceId, response.data);
            } catch (error) {
              console.error('Error turning on device:', deviceId, error.message);
            }
          }
        });
        break;
      }
    }
    return BackgroundFetch.Result.NewData;
  });
  
  // Register the background task
  BackgroundFetch.registerTaskAsync(ALARM_TASK, {
    minimumInterval: 1, // run the task every minute
    stopOnTerminate: false,
    startOnBoot: true,
  });