// app/configuracoes.jsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsContext } from '../contexts/EventsContext';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
};

const API_URL = 'http://localhost:3000/api';

// ... (Componentes SettingSwitchItem e SettingNavigationItem iguais) ...
const SettingSwitchItem = ({ label, description, value, onValueChange, disabled = false }) => (
  <View style={styles.switchItem}>
    <View style={{ flex: 1 }}>
      <Text style={styles.listItemTitle}>{label}</Text>
      <Text style={styles.listItemSubtitle}>{description}</Text>
    </View>
    <Switch
      trackColor={{ false: '#767577', true: '#81b0ff' }}
      thumbColor={value ? COLORS.primary : '#f4f3f4'}
      onValueChange={onValueChange}
      value={value}
      disabled={disabled}
    />
  </View>
);

const SettingNavigationItem = ({ label, value, onPress, isLoading }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress} disabled={isLoading}> 
    <View style={{flex: 1, marginRight: 10}}>
      <Text style={styles.listItemTitle}>{label}</Text>
      {isLoading ? (
        <Text style={styles.listItemSubtitle}>Salvando...</Text>
      ) : (
        <Text style={styles.listItemSubtitle} numberOfLines={1}>{value}</Text>
      )}
    </View>
    {isLoading ? (
      <ActivityIndicator size="small" color={COLORS.primary} />
    ) : (
      <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
    )}
  </TouchableOpacity>
);

const ConfiguracoesScreen = () => {
  const { userData, selectedMapAddress, setSelectedMapAddress } = useContext(EventsContext);
  const isFocused = useIsFocused();

  const [novosEventos, setNovosEventos] = useState(true);
  const [promocoes, setPromocoes] = useState(true);
  const [atualizacoes, setAtualizacoes] = useState(false);
  const [modoEscuro, setModoEscuro] = useState(false);
  const [updatingAddress, setUpdatingAddress] = useState(false);

  useEffect(() => {
    const saveAddress = async () => {
      if (isFocused && selectedMapAddress) {
        setUpdatingAddress(true);
        try {
          const token = await AsyncStorage.getItem('userToken');
          await fetch(`${API_URL}/users/me`, {
             method: 'PUT',
             headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`
             },
             body: JSON.stringify({ endereco: selectedMapAddress })
          });
          setSelectedMapAddress(null);
        } catch (error) {
          Alert.alert("Erro", "Não foi possível salvar o novo endereço.");
        }
        setUpdatingAddress(false);
      }
    };
    saveAddress();
  }, [isFocused, selectedMapAddress]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/perfil'); // Se falhar, volta pro perfil
    }
  };

  const handleLocationPress = () => router.push('/mapa-selecao');
  const handleComingSoon = (screenName) => Alert.alert("Em Desenvolvimento", `A tela "${screenName}" será implementada em breve.`);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={{padding: 5}}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="map-marker-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Localização</Text>
          </View>
          <SettingNavigationItem 
            label="Endereço atual" 
            value={userData?.endereco || "Toque para definir"} 
            onPress={handleLocationPress}
            isLoading={updatingAddress}
          />
        </View>

        {/* ... Resto do código igual, apenas garantindo que o header funcione ... */}
        <View style={styles.card}>
           <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Notificações</Text>
          </View>
          <SettingSwitchItem label="Novos eventos" description="Receba alertas de eventos próximos" value={novosEventos} onValueChange={setNovosEventos} />
          <View style={styles.divider} />
          <SettingSwitchItem label="Promoções" description="Ofertas especiais e descontos" value={promocoes} onValueChange={setPromocoes} />
          <View style={styles.divider} />
          <SettingSwitchItem label="Atualizações do app" description="Novidades e melhorias" value={atualizacoes} onValueChange={setAtualizacoes} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="theme-light-dark" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Aparência</Text>
          </View>
          <SettingSwitchItem label="Modo escuro" description="Ativar tema escuro" value={modoEscuro} onValueChange={setModoEscuro} disabled={true} />
          <Text style={styles.comingSoonText}>Em breve: Modo escuro disponível na próxima versão</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="web" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Idioma</Text>
          </View>
          <SettingNavigationItem label="Português (Brasil)" onPress={() => handleComingSoon("Mudar Idioma")} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-lock-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Privacidade e Segurança</Text>
          </View>
          <SettingNavigationItem label="Política de Privacidade" onPress={() => router.push('/privacidade')} />
          <View style={styles.divider} />
          <SettingNavigationItem label="Termos de Uso" onPress={() => router.push('/termos')} />
          <View style={styles.divider} />
          <SettingNavigationItem label="Alterar senha" onPress={() => router.push('/alterar-senha')} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="help-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Suporte</Text>
          </View>
          <SettingNavigationItem label="Central de Ajuda" onPress={() => handleComingSoon("Central de Ajuda")} />
          <View style={styles.divider} />
          <SettingNavigationItem label="Sobre o PointDV" onPress={() => router.push('/sobre')} />
        </View>

        <Text style={styles.versionText}>Versão 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.lightGray },
  header: { padding: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  container: { padding: 15 },
  card: { backgroundColor: COLORS.white, borderRadius: 8, marginBottom: 15, padding: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  listItemTitle: { fontSize: 16 },
  listItemSubtitle: { color: COLORS.gray, fontSize: 12, marginTop: 2 },
  switchItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  navItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingVertical: 10 },
  divider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: 5 },
  comingSoonText: { fontSize: 12, color: COLORS.gray, marginTop: 5, marginLeft: 5 },
  versionText: { textAlign: 'center', color: COLORS.gray, fontSize: 12, paddingBottom: 20 },
});

export default ConfiguracoesScreen;