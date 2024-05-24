import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GlobalStateProvider } from './GlobalStateContext';
import AlarmClocks from './AlarmClocks';
import AlarmDetails from './AlarmDetails';
import DeviceSettings from './DeviceSettings';

const Stack = createStackNavigator();

const App = () => {
  return (
    <GlobalStateProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Alarms" component={AlarmClocks} />
          <Stack.Screen name="AlarmDetails" component={AlarmDetails} />
          <Stack.Screen name="DeviceSettings" component={DeviceSettings} />
        </Stack.Navigator>
      </NavigationContainer>
    </GlobalStateProvider>

  );
};

export default App;
