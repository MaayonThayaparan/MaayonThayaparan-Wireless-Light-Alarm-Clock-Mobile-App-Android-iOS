import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Button } from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library'; // Import MediaLibrary
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // For checkmark icon
import { soundFiles } from '../resources/soundFiles'; 

//Navigation for Sound Settings per alarm. 

const SoundManager = ({ route }) => {
  const { updateSound, currentSound } = route.params; // Receiving currentSound
  const navigation = useNavigation();
  const sounds = Object.keys(soundFiles);
  const [localSound, setLocalSound] = useState(currentSound.startsWith('file://') ? currentSound : null);
  const [selectedSound, setSelectedSound] = useState(currentSound); // Set initial state to current sound
  const [soundObject, setSoundObject] = useState(null);


  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Sound",
    });
  }, [navigation]);

  useEffect(() => {
    // Request permissions to access the media library
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need media library permissions to make this work!');
      }
    })();

    return () => {
      if (soundObject) {
        soundObject.stopAsync();
        soundObject.unloadAsync();
      }
    };
  }, [soundObject]);

  // Display preloaded sounds in user friendly format. 
  const formatSoundName = (name) => {
    return name.replace('.mp3', '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Open file explorer for local sounds
  const handleSelectLocalSound = async () => {

    if (soundObject) {
      try {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
      } catch (error) {
      }
    }
  
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
    });
  
    if (result.assets && result.assets.length > 0) {
      const { uri } = result.assets[0];
      setLocalSound(uri);
      updateSound(uri);
      setSelectedSound(uri);
  
      const newSoundObject = new Audio.Sound();
      setSoundObject(newSoundObject);
  
      try {
        await newSoundObject.loadAsync({ uri });
        console.log('Sound loaded successfully'); // Log success
        await newSoundObject.playAsync();
        console.log('Sound playing'); // Log success
      } catch (error) {
        console.error('Error loading/playing local sound:', error);
      }
    } else {
      console.log('Document Picker cancelled or failed'); // Log if Document Picker is cancelled or fails
    }
  };

  // play song when selecting it
  const handleSelectSound = async (sound) => {
    if (sound === 'None') {
      updateSound('None');
      setSelectedSound('None');
      if (soundObject) {
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
        } catch (error) {
          console.error('Error stopping/unloading sound:', error);
        }
        setSoundObject(null);
      }
      return;
    }

    if (soundObject) {
      try {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
      } catch (error) {
        console.error('Error stopping/unloading sound:', error);
      }
    }

    updateSound(sound);
    setSelectedSound(sound);

    const newSoundObject = new Audio.Sound();
    setSoundObject(newSoundObject);

    try {
      const soundPath = soundFiles[sound];
      if (!soundPath) {
        throw new Error(`Sound file not found: ${sound}`);
      }
      await newSoundObject.loadAsync(soundPath); // Using the internal asset reference
      console.log('Sound loaded successfully'); // Log success
      await newSoundObject.playAsync();
      console.log('Sound playing'); // Log success
    } catch (error) {
      console.error('Error loading/playing sound:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => handleSelectSound('None')} style={styles.soundItem}>
        <View style={styles.checkmarkContainer}>
          {selectedSound === 'None' && <Ionicons name="checkmark" size={18} color="green" />}
        </View>
        <Text style={styles.soundText}>
          None
        </Text>
      </TouchableOpacity>
      {sounds.map((sound, index) => (
        <TouchableOpacity key={index} onPress={() => handleSelectSound(sound)} style={styles.soundItem}>
          <View style={styles.checkmarkContainer}>
            {selectedSound === sound && <Ionicons name="checkmark" size={18} color="green" />}
          </View>
          <Text style={styles.soundText}>
            {formatSoundName(sound)}
          </Text>
        </TouchableOpacity>
      ))}
      <View style={styles.customSoundItem}>
        <View style={styles.checkmarkContainer}>
          {selectedSound && selectedSound === localSound && <Ionicons name="checkmark" size={18} color="green" />}
        </View>
        <Text style={styles.soundText}>
          Custom {localSound && localSound.split('/').pop().slice(0, 20) + (localSound.split('/').pop().length > 20 ? '...' : '')}
        </Text>
        <Button title="Browse" onPress={handleSelectLocalSound} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  soundItem: {
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 40, // Add padding to the left for the checkmark
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center', // Align checkmark and text vertically
  },
  customSoundItem: {
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 40, // Add padding to the left for the checkmark
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center', // Align checkmark and text vertically
    justifyContent: 'space-between', // Ensure button is right-aligned
  },
  soundText: {
    fontSize: 18,
    flex: 1, // Ensure text takes up remaining space
  },
  checkmarkContainer: {
    position: 'absolute',
    left: 8, // Position checkmark in the middle of the left padding
    justifyContent: 'center', // Center the checkmark vertically
    height: '100%', // Ensure it takes the full height of the parent
  },
});

export default SoundManager;
