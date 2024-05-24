import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Switch } from "react-native";
import Slider from '@react-native-community/slider'; // Import from the correct package
import ColorPicker from 'react-native-wheel-color-picker'; // Ensure you have this package installed
import AsyncStorage from '@react-native-async-storage/async-storage';

const DeviceSettings = ({ route, navigation }) => {
  const { device, saveDeviceSettings } = route.params;
  const [onOff, setOnOff] = useState(device.onOff);
  const [brightness, setBrightness] = useState(device.brightness);
  const [color, setColor] = useState(device.color);

  useEffect(() => {
    const loadDeviceSettings = async () => {
      const storedSettings = await AsyncStorage.getItem(device.device);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setOnOff(settings.onOff);
        setBrightness(settings.brightness);
        setColor(settings.color);
      }
    };

    loadDeviceSettings();
  }, [device]);

  const saveSettings = async () => {
    console.log("Saving settings:", { onOff, brightness, color });
    const updatedDevice = {
      ...device,
      onOff,
      brightness,
      color,
    };
    await AsyncStorage.setItem(device.device, JSON.stringify(updatedDevice));
    saveDeviceSettings(updatedDevice);
    navigation.goBack();
  };

  const handleColorChangeComplete = (color) => {
    console.log("Selected color:", color);
    const rgb = colorToRgb(color);
    const hexColor = rgbToHex(rgb);
    console.log("Converted color:", hexColor);
    setColor(hexColor);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{`Settings for ${device.device}`}</Text>
      <View style={styles.settingContainer}>
        <Text>ON/OFF Light?:</Text>
        <Switch value={onOff} onValueChange={setOnOff} />
      </View>
      <View> 
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
              color={color}
              onColorChangeComplete={handleColorChangeComplete}
              style={styles.colorPicker}
            />
          </View>
        </>
      )}
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Save Settings" onPress={saveSettings} />
      </View>
    </View>
  );
};

const colorToRgb = (color) => {
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    // hex is extended to six characters.
    hex = hex.split('').map((hex) => hex + hex).join('');
  }
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const rgbToHex = ({ r, g, b }) => `#${((r & 0xff) << 16 | (g & 0xff) << 8 | (b & 0xff)).toString(16).padStart(6, '0')}`;

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
    marginTop: 70, // Add some margin to the top
  },
});

export default DeviceSettings;
