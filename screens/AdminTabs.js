import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import UserManagementTab from './UserManagementTab';
import ObjectivesTrackingTab from './ObjectivesTrackingTab';

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

// Composants placeholder pour les onglets qui n'ont pas encore été développés
function ReportsScreen() {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabText}>Rapports et statistiques</Text>
      <Text style={styles.placeholderText}>Tableau de bord analytique à venir</Text>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabText}>Paramètres</Text>
      <Text style={styles.placeholderText}>Configuration du système à venir</Text>
    </View>
  );
}

export default function AdminTabs({ route, navigation }) {
  const { token } = route.params;

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Administration</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
        
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: styles.tabBar,
            tabBarIndicatorStyle: styles.tabIndicator,
            tabBarActiveTintColor: '#ffffff',
            tabBarInactiveTintColor: '#94a3b8',
            tabBarLabelStyle: styles.tabLabel,
            tabBarPressColor: 'rgba(99, 102, 241, 0.2)',
          }}
        >
          <Tab.Screen 
            name="Users" 
            options={{ tabBarLabel: 'Utilisateurs' }}
          >
            {() => <UserManagementTab token={token} navigation={navigation} />}
          </Tab.Screen>
          <Tab.Screen 
            name="Objectives" 
            options={{ tabBarLabel: 'Objectifs' }}
          >
            {() => <ObjectivesTrackingTab token={token} />}
          </Tab.Screen>
          <Tab.Screen 
            name="Reports" 
            component={ReportsScreen} 
            options={{ tabBarLabel: 'Rapports' }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ tabBarLabel: 'Paramètres' }}
          />
        </Tab.Navigator>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Garder les styles inchangés
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  logoutText: {
    color: '#6366f1',
    fontWeight: '500',
  },
  tabBar: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.3)',
    elevation: 0,
    shadowOpacity: 0,
  },
  tabIndicator: {
    backgroundColor: '#6366f1',
    height: 3,
    borderRadius: 3,
  },
  tabLabel: {
    textTransform: 'none',
    fontWeight: '600',
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tabText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  placeholderText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
  },
});