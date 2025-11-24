// app/detalhes-evento.jsx

/**
 * Tela que exibe os detalhes completos de um evento.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useState, useEffect } from 'react';
import {
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Linking,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsContext } from '../contexts/EventsContext';
import { db } from '../firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore'; 

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
  green: '#28a745',
  yellow: '#f59e0b',
  blue: '#007bff',
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?w=500';

const DetalhesEventoScreen = () => {
    const params = useLocalSearchParams();
    const event = JSON.parse(params.eventData);

    const [modalVisible, setModalVisible] = useState(false);
    const { favoritedEvents, toggleFavorite, eventosConfirmados, toggleConfirmedEvent } = useContext(EventsContext);
    
    const [lojista, setLojista] = useState(null);
    const [loadingLojista, setLoadingLojista] = useState(true);

    const isFavorited = favoritedEvents.includes(event.id);
    const isConfirmed = eventosConfirmados.includes(event.id);

    // --- Lógica de "Encerrado" ---
    const checkIsEnded = () => {
      if (!event.dataFim || !event.horaFim) {
        if (event.data && event.horario) {
           try {
            const [day, month, year] = event.data.split('/');
            const [hours, minutes] = event.horario.split(':');
            const eventDate = new Date(year, month - 1, day, hours, minutes);
            return new Date() > eventDate;
           } catch (e) { return false; }
        }
        return false; 
      }
      try {
        const [day, month, year] = event.dataFim.split('/');
        const [hours, minutes] = event.horaFim.split(':');
        const eventEndDate = new Date(year, month - 1, day, hours, minutes);
        return new Date() > eventEndDate;
      } catch (e) { return false; }
    };
    const isEnded = checkIsEnded();

    // Buscar dados do Lojista
    useEffect(() => {
      const fetchLojista = async () => {
        if (!event.lojistaId) {
          setLoadingLojista(false);
          return;
        }
        try {
          const docRef = doc(db, 'usuarios', event.lojistaId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setLojista(docSnap.data()); 
          }
        } catch (error) {
          console.error(error);
        }
        setLoadingLojista(false);
      };
      fetchLojista();
    }, [event.lojistaId]); 

    
    const handleConfirmar = () => {
        setModalVisible(false);
        toggleConfirmedEvent(event.id);
    }
    
    // --- FUNÇÕES DE AÇÃO ---

    const handleOpenMaps = () => {
      const query = encodeURIComponent(event.endereco);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      Linking.openURL(url).catch(err => 
        Alert.alert("Erro", "Não foi possível abrir o mapa.")
      );
    };

    const handleWhatsApp = () => {
      if (!lojista?.telefone) {
        Alert.alert("Indisponível", "O estabelecimento não cadastrou um telefone.");
        return;
      }
      let phone = lojista.telefone.replace(/\D/g, '');
      if (phone.length <= 11) phone = `55${phone}`;
      
      const message = `Olá! Vi o evento "${event.titulo}" no PointDV e gostaria de mais informações.`;
      const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

      Linking.openURL(url).catch(() => {
        Alert.alert("Erro", "WhatsApp não instalado ou erro ao abrir.");
      });
    };

    const handleCall = () => {
      if (!lojista?.telefone) {
        Alert.alert("Indisponível", "O estabelecimento não cadastrou um telefone.");
        return;
      }
      const phone = lojista.telefone.replace(/\D/g, '');
      Linking.openURL(`tel:${phone}`);
    };

    const handleAddToCalendar = () => {
      try {
        const formatDateForGoogle = (dateStr, timeStr) => {
          if (!dateStr || !timeStr) return "";
          const [day, month, year] = dateStr.split('/');
          const [hour, min] = timeStr.split(':');
          return `${year}${month}${day}T${hour}${min}00`;
        };

        const start = formatDateForGoogle(event.dataInicio || event.data, event.horaInicio || event.horario);
        let end = formatDateForGoogle(event.dataFim, event.horaFim);
        if (!end) end = start; 

        const title = encodeURIComponent(event.titulo);
        const details = encodeURIComponent(event.descricao + "\n\nVer no PointDV");
        const location = encodeURIComponent(event.endereco);

        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
        
        Linking.openURL(url);
      } catch (e) {
        Alert.alert("Erro", "Não foi possível criar o evento na agenda.");
      }
    };

    const handleGoToLojista = () => {
      if (!event.lojistaId) return; 
      router.push({
        pathname: '/detalhes-lojista',
        params: { lojistaId: event.lojistaId }
      });
    };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView>
         <ImageBackground source={{ uri: event.imageUrl || PLACEHOLDER_IMAGE }} style={styles.headerImage}>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFavorite(event.id)} style={styles.iconButton}>
              <MaterialCommunityIcons name={isFavorited ? "heart" : "heart-outline"} size={24} color={isFavorited ? COLORS.red : COLORS.dark} />
            </TouchableOpacity>
          </View>

           {isEnded && (
             <View style={styles.endedBadgeOverlay}>
               <Text style={styles.endedBadgeText}>ENCERRADO</Text>
             </View>
           )}
        </ImageBackground>
        
        <View style={styles.contentContainer}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={styles.categoryTag}>{event.categoria}</Text>
            {isEnded && <Text style={styles.endedTextRed}>Evento Finalizado</Text>}
          </View>

          <Text style={styles.title}>{event.titulo}</Text>
          
          <TouchableOpacity 
            style={styles.restaurantLink} 
            onPress={handleGoToLojista}
            disabled={loadingLojista}
          >
            {loadingLojista ? (
              <Text style={styles.restaurantName}>Carregando...</Text>
            ) : (
              <Text style={styles.restaurantName}>{lojista?.nomeNegocio || 'Estabelecimento'}</Text>
            )}
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          
          <Text style={styles.description}>{event.descricao}</Text>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="calendar-clock" size={24} color={COLORS.primary} />
            <View>
              <Text style={styles.infoTitle}>Início</Text>
              <Text style={styles.infoText}>
                {event.dataInicio || event.data} às {event.horaInicio || event.horario}
              </Text>
            </View>
          </View>
          
          {(event.dataFim && event.horaFim) && (
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="flag-checkered" size={24} color={COLORS.red} />
              <View>
                <Text style={[styles.infoTitle, {color: COLORS.red}]}>Término</Text>
                <Text style={styles.infoText}>{event.dataFim} às {event.horaFim}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.infoBox} onPress={handleOpenMaps}>
            <MaterialCommunityIcons name="map-marker-outline" size={24} color={COLORS.primary} />
            <View style={{flex: 1}}>
              <Text style={styles.infoTitle}>Local</Text>
              <Text style={styles.infoText}>{event.endereco}</Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          
          <Text style={styles.sectionTitle}>Sobre o Estabelecimento</Text>
          
          {loadingLojista ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <TouchableOpacity 
              style={styles.establishmentCard} 
              onPress={handleGoToLojista}
            >
              <View style={styles.establishmentImagePlaceholder}>
                <MaterialCommunityIcons name="storefront" size={30} color={COLORS.primary} />
              </View>
              <View style={styles.establishmentInfo}>
                <Text style={styles.establishmentName}>{lojista?.nomeNegocio || 'Nome não encontrado'}</Text>
                <Text style={styles.establishmentDetail}>{lojista?.telefone || 'Telefone não informado'}</Text>
                <Text style={styles.establishmentDetail}>Horário não informado</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => toggleFavorite(event.id)} style={styles.favoriteButton}>
          <MaterialCommunityIcons name={isFavorited ? "heart" : "heart-outline"} size={28} color={isFavorited ? COLORS.red : COLORS.dark} />
        </TouchableOpacity>
        
        {isEnded ? (
          <View style={[styles.actionButton, { backgroundColor: COLORS.gray }]}>
             <Text style={styles.actionButtonText}>Evento Encerrado</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              isConfirmed && styles.actionButtonConfirmed
            ]} 
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>
              {isConfirmed ? "Participação Confirmada" : "Quero Participar"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal */}
      <Modal 
        visible={modalVisible} 
        transparent={true} 
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View style={styles.modalContainer}>
                  <TouchableWithoutFeedback>
                      <View style={styles.modalContent}>
                          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                              <MaterialCommunityIcons name="close" size={24} color={COLORS.gray} />
                          </TouchableOpacity>
                          <Text style={styles.modalTitle}>
                            {isConfirmed ? "Participação Confirmada" : "Quero Participar"}
                          </Text>
                          <Text style={styles.modalSubtitle}>
                            {isConfirmed 
                              ? "Este evento está na sua lista." 
                              : "Confirme sua participação e acesse opções úteis"}
                          </Text>
                          <View style={styles.eventInfoModal}>
                              <Text style={styles.eventTitleModal}>{event.titulo}</Text>
                              <Text style={styles.eventDetailsModal}>
                                Início: {event.dataInicio || event.data} às {event.horaInicio || event.horario}
                              </Text>
                              <Text style={styles.eventDetailsModal}>{event.endereco}</Text>
                          </View>
                          <TouchableOpacity 
                            style={[
                              styles.confirmButton, 
                              isConfirmed && styles.confirmButtonConfirmed
                            ]} 
                            onPress={handleConfirmar}
                          >
                            <MaterialCommunityIcons name={isConfirmed ? "calendar-remove" : "check"} size={20} color={COLORS.white} />
                            <Text style={styles.confirmButtonText}>
                              {isConfirmed ? "Remover Participação" : "Confirmar Participação"}
                            </Text>
                          </TouchableOpacity>

                          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
                          <View style={styles.actionGrid}>
                            <TouchableOpacity style={styles.actionCard} onPress={handleOpenMaps}>
                              <MaterialCommunityIcons name="google-maps" size={24} color={COLORS.dark} />
                              <Text style={styles.actionText}>Ver no Mapa</Text>
                            </TouchableOpacity>
                            
                            {/* AQUI: Botão Agenda Ligado */}
                            <TouchableOpacity style={styles.actionCard} onPress={handleAddToCalendar}>
                              <MaterialCommunityIcons name="calendar-plus" size={24} color={COLORS.dark} />
                              <Text style={styles.actionText}>Adic. Agenda</Text>
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.sectionTitle}>Contatar Estabelecimento</Text>
                          
                          {/* AQUI: Botão WhatsApp Ligado */}
                          <TouchableOpacity 
                            style={[styles.contactButton, {backgroundColor: COLORS.green}]}
                            onPress={handleWhatsApp}
                          >
                            <MaterialCommunityIcons name="whatsapp" size={20} color={COLORS.white} />
                            <Text style={styles.contactButtonText}>Conversar no WhatsApp</Text>
                          </TouchableOpacity>
                          
                          {/* AQUI: Botão Ligar Ligado */}
                          <TouchableOpacity 
                            style={[styles.contactButton, {backgroundColor: COLORS.blue, marginTop: 10}]}
                            onPress={handleCall}
                          >
                            <MaterialCommunityIcons name="phone" size={20} color={COLORS.white} />
                            <Text style={styles.contactButtonText}>Ligar</Text>
                          </TouchableOpacity>

                          <View style={styles.tipBox}><MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={'#f59e0b'} /><Text style={styles.tipText}>Dica: Entre em contato com o estabelecimento para confirmar disponibilidade e fazer reservas.</Text></View>
                      </View>
                  </TouchableWithoutFeedback>
              </View>
          </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  headerImage: { height: 250, justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 15, flexDirection: 'row' },
  headerIcons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  iconButton: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { backgroundColor: COLORS.white, marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  categoryTag: { backgroundColor: COLORS.primary, color: COLORS.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', overflow: 'hidden' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  restaurantLink: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  restaurantName: { color: COLORS.primary, fontSize: 16 },
  description: { color: COLORS.gray, marginVertical: 10, lineHeight: 20 },
  infoBox: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  infoTitle: { fontWeight: 'bold', marginLeft: 15 },
  infoText: { color: COLORS.gray, marginLeft: 15, flex: 1 }, 
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 25, marginBottom: 15 },
  establishmentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, padding: 10, borderRadius: 8 },
  establishmentImagePlaceholder: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#E0EFFF', justifyContent: 'center', alignItems: 'center' },
  establishmentInfo: { flex: 1, marginLeft: 10 },
  establishmentName: { fontWeight: 'bold' },
  establishmentDetail: { color: COLORS.gray, fontSize: 12, marginTop: 4 },
  footer: { padding: 15, borderTopWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white },
  favoriteButton: { borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8, padding: 12, marginRight: 10 },
  actionButton: { flex: 1, backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
  actionButtonConfirmed: { backgroundColor: COLORS.green },
  actionButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  closeButton: { alignSelf: 'flex-end', marginBottom: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  modalSubtitle: { color: COLORS.gray, textAlign: 'center', marginVertical: 10 },
  eventInfoModal: { padding: 15, backgroundColor: COLORS.lightGray, borderRadius: 8, marginVertical: 15 },
  eventTitleModal: { fontWeight: 'bold' },
  eventDetailsModal: { color: COLORS.gray, marginTop: 5, fontSize: 12 },
  confirmButton: { flexDirection: 'row', justifyContent: 'center', backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
  confirmButtonConfirmed: { backgroundColor: COLORS.red },
  confirmButtonText: { color: COLORS.white, fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  actionCard: { width: '48%', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 20, alignItems: 'center', marginBottom: 10 },
  actionText: { marginTop: 8, fontSize: 12 },
  contactButton: { flexDirection: 'row', padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  contactButtonText: { color: COLORS.white, fontWeight: 'bold', marginLeft: 10 },
  tipBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.yellow, padding: 15, borderRadius: 8, marginTop: 25 },
  tipText: { flex: 1, marginLeft: 10, color: '#b45309', fontSize: 12 },
  
  endedBadgeOverlay: {
    position: 'absolute', 
    bottom: 30, 
    right: 10, 
    backgroundColor: COLORS.red, 
    paddingVertical: 5, 
    paddingHorizontal: 10, 
    borderRadius: 5,
    zIndex: 10, 
    elevation: 5, 
  },
  endedBadgeText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },
  endedTextRed: { color: COLORS.red, fontWeight: 'bold', fontSize: 12 }
});

export default DetalhesEventoScreen;