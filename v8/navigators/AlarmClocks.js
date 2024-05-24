import React, { useContext, useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Switch, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GlobalStateContext } from "../context/GlobalStateContext";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';


// This Navigator is to display list of all alarm clocks. 

const AlarmClocks = ({ navigation }) => {
  const { alarms, saveStoredData, deleteAlarm, loadStoredData, handleTriggerDevices } = useContext(GlobalStateContext);
  const [isAscending, setIsAscending] = useState(true);
  const [isGrouped, setIsGrouped] = useState(false);
  const [showDetails, setShowDetails] = useState(true);  // New state for showing details

  // Load alarms from local storage each time screen is loaded. 
  useFocusEffect(
    useCallback(() => {
      loadStoredData();
    }, [])
  );

  // + icon is added to the header right, is used to add Alarms. 
  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Alarms",
      headerRight: () => (
        <TouchableOpacity onPress={addAlarm} style={styles.addButton}>
          <Ionicons name="add" size={32} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);


  // Create new alarm. 
  const addAlarm = () => {
    const newAlarm = {
      id: Date.now(),
      time: new Date().getTime(),
      devices: [],
      enabled: true,
      sound: 'None',
      alertShown: false,
      snooze: false,
      snoozeDuration: 5,
      snoozeDeviceAction: 'None',
      snoozeTime: null, 
    };
    navigation.navigate('AlarmDetails', { alarm: newAlarm, textTitle: "Add Alarm" });
  };

  // Used for testing, ensures the alarms trigger 
  useEffect(() => {
    const checkAlarm = setInterval(() => {
      const currentTime = new Date();
      alarms.forEach(alarm => {
        const alarmTime = new Date(alarm.time);
        const snoozeEndTime = alarm.snoozeTime ? new Date(alarm.snoozeTime) : null;

        // check alarm time if snooze not enabled, if snooze enabled then check snooze time. 
        if (
          alarm.enabled &&
          ((alarm.snoozeTime == null && currentTime.getHours() === alarmTime.getHours() && currentTime.getMinutes() === alarmTime.getMinutes()) ||
            (alarm.snooze && snoozeEndTime && currentTime.getHours() === snoozeEndTime.getHours() && currentTime.getMinutes() === snoozeEndTime.getMinutes()))
        ) {
          handleTriggerDevices(alarm);
        }
      });
    }, 1000);
    return () => clearInterval(checkAlarm);
  }, [alarms, handleTriggerDevices]);

  // Function to format mp3 file to user friendly name
  const formatSoundName = (name) => {
    if (name.startsWith('file://')) {
      return 'Custom';
    }
    return name.replace('.mp3', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Checks if alarm has onning devices, offing devices, a combination, or no devices selected. 
  const getDeviceStatus = (devices) => {
    if (devices.length === 0) return 'No Devices';
    const allOn = devices.every(device => device.onOff);
    const allOff = devices.every(device => !device.onOff);
    if (allOn) return `${devices.length} Devices (ON)`;
    if (allOff) return `${devices.length} Devices (OFF)`;
    return `Hybrid (${devices.length})`;
  };

  // Slide the alarm to the right to display the delete button. 
  const renderRightActions = (progress, dragX, alarm) => {
    const scale = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 70],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <TouchableOpacity onPress={() => deleteAlarm(alarm.id)} style={styles.deleteButton}>
          <Animated.View style={{ transform: [{ scale }], opacity }}>
            <Ionicons name="trash" size={24} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Wanted to only show the hours and minutes for formatting (am/pm to display smaller like iPhone)
  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    hours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    return `${hours}:${minutes}`;
  };

  // Function to sort alarms
  const sortAlarms = (alarms, ascending) => {
    return [...alarms].sort((a, b) => {
      const timeA = new Date(a.time).getTime();
      const timeB = new Date(b.time).getTime();
      return ascending ? timeA - timeB : timeB - timeA;
    });
  };

  // Function to group alarms by function 
  const groupAlarms = (alarms) => {
    const groups = {
      ON: [],
      OFF: [],
      NoDevices: [],
      Hybrid: [],
    };
  
    alarms.forEach(alarm => {
      const status = getDeviceStatus(alarm.devices);
      if (status.includes('ON')) {
        groups.ON.push(alarm);
      } else if (status.includes('OFF')) {
        groups.OFF.push(alarm);
      } else if (status.includes('Hybrid')) {
        groups.Hybrid.push(alarm);
      } else {
        groups.NoDevices.push(alarm);
      }
    });
  
    // Filter out empty groups
    return Object.fromEntries(Object.entries(groups).filter(([key, value]) => value.length > 0));
  };

  const sortedAlarms = sortAlarms(alarms, isAscending);
  const groupedAlarms = groupAlarms(sortedAlarms);

  const groupNameMapping = {
    ON: 'ON Devices',
    OFF: 'OFF Devices',
    NoDevices: 'No Devices',
    Hybrid: 'Hybrid'
  };
  
  return (
    <View style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsAscending(!isAscending)} // Toggle sorting
          >
            <Text style={styles.buttonText}>
              {isAscending ? 'Sort Descending' : 'Sort Ascending'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsGrouped(!isGrouped)} // Toggle grouping
          >
            <Text style={styles.buttonText}>
              {isGrouped ? 'Ungroup' : 'Group by Type'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowDetails(!showDetails)}  // Toggle showDetails state, will show/hide alarmDetails container (# of devices, snooze, sound)
          >
            <Text style={styles.buttonText}>
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Text>
          </TouchableOpacity>
        </View>
        {alarms.length > 0 ? (
          <ScrollView contentContainerStyle={styles.contentContainer}>
            {isGrouped ? (
              <>
                {Object.keys(groupedAlarms).map(group => (
                  <View key={group} style={[styles.groupContainer, styles[`group${group}`]]}>
                    <Text style={styles.groupTitle}>{groupNameMapping[group]}</Text>
                    {groupedAlarms[group].map((alarm) => (
                      <Swipeable
                        key={alarm.id}
                        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, alarm)} // Display the delete icon by swiping left
                      >
                        <TouchableOpacity
                          onPress={() => navigation.navigate('AlarmDetails', { alarm, textTitle: "Edit Alarm" })} // open alarm details
                          style={styles.alarmContainer}
                        >
                          <View style={styles.alarmInfoContainer}>
                            <Text style={[styles.alarmTime, !alarm.enabled && styles.disabledText]}> 
                              {formatTime(new Date(alarm.time))}
                              <Text style={[styles.amPm, !alarm.enabled && styles.disabledText]}> {new Date(alarm.time).getHours() >= 12 ? 'PM' : 'AM'}</Text>
                            </Text>
                            <Switch
                              value={alarm.enabled}
                              onValueChange={(value) => {
                                const updatedAlarms = alarms.map(a =>
                                  a.id === alarm.id ? { ...a, enabled: value } : a
                                );
                                saveStoredData(null, updatedAlarms);
                              }}
                            />
                          </View>
                          {showDetails && (
                            <Text style={styles.alarmDetails}>
                              {alarm.label}, {getDeviceStatus(alarm.devices)}, 
                              {alarm.sound !== 'None' ? <MaterialIcons name="volume-up" size={20} color="#000" style={styles.icon} /> : <MaterialIcons name="volume-off" size={20} color="#000" style={styles.icon} />}
                              {alarm.snooze ? <MaterialIcons name="snooze" size={16} color="#000" style={styles.icon} /> : null} {alarm.snooze ? `(${alarm.snoozeDuration}m)` : ''}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </Swipeable>
                    ))}
                  </View>
                ))}
              </>
            ) : (
              sortedAlarms.map((alarm) => (
                <Swipeable
                  key={alarm.id}
                  renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, alarm)}
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate('AlarmDetails', { alarm, textTitle: "Edit Alarm" })}
                    style={styles.alarmContainer}
                  >
                    <View style={styles.alarmInfoContainer}>
                      <Text style={[styles.alarmTime, !alarm.enabled && styles.disabledText]}>
                        {formatTime(new Date(alarm.time))}
                        <Text style={[styles.amPm, !alarm.enabled && styles.disabledText]}> {new Date(alarm.time).getHours() >= 12 ? 'PM' : 'AM'}</Text>
                      </Text>
                      <Switch
                        value={alarm.enabled}
                        onValueChange={(value) => {
                          const updatedAlarms = alarms.map(a =>
                            a.id === alarm.id ? { ...a, enabled: value } : a
                          );
                          saveStoredData(null, updatedAlarms);
                        }}
                      />
                    </View>
                    {showDetails && (
                      <Text style={styles.alarmDetails}>
                        {alarm.label}, {getDeviceStatus(alarm.devices)}, 
                        {alarm.sound !== 'None' ? <MaterialIcons name="volume-up" size={20} color="#000" style={styles.icon} /> : <MaterialIcons name="volume-off" size={20} color="#000" style={styles.icon} />}
                        {alarm.snooze ? <MaterialIcons name="snooze" size={16} color="#000" style={styles.icon} /> : null} {alarm.snooze ? `(${alarm.snoozeDuration}m)` : ''}
                      </Text>
                    )}
                  </TouchableOpacity>
                </Swipeable>
              ))
            )}
          </ScrollView>
        ) : (
          <Text style={styles.noAlarmsText}>No alarms available</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  container: {
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
    paddingTop: 12,
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    width: '100%',
  },
  alarmContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 4,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  alarmInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0, 
  },
  alarmTime: {
    fontSize: 50,
    marginRight: 8,
  },
  amPm: {
    fontSize: 22,
    marginLeft: 2,
  },
  alarmDetails: {
    fontSize: 14,
    color: '#888',
    flexWrap: 'wrap',
    marginTop: 0, 
  },
  noAlarmsText: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
  },
  addButton: {
    marginRight: 16,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
  },
  icon: {
    alignSelf: 'center',
  },
  groupContainer: {
    marginBottom: 2,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 7,
    marginLeft: 16,
    marginRight: 16,
    textAlign: 'left',
  },
  groupON: {
    backgroundColor: '#d4edda',
  },
  groupOFF: {
    backgroundColor: '#ffced0',
  },
  groupNoDevices: {
    backgroundColor: '#e2e3e5',
  },
  groupHybrid: {
    backgroundColor: '#d1ecf1',
  },
  disabledText: {
    color: '#888', // Grey color for disabled state
  },
});

export default AlarmClocks;
