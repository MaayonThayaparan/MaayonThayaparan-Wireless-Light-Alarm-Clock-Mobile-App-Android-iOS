import React, { useState, useEffect, useCallback, useRef } from "react";
import { TouchableOpacity, View, Text, Button, StyleSheet } from "react-native";
import Slider from '@react-native-community/slider';
import ColorPicker from 'react-native-wheel-color-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from 'lodash';

const DeviceSettings = ({ route, navigation }) => {
  const { alarmId, device, saveDeviceSettings } = route.params;

  const defaultOnOff = true;
  const defaultBrightness = 50;
  const defaultHexColor = "#ffffff";
  const defaultColor = 16777215;

  const [onOff, setOnOff] = useState(device.onOff !== undefined ? device.onOff : defaultOnOff);
  const [brightness, setBrightness] = useState(device.brightness !== undefined ? device.brightness : defaultBrightness);
  const [hexColor, setHexColor] = useState(device.hexColor !== undefined ? device.hexColor : defaultHexColor);
  const [color, setColor] = useState(device.color !== undefined ? device.color : defaultColor);

  const debouncedSetBrightness = useRef(debounce(setBrightness, 100)).current;

  const saveSettings = useCallback(async () => {
    const updatedDevice = {
      ...device,
      onOff,
      brightness,
      hexColor,
      color
    };
    const storageKey = `${alarmId}-${device.device}`;
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedDevice));
      console.log("Settings saved to AsyncStorage.");
      saveDeviceSettings(updatedDevice);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [alarmId, device, onOff, brightness, hexColor, color, saveDeviceSettings, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Device Settings",
      headerRight: () => (
        <Button
          onPress={saveSettings}
          title="Save"
          color="#000"
        />
      ),
    });
  }, [navigation, saveSettings]);

  useEffect(() => {
    const loadDeviceSettings = async () => {
      const storageKey = `${alarmId}-${device.device}`;
      try {
        const storedSettings = await AsyncStorage.getItem(storageKey);
        if (storedSettings) {
          const settings = JSON.parse(storedSettings);
          setOnOff(settings.onOff !== undefined ? settings.onOff : defaultOnOff);
          setBrightness(settings.brightness !== undefined ? settings.brightness : defaultBrightness);
          setHexColor(settings.hexColor !== undefined ? settings.hexColor : defaultHexColor);
          setColor(settings.color !== undefined ? settings.color : defaultColor);
          console.log("Loaded settings from AsyncStorage:", settings);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };

    loadDeviceSettings();
  }, [alarmId, device]);

  const handleColorChangeComplete = (color) => {
    const rgb = colorToRgb(color);
    const colorNumber = rgbToNumber(rgb);
    setHexColor(color);
    setColor(colorNumber);
  };

  const colorToRgb = (color) => {
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map((hex) => hex + hex).join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const rgbToNumber = ({ r, g, b }) => {
    return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{device.sku}</Text>
        <Text style={styles.idTitle}>{`${device.device}`}</Text>
      </View>
      <View style={styles.settingContainer}>
        <Text style={styles.settingLabel}>On/Off Light</Text>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: onOff ? 'green' : 'red' }]}
          onPress={() => setOnOff(!onOff)}
        >
          <Text style={styles.toggleButtonText}>{onOff ? "ON" : "OFF"}</Text>
        </TouchableOpacity>
      </View>
      {onOff && (
        <>
          <View style={styles.settingContainer}>
            <Text style={styles.settingLabel}>Brightness</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={100}
                step={1}
                value={brightness}
                onValueChange={debouncedSetBrightness}
              />
              <Text style={styles.sliderValue}>{brightness}</Text>
            </View>
          </View>
          <View style={styles.settingContainer}>
            <Text style={styles.settingLabel}>Color</Text>
            <ColorPicker
              color={hexColor}
              onColorChangeComplete={handleColorChangeComplete}
              style={styles.colorPicker}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  titleContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  idTitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  settingContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  toggleButton: {
    padding: 10,
    borderRadius: 5,
    marginTop: 8,
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
  },
  sliderValue: {
    width: 40,
    textAlign: 'center',
  },
  colorPicker: {
    marginTop: 16,
    height: 200,
  },
});

export default DeviceSettings;
