import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AlarmClocks from './AlarmClocks';
import AlarmDetails from './AlarmDetails';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Alarms" component={AlarmClocks} />
        <Stack.Screen name="AlarmDetails" component={AlarmDetails} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
