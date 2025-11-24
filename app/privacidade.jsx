// app/privacidade.jsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
};

const PrivacidadeScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidade</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.text}>
            A sua privacidade é importante para nós. É política do PointDV respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no aplicativo.
          </Text>

          <Text style={styles.sectionTitle}>Coleta de Informações</Text>
          <Text style={styles.text}>
            Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço (ex: criar conta, divulgar evento). Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.
          </Text>

          <Text style={styles.sectionTitle}>Uso de Dados</Text>
          <Text style={styles.text}>
            Usamos os dados coletados para gerenciar sua conta, permitir a criação de eventos e melhorar a experiência do usuário. Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
          </Text>
          
          <Text style={styles.footerText}>Última atualização: Novembro de 2025</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.lightGray },
  header: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  container: { padding: 15 },
  card: { backgroundColor: COLORS.white, borderRadius: 8, padding: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginTop: 20, marginBottom: 5 },
  text: { fontSize: 14, color: COLORS.dark, lineHeight: 22, textAlign: 'justify' },
  footerText: { marginTop: 30, color: COLORS.gray, fontSize: 12, textAlign: 'center' }
});

export default PrivacidadeScreen;