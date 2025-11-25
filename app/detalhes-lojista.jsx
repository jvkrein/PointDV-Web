// app/detalhes-lojista.jsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?w=500';
const API_URL = 'http://localhost:3000/api';

const EventCard = ({ event }) => (
  <Link 
    href={{
      pathname: "/detalhes-evento",
      params: { eventData: JSON.stringify(event) }
    }} 
    asChild
  >
    <TouchableOpacity style={styles.eventCard}>
      <Image 
        source={{ uri: event.imageUrl || PLACEHOLDER_IMAGE }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardTagContainer}>
        <Text style={styles.cardTag}>{event.categoria}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{event.titulo}</Text>
        <Text style={styles.cardLocation}>{event.endereco}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{event.descricao}</Text>
        <View style={styles.cardTimeContainer}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={14} color={COLORS.gray} />
          <Text style={styles.cardTime}>{event.dataInicio}</Text>
          <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.gray} style={{marginLeft: 10}} />
          <Text style={styles.cardTime}>{event.horaInicio}</Text>
        </View>
      </View>
    </TouchableOpacity>
  </Link>
);

const DetalhesLojistaScreen = () => {
  const { lojistaId } = useLocalSearchParams(); 

  const [lojista, setLojista] = useState(null); 
  const [eventos, setEventos] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lojistaId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Buscar dados do lojista
        // Precisamos criar essa rota no backend: GET /api/users/:id
        const userRes = await fetch(`${API_URL}/users/${lojistaId}`);
        if (!userRes.ok) throw new Error('Erro ao buscar lojista');
        const userData = await userRes.json();
        setLojista(userData);

        // 2. Buscar eventos do lojista
        // Precisamos criar essa rota/filtro no backend: GET /api/eventos?lojistaId=X
        // No momento, se não tiver filtro, buscamos todos e filtramos aqui (pior performance mas funciona)
        const eventosRes = await fetch(`${API_URL}/eventos`);
        const allEventos = await eventosRes.json();
        const lojistaEventos = allEventos
            .filter(e => e.lojista_id === parseInt(lojistaId)) // Verifica se lojista_id (banco) bate
            .map(item => ({ // Formata snake_case para camelCase
                id: item.id,
                titulo: item.titulo,
                descricao: item.descricao,
                categoria: item.categoria,
                endereco: item.endereco,
                dataInicio: item.data_inicio,
                horaInicio: item.hora_inicio,
                imageUrl: item.image_url,
            }));
            
        setEventos(lojistaEventos);

      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [lojistaId]);


  if (loading || !lojista) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{lojista.nomeNegocio || lojista.nome}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.lojistaCard}>
          <View style={styles.establishmentImagePlaceholder}>
            <MaterialCommunityIcons name="storefront" size={40} color={COLORS.primary} />
          </View>
          <View style={styles.lojistaInfo}>
            <Text style={styles.lojistaName}>{lojista.nomeNegocio}</Text>
            <View style={styles.lojistaDetailItem}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.gray} />
              <Text style={styles.lojistaDetailText}>{lojista.endereco}</Text>
            </View>
            <View style={styles.lojistaDetailItem}>
              <MaterialCommunityIcons name="phone-outline" size={16} color={COLORS.gray} />
              <Text style={styles.lojistaDetailText}>{lojista.telefone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Eventos e Promoções</Text>
          <Text style={styles.sectionCount}>{eventos.length}</Text>
        </View>
        
        {eventos.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum evento postado por este estabelecimento.</Text>
        ) : (
          eventos.map(event => (
            <EventCard key={event.id} event={event} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSpacer: { width: 24 }, 
  container: { padding: 15 },
  lojistaCard: { backgroundColor: COLORS.white, borderRadius: 8, padding: 15, flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, marginBottom: 20 },
  establishmentImagePlaceholder: { width: 80, height: 80, borderRadius: 8, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  lojistaInfo: { flex: 1, marginLeft: 15 },
  lojistaName: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark, marginBottom: 10 },
  lojistaDetailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  lojistaDetailText: { color: COLORS.gray, fontSize: 14, marginLeft: 10, flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionCount: { fontSize: 14, color: COLORS.gray, fontWeight: 'bold' },
  emptyText: { color: COLORS.gray, textAlign: 'center', marginTop: 20 },
  eventCard: { backgroundColor: COLORS.white, borderRadius: 8, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 1, borderColor: '#eee' },
  cardImage: { height: 140, width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  cardTagContainer: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  cardTag: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  cardContent: { padding: 12 }, 
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 }, 
  cardLocation: { color: COLORS.gray, fontSize: 14, marginBottom: 8 }, 
  cardDescription: { color: COLORS.dark, fontSize: 14, marginBottom: 12, lineHeight: 20 },
  cardTimeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  cardTime: { marginLeft: 5, color: COLORS.gray, fontSize: 14 },
});

export default DetalhesLojistaScreen;