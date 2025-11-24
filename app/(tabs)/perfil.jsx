// app/(tabs)/perfil.jsx

/**
 * Tela de Perfil do Usuário.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useState, useEffect } from 'react'; 
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator,
  Image
} from 'react-native'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsContext } from '../../contexts/EventsContext'; 
import { db } from '../../firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore'; 

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
};

const ProfileListItem = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <View style={styles.listItemIcon}>
      <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
    </View>
    <View style={styles.listItemTextContainer}>
      <Text style={styles.listItemTitle}>{title}</Text>
      {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
  </TouchableOpacity>
);

const PerfilScreen = () => {
  const { userType, logout, userData, favoritedEvents, eventosConfirmados } = useContext(EventsContext);

  // Estados para guardar a contagem REAL (validada)
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  // --- LÓGICA DE VERIFICAÇÃO ---
  useEffect(() => {
    const validateCounts = async () => {
      setIsLoadingCounts(true);

      // Função auxiliar para checar quantos IDs são válidos
      const getValidCount = async (ids) => {
        if (!ids || ids.length === 0) return 0;
        try {
          // Faz uma busca para cada ID para ver se o doc existe
          const promises = ids.map(id => getDoc(doc(db, 'eventos', id)));
          const docs = await Promise.all(promises);
          // Filtra só os que existem (.exists())
          return docs.filter(d => d.exists()).length;
        } catch (e) {
          console.error("Erro ao validar contagem:", e);
          return 0;
        }
      };

      const [validConfirmed, validFavorites] = await Promise.all([
        getValidCount(eventosConfirmados),
        getValidCount(favoritedEvents)
      ]);

      setConfirmedCount(validConfirmed);
      setFavoritesCount(validFavorites);
      setIsLoadingCounts(false);
    };

    validateCounts();
    
    // Roda sempre que as listas do contexto mudarem
  }, [eventosConfirmados, favoritedEvents]);


  const handleLogout = () => {
    logout();
  };

  if (!userData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Textos dinâmicos baseados na contagem real
  const eventosConfirmadosSub = isLoadingCounts 
    ? 'Calculando...' 
    : `${confirmedCount} ${confirmedCount === 1 ? 'evento confirmado' : 'eventos confirmados'}`;
    
  const favoritosSub = isLoadingCounts 
    ? 'Calculando...' 
    : `${favoritesCount} ${favoritesCount === 1 ? 'evento salvo' : 'eventos salvos'}`;


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            {userData.fotoPerfil ? (
              <Image 
                source={{ uri: userData.fotoPerfil }} 
                style={{ width: 80, height: 80, borderRadius: 40 }} 
              />
            ) : (
              <MaterialCommunityIcons name="account-outline" size={40} color={COLORS.primary} />
            )}
          </View>
          <Text style={styles.userName}>{userData.nome}</Text>
          <View style={userType === 'consumidor' ? styles.userTagConsumer : styles.userTagLojista}>
            <Text style={styles.userTagText}>{userData.tipoConta}</Text>
          </View>
        </View>

        <View style={styles.content}>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="email-outline" size={24} color={COLORS.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Email</Text>
                <Text style={styles.infoValue}>{userData.email}</Text>
              </View>
            </View>
            {userType === 'lojista' && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="storefront-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTitle}>Estabelecimento</Text>
                    <Text style={styles.infoValue}>{userData.nomeNegocio}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.actionList}>
            <ProfileListItem 
              icon="account-edit-outline"
              title="Editar Perfil"
              subtitle="Atualizar dados pessoais"
              onPress={() => router.push('/editar-perfil')}
            />

            {userType === 'lojista' && (
              <ProfileListItem 
                icon="calendar-edit"
                title="Gerenciar Eventos"
                subtitle="Criar e editar seus eventos"
                onPress={() => router.push('/(tabs)/meus-eventos')}
              />
            )}
            
            <ProfileListItem 
              icon="calendar-check-outline"
              title="Meus Eventos"
              subtitle={eventosConfirmadosSub} 
              onPress={() => router.push('/(tabs)/meus-eventos')}
            />
            
            <ProfileListItem 
              icon="heart-outline"
              title="Favoritos"
              subtitle={favoritosSub}
              onPress={() => router.push('/(tabs)/favoritos')}
            />
            <ProfileListItem 
              icon="cog-outline"
              title="Configurações"
              subtitle="Preferências e notificações"
              onPress={() => router.push('/configuracoes')}
            />
          </View>

          <View style={styles.aboutSection}>
            <View style={{flex: 1}}>
              <Text style={styles.aboutTitle}>Sobre o PointDV</Text>
              <Text style={styles.aboutText}>PointDV é seu guia para eventos locais. Conectamos você com o melhor da cidade.</Text>
              <Text style={styles.aboutListItem}>- Versão 1.0.0</Text>
              <Text style={styles.aboutListItem}>- Feito em Dois Vizinhos, PR</Text>
            </View>
            <MaterialCommunityIcons name="map-marker-radius" size={50} color={COLORS.primary} />
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color={COLORS.red} />
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.lightGray },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 60, alignItems: 'center' },
  backButton: { position: 'absolute', top: 55, left: 15 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  userName: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  userTagConsumer: { backgroundColor: COLORS.white, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12, marginTop: 8 },
  userTagLojista: { backgroundColor: '#FFD700', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12, marginTop: 8 },
  userTagText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 12 },
  content: { padding: 15, paddingBottom: 30 },
  infoCard: { backgroundColor: COLORS.white, borderRadius: 8, padding: 15, marginTop: -30, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2 },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoTextContainer: { marginLeft: 15 },
  infoTitle: { color: COLORS.gray, fontSize: 12 },
  infoValue: { color: COLORS.dark, fontSize: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: 5 },
  actionList: { marginTop: 20, backgroundColor: COLORS.white, borderRadius: 8, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  listItemIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  listItemTextContainer: { flex: 1, marginLeft: 15 },
  listItemTitle: { fontSize: 16, fontWeight: '500' },
  listItemSubtitle: { color: COLORS.gray, fontSize: 12, marginTop: 2 },
  aboutSection: { flexDirection: 'row', marginTop: 20, backgroundColor: COLORS.white, borderRadius: 8, padding: 15, alignItems: 'center' },
  aboutTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  aboutText: { color: COLORS.gray, marginBottom: 10, lineHeight: 20 },
  aboutListItem: { color: COLORS.gray, fontSize: 12, marginBottom: 5 },
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, backgroundColor: COLORS.white, borderRadius: 8, padding: 15, borderWidth: 1, borderColor: COLORS.red },
  logoutButtonText: { color: COLORS.red, fontWeight: 'bold', marginLeft: 10 },
});

export default PerfilScreen;