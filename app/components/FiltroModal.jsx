// app/components/FiltroModal.jsx

import React, { useState } from 'react';
import { 
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORIAS_EVENTOS } from '../../constants/categories';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
};

const CategoryButton = ({ item, isSelected, onPress }) => (
  <TouchableOpacity 
    style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
    onPress={() => onPress(item.nome)} 
  >
    <MaterialCommunityIcons name={item.icon} size={20} color={isSelected ? COLORS.primary : COLORS.gray} />
    <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonTextSelected]}>{item.nome}</Text>
  </TouchableOpacity>
);

const FiltroModal = ({ modalVisible, setModalVisible, filtrosAtivos, setFiltrosAtivos, setSearchTerm }) => {

  const handleSelectCategory = (categoriaNome) => {
    setFiltrosAtivos(prev => ({
      ...prev,
      categoria: prev.categoria === categoriaNome ? null : categoriaNome
    }));
  };
  
  const handleToggleFutureEvents = (newValue) => {
    setFiltrosAtivos(prev => ({
      ...prev,
      apenasFuturos: newValue
    }));
  };

  const handleClearFilters = () => {
    setFiltrosAtivos({}); 
    if (setSearchTerm) setSearchTerm(''); 
  };

  return (
    <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filtros</Text>
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={styles.clearButton}>Limpar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.sectionTitle}>Categorias</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIAS_EVENTOS.map(item => (
              <CategoryButton key={item.id} item={item} isSelected={filtrosAtivos.categoria === item.nome} onPress={handleSelectCategory} />
            ))}
          </View>
          
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.switchItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Apenas Eventos Futuros</Text>
              <Text style={styles.switchSubtitle}>Esconder eventos que já terminaram.</Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.gray, true: COLORS.primary }}
              thumbColor={COLORS.white}
              onValueChange={handleToggleFutureEvents}
              value={!!filtrosAtivos.apenasFuturos}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.primaryButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  header: { padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  clearButton: { color: COLORS.primary, fontWeight: 'bold' },
  container: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 15 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: COLORS.lightGray },
  categoryButtonSelected: { backgroundColor: '#E0EFFF', borderColor: COLORS.primary },
  categoryButtonText: { color: COLORS.gray, fontWeight: '600', marginLeft: 5 },
  categoryButtonTextSelected: { color: COLORS.primary },
  switchItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 15 },
  switchTitle: { fontWeight: 'bold', fontSize: 15 },
  switchSubtitle: { color: COLORS.gray, fontSize: 12 },
  footer: { padding: 15, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#eee' },
  primaryButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});

export default FiltroModal;