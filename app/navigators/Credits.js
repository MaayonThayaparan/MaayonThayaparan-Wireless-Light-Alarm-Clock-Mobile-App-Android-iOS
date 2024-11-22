import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

// Navigation to show credits to Govee for API

const Credits = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        This app uses the Govee API. Special thanks to Govee for providing the API and documentation.
      </Text>
      <TouchableOpacity onPress={() => Linking.openURL('https://developer.govee.com/docs/support-product-model')}>
        <Text style={styles.link}>Govee Developer API Documentation</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  link: {
    fontSize: 16,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default Credits;
