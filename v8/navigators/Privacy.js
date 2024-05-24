import React from 'react';
import { ScrollView, View, Text, StyleSheet, } from 'react-native';

// Navigation on Privacy details. 

const Privacy = ({ navigation }) => {
    
  return (
    <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.boldText}>Data Usage:</Text>
    <Text style={styles.paragraph}>
      All user app data (alarms, devices, API Key, etc.) is stored locally to your mobile device only. Credentials (API keys, request URLs) are encrypted. No data is distributed or stored by the developer platform. 
    </Text>
  </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
      },
      boldText: {
        fontWeight: 'bold',
        fontSize: 18,
        marginVertical: 10,
      },
      paragraph: {
        fontSize: 16,
        marginBottom: 10,
      },
  });

export default Privacy;
