import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, TouchableOpacity, View, Text, Button, StyleSheet, TextInput } from "react-native";
import Slider from '@react-native-community/slider';
import ColorPicker from 'react-native-wheel-color-picker';

// Navigation for individual device settings. Parameters for label, on/Off, brightness, and color. 
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
  const [label, setLabel] = useState(device.label || '');

  const saveSettings = useCallback(() => {
    const updatedDevice = {
      ...device,
      onOff,
      brightness,
      hexColor,
      color,
      label,
    };
    saveDeviceSettings(updatedDevice);
    navigation.goBack();
  }, [device, onOff, brightness, hexColor, color, label, saveDeviceSettings, navigation]);

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

  // Govee requires color in number format. 
  const handleColorChangeComplete = (color) => {
    const rgb = colorToRgb(color);
    const colorNumber = rgbToNumber(rgb);
    setHexColor(color);
    setColor(colorNumber);
  };

  // Also need to store hex color for formatting. 
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

  // Formula provided from Govee API tp convert to number
  const rgbToNumber = ({ r, g, b }) => {
    return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{device.sku}</Text>
        <Text style={styles.idTitle}>{`${device.device}`}</Text>
      </View>
      <View style={styles.settingContainer}>
        <Text style={styles.settingLabel}>Label</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
        />
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
                onValueChange={setBrightness}
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
      <View style={styles.bottomSpacer} />
    </ScrollView>
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
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  bottomSpacer: {
    height: 80, // Add space at the bottom to view more of the color selector
  },
});

export default DeviceSettings;
