import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Linking, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { GlobalStateContext } from '../context/GlobalStateContext';
import { GOVEE_API_KEY, GOVEE_URL_GET, GOVEE_URL_POST } from '@env';

// Navigation for trouble shooting. Able to override the API Key and GET/POST URLs. 

const Troubleshoot = ({ navigation }) => {
  const { userInfo, setUserInfo, saveStoredData } = useContext(GlobalStateContext);
  const [apiKey, setApiKey] = useState(userInfo.apiKey);
  const [urlGet, setUrlGet] = useState(userInfo.urlGet);
  const [urlPost, setUrlPost] = useState(userInfo.urlPost);

  // If fields are empty, use the default values
  const handleSave = () => {
    const newUserInfo = {
      ...userInfo,
      apiKey: apiKey || GOVEE_API_KEY, 
      urlGet: urlGet || GOVEE_URL_GET,
      urlPost: urlPost || GOVEE_URL_POST,
    };
    setUserInfo(newUserInfo);
    saveStoredData(newUserInfo, null);
    navigation.goBack();  // Navigate back to Settings after saving
    
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={handleSave}
          title="Save"
          color="#000"
        />
      ),
    });
  }, [navigation, handleSave]);

  // Reset to default values
  const handleReset = () => {
    setApiKey(GOVEE_API_KEY);
    setUrlGet(GOVEE_URL_GET);
    setUrlPost(GOVEE_URL_POST);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.boldText}>Disclaimer:</Text>
        <Text style={styles.paragraph}>
          This app uses the Govee API which is still in beta and is subject to change. The development team will periodically update the application as API documentation is updated. Please view support product models at link:{' '}
          <Text style={styles.hyperlink} onPress={() => Linking.openURL('https://developer.govee.com/docs/support-product-model')}>Supported Models</Text>
        </Text>
        <Text style={styles.boldText}>Connection Issue:</Text>
        <Text style={styles.paragraph}>
          If no devices are being displayed, it may be an issue with the API key or the GET/POST request URL. You can override the default settings of this application by filling the below fields and clicking 'Save'. If you want to restore default settings, just clear these fields and hit 'Save' or click 'Reset Settings' at the bottom of screen. API keys and request URLs are encrypted and stored locally to mobile device.
        </Text>
        <Text style={styles.sectionHeader}>Update Application Settings</Text>
        <Text style={styles.label}>API Key:</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Enter your API Key"
        />
        <Text style={styles.helpText}>
          You can request a personal API Key from Govee itself by following this link:{' '}
          <Text style={styles.hyperlink} onPress={() => Linking.openURL('https://developer.govee.com/reference/apply-you-govee-api-key')}>Govee API Key</Text>
        </Text>
        <Text style={styles.label}>GET URL:</Text>
        <TextInput
          style={styles.input}
          value={urlGet}
          onChangeText={setUrlGet}
          placeholder="Enter GET URL"
        />
        <Text style={styles.helpText}>
          You can review if GET documentation has been updated by clicking this link:{' '}
          <Text style={styles.hyperlink} onPress={() => Linking.openURL('https://developer.govee.com/reference/get-you-devices')}>GET Documentation</Text>. Input both the Host and the route in one line (ex. https://openapi.api.govee.com/router/api/v1/user/devices).
        </Text>
        <Text style={styles.label}>POST URL:</Text>
        <TextInput
          style={styles.input}
          value={urlPost}
          onChangeText={setUrlPost}
          placeholder="Enter POST URL"
        />
        <Text style={styles.helpText}>
          You can review if POST documentation has been updated by clicking this link:{' '}
          <Text style={styles.hyperlink} onPress={() => Linking.openURL('https://developer.govee.com/reference/control-you-devices')}>POST Documentation</Text>. Input both the host and the route in the above input (ex. https://openapi.api.govee.com/router/api/v1/device/control).
        </Text>
        <Button title="Reset Settings" color="#FF0000" onPress={handleReset} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  hyperlink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default Troubleshoot;
