import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import AdminTabs from './screens/AdminTabs';

const Stack = createNativeStackNavigator();

// Écran de secours au cas où les composants ne se chargent pas
const FallbackScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Chargement de l'application...</Text>
  </View>
);

export default function App() {
  // Assurez-vous que les composants sont chargés correctement
  const LoginComponent = LoginScreen || FallbackScreen;
  const DashboardComponent = DashboardScreen || FallbackScreen;
  const AdminComponent = AdminTabs || FallbackScreen;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginComponent} />
        <Stack.Screen name="Dashboard" component={DashboardComponent} />
        <Stack.Screen name="AdminTabs" component={AdminComponent} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}