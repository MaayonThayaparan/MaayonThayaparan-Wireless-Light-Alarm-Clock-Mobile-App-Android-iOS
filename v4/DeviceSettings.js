import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Switch } from "react-native";
import Slider from '@react-native-community/slider'; // Import from the correct package
import ColorPicker from 'react-native-wheel-color-picker'; // Ensure you have this package installed
import AsyncStorage from '@react-native-async-storage/async-storage';

const DeviceSettings = ({ route, navigation }) => {
  const { alarmId, device, saveDeviceSettings } = route.params;

  // Default values
  const defaultOnOff = true; // Default to 'on'
  const defaultBrightness = 50;
  const defaultHexColor = "#ffffff";
  const defaultColor = 16777215; 

  // Use state with default values
  const [onOff, setOnOff] = useState(device.onOff !== undefined ? device.onOff : defaultOnOff);
  const [brightness, setBrightness] = useState(device.brightness !== undefined ? device.brightness : defaultBrightness);
  const [hexColor, setHexColor] = useState(device.hexColor !== undefined ? device.hexColor : defaultHexColor);
  const [color, setColor] = useState(device.color !== undefined ? device.color : defaultColor);

  useEffect(() => {
    const loadDeviceSettings = async () => {
      const storageKey = `${alarmId}-${device.device}`;
      const storedSettings = await AsyncStorage.getItem(storageKey);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setOnOff(settings.onOff !== undefined ? settings.onOff : defaultOnOff);
        setBrightness(settings.brightness !== undefined ? settings.brightness : defaultBrightness);
        setHexColor(settings.hexColor !== undefined ? settings.hexColor : defaultHexColor);
        setColor(settings.color !== undefined ? settings.color : defaultColor);
        
      }
    };
  
    loadDeviceSettings();
  }, [alarmId, device]); // Close the useEffect block properly

  const saveSettings = async () => {
    console.log("Saving settings:", { onOff, brightness, hexColor, color });
    const updatedDevice = {
      ...device,
      onOff,
      brightness,
      hexColor,
      color
    };
    const storageKey = `${alarmId}-${device.device}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedDevice));
    saveDeviceSettings(updatedDevice);
    navigation.goBack();
  };

  const handleColorChangeComplete = (color) => {
    console.log("Selected color:", color);
    const rgb = colorToRgb(color);
    const colorNumber = rgbToNumber(rgb);
    console.log("color:", colorNumber);
    console.log("Hex color:", hexColor);
    setHexColor(hexColor);
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
      <Text style={styles.title}>{`Settings for ${device.device}`}</Text>
      <View style={styles.settingContainer}>
        <Text>ON/OFF Light?:</Text>
        <Switch value={onOff} onValueChange={setOnOff} />
      </View>
      {onOff && (
        <>
          <View style={styles.settingContainer}>
            <Text>Brightness:</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={brightness}
              onValueChange={setBrightness}
            />
            <Text>{brightness}</Text>
          </View>
          <View style={styles.settingContainer}>
            <Text>Color:</Text>
            <ColorPicker
              color={hexColor}
              onColorChangeComplete={handleColorChangeComplete}
              style={styles.colorPicker}
            />
          </View>
        </>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Save Settings" onPress={saveSettings} />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  settingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  slider: {
    flex: 1,
  },
  colorPicker: {
    flex: 1,
    height: 200,
  },
  buttonContainer: {
    marginTop: 70,
  },
});

export default DeviceSettings;
