// app/mapa-selecao.jsx

/**
 * Tela Modal para seleção de localização no mapa.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef, useContext } from 'react'; 
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from 'react-native-maps'; 
import * as Location from 'expo-location'; 
import { EventsContext } from '../contexts/EventsContext'; // Importar Contexto

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const MapaSelecaoScreen = () => {
  // Usamos o contexto para "devolver" o endereço
  const { setSelectedMapAddress } = useContext(EventsContext);
  
  const mapRef = useRef(null); 

  const [initialRegion, setInitialRegion] = useState({
    latitude: -25.7483,
    longitude: -53.0561,
    latitudeDelta: 0.02,
    longitudeDelta: 0.01,
  });
  
  const [displayAddress, setDisplayAddress] = useState('Movendo o mapa...');
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
        setInitialRegion(newRegion); 
        fetchAddressFromCoords(newRegion.latitude, newRegion.longitude);
      } catch (error) {
        console.warn("Erro ao buscar localização:", error);
        fetchAddressFromCoords(initialRegion.latitude, initialRegion.longitude);
      }
      setLoading(false);
    })();
  }, []); 

  const fetchAddressFromCoords = async (latitude, longitude) => {
    try {
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

  const onRegionChangeComplete = (region) => {
    setDisplayAddress('Carregando endereço...');
    fetchAddressFromCoords(region.latitude, region.longitude); 
  };
  
  // Função CORRIGIDA:
  const handleConfirmAddress = () => {
    // 1. Salva o endereço no estado global (contexto)
    setSelectedMapAddress(displayAddress);
    
    // 2. Volta para a tela anterior (que não foi desmontada)
    //    Assim, os dados que você já digitou CONTINUAM LÁ.
    router.back();
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
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            onRegionChangeComplete={onRegionChangeComplete} 
            provider="google" 
          />
          <View style={styles.pinContainer}>
            <MaterialCommunityIcons name="map-marker" size={40} color={COLORS.red} style={styles.pin} />
          </View>
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
  header: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.gray },
  map: { flex: 1 },
  pinContainer: {
    position: 'absolute', left: '50%', top: '50%', marginLeft: -20, marginTop: -40, 
  },
  pin: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 },
  footer: {
    backgroundColor: COLORS.white, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 30, 
  },
  addressLabel: { color: COLORS.gray, fontSize: 14 },
  addressText: { color: COLORS.dark, fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
  primaryButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});

export default MapaSelecaoScreen;