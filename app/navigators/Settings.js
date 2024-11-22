import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Navigation for settings tab.

const Settings = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('HowToUse')}
      >
        <Text style={styles.buttonText}>How to Use</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Troubleshoot')}
      >
        <Text style={styles.buttonText}>Troubleshoot</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Privacy')}
      >
        <Text style={styles.buttonText}>Privacy</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Credits')}
      >
        <Text style={styles.buttonText}>Credits</Text>
      </TouchableOpacity>
    </View>
  
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '80%',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Settings;
