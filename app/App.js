import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlobalStateProvider from './context/GlobalStateContext';
import AlarmClocks from './navigators/AlarmClocks';
import AlarmDetails from './navigators/AlarmDetails';
import DeviceManager from './navigators/DeviceManager';
import DeviceSettings from './navigators/DeviceSettings';
import WifiDevicesScreen from './navigators/WifiDevicesScreen';
import SoundManager from './navigators/SoundManager';
import SnoozeManager from './navigators/SnoozeManager';
import Settings from './navigators/Settings';
import HowToUse from './navigators/HowToUse';
import Troubleshoot from './navigators/Troubleshoot';
import Privacy from './navigators/Privacy';
import Credits from './navigators/Credits';
import { registerBackgroundFetch } from './BackgroundTasks';
import { registerRootComponent } from 'expo';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { GOVEE_API_KEY, GOVEE_URL_GET, GOVEE_URL_POST } from '@env';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';


const initializeStorage = async () => {

  const defaultUserInfo = {
    apiKey: GOVEE_API_KEY,
    urlGet: GOVEE_URL_GET,
    urlPost: GOVEE_URL_POST,
  };

  const defaultAlarms = []; 

  try {
    const storedUserInfo = await SecureStore.getItemAsync('GoveeUserInfo');
    const storedAlarms = await AsyncStorage.getItem('GoveeAlarmsStorage');
    
    if (!storedUserInfo) {
      await SecureStore.setItemAsync('GoveeUserInfo', JSON.stringify(defaultUserInfo));
    }
    if (!storedAlarms) {
      setAlarms(JSON.parse(defaultAlarms));
    }
  } catch (error) {
    console.error('Failed to load data from storage', error);
  }
};



Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  const projectId = Constants.manifest?.extra?.eas?.projectId;

  if (projectId) {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } else {
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  console.log(token);
  return token;
}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AlarmStack = () => (
  <Stack.Navigator initialRouteName="AlarmClocks">
    <Stack.Screen name="AlarmClocks" component={AlarmClocks} options={{ headerShown: true, title: 'Alarms' }} /> 
    <Stack.Screen name="AlarmDetails" component={AlarmDetails} options={{ headerShown: true, title: 'Alarm Details' }} />
    <Stack.Screen name="SnoozeManager" component={SnoozeManager} options={{ headerShown: true, title: 'Snooze Manager' }} />
    <Stack.Screen name="SoundManager" component={SoundManager} options={{ headerShown: true, title: 'Sound Manager' }} />
    <Stack.Screen name="DeviceManager" component={DeviceManager} options={{ headerShown: true, title: 'Device Manager' }} />
    <Stack.Screen name="WifiDevicesScreen" component={WifiDevicesScreen} options={{ headerShown: true, title: 'WiFi Devices' }} />
    <Stack.Screen name="DeviceSettings" component={DeviceSettings} options={{ headerShown: true, title: 'Device Settings' }} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator initialRouteName="Settings">
    <Stack.Screen name="SettingsMain" component={Settings} options={{ headerShown: true, title: 'Settings' }} />
    <Stack.Screen name="HowToUse" component={HowToUse} options={{ headerShown: true, title: 'How to Use' }} />
    <Stack.Screen name="Troubleshoot" component={Troubleshoot} options={{ headerShown: true, title: 'Troubleshoot' }} />
    <Stack.Screen name="Privacy" component={Privacy} options={{ headerShown: true, title: 'Privacy' }} />
    <Stack.Screen name="Credits" component={Credits} options={{ headerShown: true, title: 'Credits' }} />
  </Stack.Navigator>
);

const App = () => {
  useEffect(() => {

    const initializeApp = async () => {
      await initializeStorage();
      await registerForPushNotificationsAsync();
      await registerBackgroundFetch();
    };

    

    // Set up notification categories
    Notifications.setNotificationCategoryAsync('alarm', [
      {
        identifier: 'STOP_ALARM',
        buttonTitle: 'Stop',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'SNOOZE_ALARM',
        buttonTitle: `Snooze`,
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { alarmId, snoozeDuration, snoozeDeviceAction } = response.notification.request.content.data;
      const actionIdentifier = response.actionIdentifier;

      if (actionIdentifier === 'STOP_ALARM') {
        await stopAlarm(alarmId);
      } else if (actionIdentifier === 'SNOOZE_ALARM') {
        await snoozeAlarm(alarmId, snoozeDuration, snoozeDeviceAction);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <GlobalStateProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'Alarms') {
                iconName = 'alarm-outline';
              } else if (route.name === 'Settings') {
                iconName = 'settings-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            headerShown: false, // don't want to see headers
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              display: 'flex',
            },
          })}
        >
          <Tab.Screen name="Alarms" component={AlarmStack} />
          <Tab.Screen name="Settings" component={SettingsStack} />
        </Tab.Navigator>
      </NavigationContainer>
    </GlobalStateProvider>
  );
};

export default App;
