// app/mapa-selecao.jsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsContext } from '../contexts/EventsContext';

// --- IMPORTAÇÕES WEB ---
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// --- IMPORTAÇÃO SEGURA DO MAPVIEW (Apenas Mobile) ---
let MapView;
if (Platform.OS !== 'web') {
  MapView = require('react-native-maps').default;
}

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Estilo fixo para o mapa Web (Objeto JS puro, sem StyleSheet)
const containerStyle = {
  width: '100%',
  height: '100%'
};

const MapaSelecaoScreen = () => {
  const { setSelectedMapAddress } = useContext(EventsContext);
  const mapRef = useRef(null); 

  const [region, setRegion] = useState({
    latitude: -25.7483,
    longitude: -53.0561,
    latitudeDelta: 0.01,
    longitudeDelta: 0.005,
  });
  
  const [displayAddress, setDisplayAddress] = useState('Buscando localização...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Não podemos buscar sua localização sem permissão.');
        setLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.005,
        };
        setRegion(newRegion);
        fetchAddressFromCoords(newRegion.latitude, newRegion.longitude);
      } catch (error) {
        console.warn("Erro ao buscar localização:", error);
        setDisplayAddress('Localização indisponível. Use o campo de texto.');
      } finally {
        setLoading(false);
      }
    })();
  }, []); 

  const fetchAddressFromCoords = async (latitude, longitude) => {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        setDisplayAddress("Chave de API não configurada");
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results[0]) {
        setDisplayAddress(data.results[0].formatted_address);
      } else {
        setDisplayAddress('Endereço não encontrado');
      }
    } catch (error) {
      console.error("Erro no Geocoding:", error);
      setDisplayAddress('Erro ao buscar endereço');
    }
  };

  // --- MOBILE ---
  const onRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    setDisplayAddress('Carregando endereço...');
    fetchAddressFromCoords(newRegion.latitude, newRegion.longitude); 
  };
  
  // --- WEB ---
  const onMarkerDragEnd = useCallback((e) => {
    if (!e.latLng) return;
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setRegion(prev => ({ ...prev, latitude: newLat, longitude: newLng }));
    setDisplayAddress('Carregando endereço...');
    fetchAddressFromCoords(newLat, newLng);
  }, []);

  const onMapClick = useCallback((e) => {
    if (!e.latLng) return;
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setRegion(prev => ({ ...prev, latitude: newLat, longitude: newLng }));
    setDisplayAddress('Carregando endereço...');
    fetchAddressFromCoords(newLat, newLng);
  }, []);
  
  const handleConfirmAddress = () => {
    setSelectedMapAddress(displayAddress);
    router.back();
  };

  const renderWebMap = () => {
    return (
      <View style={styles.webMapContainer}>
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: region.latitude, lng: region.longitude }}
            zoom={15}
            onClick={onMapClick}
            options={{ streetViewControl: false, mapTypeControl: false }}
          >
            <Marker
              position={{ lat: region.latitude, lng: region.longitude }}
              draggable={true}
              onDragEnd={onMarkerDragEnd}
            />
          </GoogleMap>
        </LoadScript>
        
        {/* Overlay centralizado com Flexbox para evitar erro de transform */}
        <View style={styles.webOverlayContainer} pointerEvents="none">
          <View style={styles.webOverlayContent}>
             <Text style={styles.webWarning}>Clique no mapa ou arraste o marcador</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selecione o Local</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Buscando sua localização...</Text>
        </View>
      ) : (
        <>
          {Platform.OS === 'web' ? (
            renderWebMap()
          ) : (
            <View style={{flex: 1}}>
              {MapView && (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={region}
                  onRegionChangeComplete={onRegionChangeComplete} 
                  provider="google" 
                />
              )}
              {/* Pointer events via prop, não style */}
              <View style={styles.pinContainer} pointerEvents="none">
                <MaterialCommunityIcons name="map-marker" size={40} color={COLORS.red} style={styles.pin} />
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.addressLabel}>Endereço selecionado:</Text>
            <Text style={styles.addressText}>{displayAddress}</Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleConfirmAddress}
            >
              <Text style={styles.primaryButtonText}>Confirmar Endereço</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  header: { padding: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#eee', zIndex: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.gray },
  
  // Mobile
  map: { flex: 1 },
  pinContainer: { position: 'absolute', left: '50%', top: '50%', marginLeft: -20, marginTop: -40 },
  pin: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 },
  
  // Web
  webMapContainer: { flex: 1, position: 'relative' },
  // Novo estilo de overlay seguro
  webOverlayContainer: { position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center', zIndex: 5 },
  webOverlayContent: { backgroundColor: 'rgba(255,255,255,0.9)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  webWarning: { color: COLORS.dark, fontSize: 12, fontWeight: '600' },

  footer: { backgroundColor: COLORS.white, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 30 },
  addressLabel: { color: COLORS.gray, fontSize: 14 },
  addressText: { color: COLORS.dark, fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
  primaryButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});

export default MapaSelecaoScreen;