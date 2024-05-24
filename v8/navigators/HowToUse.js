import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

// Navigation on how to use the application

const HowToUse = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.instructionsContainer}>
        <Text style={styles.instruction}><Text style={styles.number}>1.</Text> Download <Text style={styles.boldText}>Govee Home</Text> app.</Text>
        <Text style={styles.instruction}><Text style={styles.number}>2.</Text> Connect WiFi devices to <Text style={styles.boldText}>Govee Home</Text> app (only WiFi devices will work with the alarms).</Text>
        <Text style={styles.instruction}><Text style={styles.number}>3.</Text> Review device model on <Text style={styles.boldText}>Govee Home</Text> and ensure model is supported by Govee API at link:{' '}
        <Text style={styles.hyperlink} onPress={() => Linking.openURL('https://developer.govee.com/docs/support-product-model')}>Supported Models</Text></Text>
        <Text style={styles.instruction}><Text style={styles.number}>4.</Text> Add Alarm using the <Text style={styles.boldText}>+</Text> icon.</Text>
        <Text style={styles.instruction}><Text style={styles.number}>5.</Text> Click alarm to edit alarm settings.</Text>
        <Text style={styles.instruction}><Text style={styles.number}>6.</Text> To check if connection is working, click on <Text style={styles.boldText}>Devices</Text> and then <Text style={styles.boldText}>'Show Devices on Wifi'</Text>.</Text>
        <Text style={styles.instruction}><Text style={styles.number}>7.</Text> If you see the devices connected on <Text style={styles.boldText}>Govee Home</Text>, the app is working. Otherwise, see <Text style={styles.hyperlink} onPress={() => navigation.navigate('Troubleshoot')}>Troubleshoot</Text> section.</Text>
        <Text style={styles.instruction}><Text style={styles.number}>8.</Text> You can configure each selected device differently (on/off, color, brightness), sound (can also browse local storage), snooze (on/off, duration, on/Off devices).</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  instruction: {
    fontSize: 18,
    marginVertical: 10,
  },
  number: {
    fontWeight: 'bold',
    color: '#007AFF',
    fontSize: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
  hyperlink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default HowToUse;
