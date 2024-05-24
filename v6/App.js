import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import GlobalStateProvider from './GlobalStateContext';
import AlarmClocks from './AlarmClocks';
import AlarmDetails from './AlarmDetails';
import DeviceManager from './DeviceManager';
import DeviceSettings from './DeviceSettings';
import WifiDevicesScreen from './WifiDevicesScreen';


const Stack = createStackNavigator();

const App = () => {
  return (
    <GlobalStateProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="AlarmClocks">
          <Stack.Screen name="AlarmClocks" component={AlarmClocks} />
          <Stack.Screen name="AlarmDetails" component={AlarmDetails} />
          <Stack.Screen name="DeviceManager" component={DeviceManager} />
          <Stack.Screen name="WifiDevicesScreen" component={WifiDevicesScreen} />
          <Stack.Screen name="DeviceSettings" component={DeviceSettings} />
        </Stack.Navigator>
      </NavigationContainer>
    </GlobalStateProvider>
  );
};

export default App;
