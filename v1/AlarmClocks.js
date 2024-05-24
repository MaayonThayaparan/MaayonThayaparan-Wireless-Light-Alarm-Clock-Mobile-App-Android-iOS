import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Alarm from './Alarm';

const AlarmClocks = () => {
    const [alarms, setAlarms] = useState([]);

    useEffect(() => {
        loadAlarms();
    }, []);

    const loadAlarms = async () => {
        const storedAlarms = await AsyncStorage.getItem('alarms');
        if (storedAlarms) {
            setAlarms(JSON.parse(storedAlarms));
        }
    };

    const saveAlarms = async (newAlarms) => {
        await AsyncStorage.setItem('alarms', JSON.stringify(newAlarms));
        setAlarms(newAlarms);
    };

    const addAlarm = () => {
        const newAlarm = {
            id: Date.now(),
            time: new Date(),
            devices: [],
            selectedDevices: new Map()
        };
        saveAlarms([...alarms, newAlarm]);
    };

    return (
        <View style={styles.container}>
            {alarms.map((alarm) => (
                <Alarm key={alarm.id} alarm={alarm} onSave={saveAlarms} alarms={alarms} />
            ))}
            <Button title="Add New Alarm" onPress={addAlarm} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ecf0f1',
    }
});

export default AlarmClocks;
