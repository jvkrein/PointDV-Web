// app/sobre.jsx

/**
 * Tela "Sobre o PointDV".
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Paleta de cores padrão da aplicação. */
const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
};

const SobreScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Cabeçalho com botão de voltar e título da página */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sobre o PointDV</Text>
      </View>

      {/* Conteúdo principal da tela */}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="map-marker-radius" size={60} color={COLORS.primary} />
          <Text style={styles.logoTitle}>PointDV</Text>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>O Projeto</Text>
          
          {/* ******************************************
            * A CORREÇÃO ESTÁ AQUI *
            ******************************************
          */}
          <Text style={styles.descriptionText}>
            O “PointDV” é um aplicativo agregador de eventos e promoções do comércio local em Dois Vizinhos - PR, desenvolvido para a disciplina de Programação para Dispositivos Móveis.
          </Text>
          
          <Text style={styles.descriptionText}>
            A plataforma conecta consumidores a comerciantes locais, permitindo que os negócios divulguem suas atividades de forma simples e que os usuários descubram tudo que está acontecendo ao seu redor em um único lugar.
          </Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Equipe</Text>
          <View style={styles.memberItem}>
            <Text style={styles.memberName}>João Victor dos Santos Krein</Text>
            <Text style={styles.memberHandle}>@jvkrein</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.memberItem}>
            <Text style={styles.memberName}>Felippe Matheos Alves Zwirtes</Text>
            <Text style={styles.memberHandle}>@Felippe-zw</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

/** Folha de estilos da tela Sobre. */
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
  logoContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 15,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 10,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 5,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 15,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.dark,
    lineHeight: 22,
    marginBottom: 10,
  },
  memberItem: {
    paddingVertical: 10,
  },
  memberName: {
    fontSize: 16,
    color: COLORS.dark,
  },
  memberHandle: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
});

export default SobreScreen;