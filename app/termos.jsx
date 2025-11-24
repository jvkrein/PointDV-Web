// app/termos.jsx

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

const TermosUsoScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termos de Uso</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Aceitação dos Termos</Text>
          <Text style={styles.text}>
            Ao baixar, instalar ou usar o aplicativo PointDV, você concorda em cumprir estes Termos de Uso. Se você não concordar com algum destes termos, por favor, não use o aplicativo.
          </Text>

          <Text style={styles.sectionTitle}>2. Uso do Aplicativo</Text>
          <Text style={styles.text}>
            O PointDV é uma plataforma para conectar consumidores a eventos e comércios locais. Você concorda em usar o aplicativo apenas para fins legais e de acordo com todas as leis aplicáveis.
          </Text>

          <Text style={styles.sectionTitle}>3. Contas de Usuário</Text>
          <Text style={styles.text}>
            Para acessar certos recursos, você pode precisar criar uma conta. Você é responsável por manter a confidencialidade de sua senha e conta.
          </Text>

          <Text style={styles.sectionTitle}>4. Conteúdo do Usuário</Text>
          <Text style={styles.text}>
            Lojistas são responsáveis pelas informações, eventos e imagens que publicam. O PointDV não se responsabiliza pela precisão dessas informações.
          </Text>

          <Text style={styles.sectionTitle}>5. Alterações nos Termos</Text>
          <Text style={styles.text}>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor assim que publicadas no aplicativo.
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
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginTop: 15, marginBottom: 5 },
  text: { fontSize: 14, color: COLORS.dark, lineHeight: 22, textAlign: 'justify' },
  footerText: { marginTop: 30, color: COLORS.gray, fontSize: 12, textAlign: 'center' }
});

export default TermosUsoScreen;