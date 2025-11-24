// src/screens/SignUp/index.jsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  lightGray: '#F0F2F5',
  gray: '#A0A0A0',
  dark: '#333333',
  link: '#2968B4',
  border: '#E0E0E0',
};

// ({ navigation }) é a propriedade que recebemos para poder navegar
const SignUpScreen = ({ navigation }) => {
  // Estado para controlar qual tipo de usuário está selecionado
  const [userType, setUserType] = useState('consumidor'); // 'consumidor' ou 'lojista'

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Cabeçalho com botão de voltar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Criar Conta</Text>
            <Text style={styles.headerSubtitle}>Junte-se ao PointDV</Text>
          </View>
        </View>

        {/* Seletor de Tipo de Conta */}
        <Text style={styles.sectionTitle}>Escolha o tipo de conta</Text>
        <Text style={styles.sectionSubtitle}>Selecione como você vai usar o PointDV</Text>
        
        <TouchableOpacity
          style={[styles.typeSelector, userType === 'consumidor' && styles.typeSelectorActive]}
          onPress={() => setUserType('consumidor')}
        >
          <MaterialCommunityIcons name="account-circle" size={32} color={userType === 'consumidor' ? COLORS.primary : COLORS.gray} />
          <View style={styles.typeTextContainer}>
            <Text style={[styles.typeTitle, userType === 'consumidor' && styles.typeTitleActive]}>Consumidor</Text>
            <Text style={styles.typeSubtitle}>Descubra eventos, promoções e novidades na sua cidade</Text>
          </View>
          {userType === 'consumidor' && <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.primary} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeSelector, userType === 'lojista' && styles.typeSelectorActive]}
          onPress={() => setUserType('lojista')}
        >
          <MaterialCommunityIcons name="storefront" size={32} color={userType === 'lojista' ? COLORS.primary : COLORS.gray} />
          <View style={styles.typeTextContainer}>
            <Text style={[styles.typeTitle, userType === 'lojista' && styles.typeTitleActive]}>Lojista</Text>
            <Text style={styles.typeSubtitle}>Divulgue seus eventos e promoções para mais clientes</Text>
          </View>
          {userType === 'lojista' && <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.primary} />}
        </TouchableOpacity>

        {/* Formulário de Informações Pessoais */}
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput placeholder="Seu nome completo" style={styles.input} placeholderTextColor={COLORS.gray} />
        </View>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput placeholder="seu@email.com" style={styles.input} keyboardType="email-address" placeholderTextColor={COLORS.gray} />
        </View>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput placeholder="Mínimo 6 caracteres" style={styles.input} secureTextEntry placeholderTextColor={COLORS.gray} />
        </View>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput placeholder="Digite novamente" style={styles.input} secureTextEntry placeholderTextColor={COLORS.gray} />
        </View>

        {/* RENDERIZAÇÃO CONDICIONAL: Mostra campos de lojista apenas se o tipo for 'lojista' */}
        {userType === 'lojista' && (
          <>
            <Text style={styles.sectionTitle}>Informações do Estabelecimento</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="storefront-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput placeholder="Nome do seu negócio" style={styles.input} placeholderTextColor={COLORS.gray} />
            </View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput placeholder="(11) 99999-9999" style={styles.input} keyboardType="phone-pad" placeholderTextColor={COLORS.gray} />
            </View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput placeholder="Endereço completo do estabelecimento" style={styles.input} placeholderTextColor={COLORS.gray} />
            </View>
          </>
        )}

        {/* Botão de Criar Conta */}
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Criar Minha Conta</Text>
        </TouchableOpacity>

        {/* Rodapé */}
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.footerText}>
            Não tem uma conta?{' '}
            <Text style={styles.linkText}>Cadastre-se grátis</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.footerLoginText}>
            Já tem uma conta? <Text style={styles.linkText}>Fazer login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.dark, marginLeft: 20 },
  headerSubtitle: { fontSize: 14, color: COLORS.gray, marginLeft: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginTop: 25, marginBottom: 5 },
  sectionSubtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 15 },
  typeSelector: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, marginBottom: 10 },
  typeSelectorActive: { borderColor: COLORS.primary, backgroundColor: '#F0F8FF' },
  typeTextContainer: { flex: 1, marginLeft: 15 },
  typeTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  typeTitleActive: { color: COLORS.primary },
  typeSubtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, width: '100%' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: COLORS.dark },
  actionButton: { backgroundColor: COLORS.primary, width: '100%', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  actionButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  footerText: { marginTop: 20, fontSize: 12, color: COLORS.gray, textAlign: 'center' },
  linkText: { color: COLORS.link, fontWeight: 'bold' },
  footerLoginText: { marginTop: 20, fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 20},
});

export default SignUpScreen;