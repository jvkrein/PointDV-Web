// app/mapa-selecao.jsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// Importação segura do MapView (só carrega se não for web ou se o bundler suportar)
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsContext } from '../contexts/EventsContext';

// --- IMPORTAÇÕES ESPECÍFICAS PARA WEB ---
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Estilo do container do mapa WEB
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
        // Busca endereço inicial
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

  // --- MOBILE: Ao mover o mapa ---
  const onRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    setDisplayAddress('Carregando endereço...');
    fetchAddressFromCoords(newRegion.latitude, newRegion.longitude); 
  };
  
  // --- WEB: Ao arrastar o marcador ---
  const onMarkerDragEnd = useCallback((e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    
    setRegion(prev => ({ ...prev, latitude: newLat, longitude: newLng }));
    setDisplayAddress('Carregando endereço...');
    fetchAddressFromCoords(newLat, newLng);
  }, []);

  // --- WEB: Ao clicar no mapa ---
  const onMapClick = useCallback((e) => {
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

  // --- RENDERIZAÇÃO DO MAPA WEB (INTERATIVO) ---
  const renderWebMap = () => {
    return (
      <View style={styles.webMapContainer}>
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: region.latitude, lng: region.longitude }}
            zoom={15}
            onClick={onMapClick} // Permite clicar para mover
            options={{
               streetViewControl: false,
               mapTypeControl: false
            }}
          >
            {/* Marcador Draggable (Arrastável) */}
            <Marker
              position={{ lat: region.latitude, lng: region.longitude }}
              draggable={true}
              onDragEnd={onMarkerDragEnd}
            />
          </GoogleMap>
        </LoadScript>
        
        <View style={styles.webOverlay}>
          <Text style={styles.webWarning}>
            Clique no mapa ou arraste o marcador vermelho para selecionar.
          </Text>
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
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={region}
                onRegionChangeComplete={onRegionChangeComplete} 
                provider="google" 
              />
              <View style={styles.pinContainer}>
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
  pinContainer: { position: 'absolute', left: '50%', top: '50%', marginLeft: -20, marginTop: -40, pointerEvents: 'none' }, // pointerEvents none ajuda na UI
  pin: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 },
  
  // Web
  webMapContainer: { flex: 1, position: 'relative' },
  webOverlay: { position: 'absolute', top: 10, left: '50%', transform: [{translateX: '-50%'}], backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 20, zIndex: 5 },
  webWarning: { color: COLORS.dark, fontSize: 12, fontWeight: '600' },

  footer: { backgroundColor: COLORS.white, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 30 },
  addressLabel: { color: COLORS.gray, fontSize: 14 },
  addressText: { color: COLORS.dark, fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
  primaryButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});

export default MapaSelecaoScreen;