import MapView, { Marker } from 'react-native-maps';
import { View, Text, StyleSheet, TouchableHighlight, TextInput, Modal, Button, Image } from 'react-native';
import { useState } from 'react';
import { EMS } from './EMS_Stations.js';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// Main App component
export default function App() {
  const [markers, setMarkers] = useState([]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [incident, setIncident] = useState('');
  const [description, setDescription] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // State to handle the current selected marker
  const [currentMarker, setCurrentMarker] = useState(null); 

  // Function to add EMS stations as markers on the map
  const addEMSStations = () => {
    const emsMarkers = EMS.features.map(feature => ({
      latlng: {
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
      },
      title: feature.properties.STATION_NAME,
      description: feature.properties.ADDRESS,
      pinColor: 'blue',
    }));
    setMarkers([...markers, ...emsMarkers]);
  };

  // Function to add the user's geolocation as a marker on the map
  const addCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }
      let location = await Location.getCurrentPositionAsync({});
      setMarkers(prevMarkers => [
        ...prevMarkers,
        {
          latlng: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          title: 'Current Location',
          description: 'Your Current Location',
          pinColor: 'green',
        },
      ]);
    } catch (error) {
      setModalMessage('Geolocation Error: Geolocation failed. No pin will be inserted.');
      setModalVisible(true);
    }
  };

  // Function to pick an image using expo-image-picker
  const pickImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled && result.assets && result.assets.length > 0) {
      // Access the URI from the assets array
      // Update the pickImage function to correctly access the image URI from assets array!!!!!!*****
      // Image URI is nested inside the assets array in the result object!!!!!!*****
      const imageUri = result.assets[0].uri; 
      setSelectedImage(imageUri);
    }
  };

  // Function to report an incident by adding a marker on the map with user details
  // Validate inputs for Not a Number, ranges, null
  const reportIncident = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (
      isNaN(lat) || isNaN(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180 ||
      incident === '' || description === '' || lat === '' || lng === ''
    ) {
      setModalMessage('Invalid Input: Invalid latitude or longitude, blank incident title or description. No pin will be inserted.');
      setModalVisible(true);
      return;
    }

    const incidentMarker = {
      latlng: {
        latitude: lat,
        longitude: lng,
      },
      title: incident,
      description: description,
      image: selectedImage,
      pinColor: 'red',
    };

    setMarkers([...markers, incidentMarker]);
    // Reset the selected image after reporting the incident
    setSelectedImage(null);
  };

  // Function to clear all markers from the map
  const clearMarkers = () => {
    setMarkers([]);
  };

  // Function to handle marker press to show the image and details
  const handleMarkerPress = (marker) => {
    setCurrentMarker(marker);
    setModalVisible(true);
  };

  // Render
  // Accessibility - label for screen readers(talkback), Hint for description of inputs
    return (
    <View style={styles.container}>
      <MapView
        // Center map on Hamilton
        style={styles.map}
        initialRegion={{
          latitude: 43.2557,
          longitude: -79.8711,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={marker.latlng}
            title={marker.title}
            description={marker.description}
            pinColor={marker.pinColor}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
      </MapView>
      <View style={styles.controlsContainer}>
        <View style={styles.buttonRow}>
          <TouchableHighlight onPress={addEMSStations} underlayColor="white" accessibilityLabel="Add EMS Stations">
            <View style={[styles.button, { backgroundColor: '#ff726f' }]}>
              <Text style={styles.buttonText}>EMS Stations</Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight onPress={addCurrentLocation} underlayColor="white">
            <View style={[styles.button, { backgroundColor: '#ff726f' }]}>
              <Text style={styles.buttonText}>Geolocation</Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight onPress={clearMarkers} underlayColor="white">
            <View style={[styles.button, { backgroundColor: '#ff726f' }]}>
              <Text style={styles.buttonText}>Clear</Text>
            </View>
          </TouchableHighlight>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            accessibilityHint="Enter the latitude for the incident location"
            style={styles.input}
            placeholder="Latitude"
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numeric"
          />
          <TextInput
            accessibilityHint="Enter the longitude for the incident location"
            style={styles.input}
            placeholder="Longitude"
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numeric"
          />
          <TextInput
            accessibilityHint="Enter the title of the incident"
            style={styles.input}
            placeholder="Incident"
            value={incident}
            onChangeText={setIncident}
          />
          <TextInput
            accessibilityHint="Enter the description of the incident"
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
        </View>
        <TouchableHighlight onPress={pickImage} underlayColor="white" 
          accessibilityLabel="Take a photo for the incident">
          <View style={[styles.button, { backgroundColor: '#ff726f' }]}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight onPress={reportIncident} underlayColor="white"
          accessibilityLabel="Report an incident by entering details and pressing this button">
          <View style={[styles.button, { backgroundColor: '#ff726f' }]}>
            <Text style={styles.buttonText}>Report Incident</Text>
          </View>
        </TouchableHighlight>
      </View>
      
      {/* Modal for displaying image and details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {currentMarker && (
              <>
                <Text style={styles.modalText}>{currentMarker.title}</Text>
                <Text style={styles.modalText}>{currentMarker.description}</Text>
                {currentMarker.image && (
                  <Image source={{ uri: currentMarker.image }} style={{ width: 200, height: 200 }} />
                )}
              </>
            )}
            <Button
              onPress={() => setModalVisible(!modalVisible)}
              title="Close"
            />
          </View>
        </View>
      </Modal>

      {/* Modal for error messages */}
      <Modal
        // prop to slide into view
        animationType="slide"
        transparent={true}
        visible={!!modalMessage}
        // Close modal, clear modalMessage
        onRequestClose={() => {
          setModalMessage('');
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            // Close modal, clear modalMessage
            <Button
              onPress={() => setModalMessage('')}
              title="OK"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  // Set the map height to 70% of the screen and have full width of the screen
  map: {
    width: '100%',
    height: '70%', 
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  button: {
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  // Input boxes need to be opaque
  // Reduce width of Input boxes to fit on phone screen
  // Reduce text font to fit the input boxes
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 5,
    padding: 5,
    width: 90,
    fontSize: 12,
    backgroundColor: 'white', 
  },
  // Set the buttons and input container height to 30% of the screen
  controlsContainer: {
    width: '100%',
    height: '30%', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  // Modal display
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});

 