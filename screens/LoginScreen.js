// Remplacer la fonction atob non compatible avec le web
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  return JSON.parse(jsonPayload);
}

import React, { useState, useEffect } from 'react';
import { 
  ScrollView,
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ImageBackground
} from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
    });

    return unsubscribe;
  }, [navigation]);


  const handleLogin = async () => {
    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await axios.post('https://suivi-consultants-backend-production.up.railway.app/auth/login', {
        username,
        password
      });

      const token = res.data.token;
      if (token) {
        // Animate before navigation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          
          // Utiliser parseJwt au lieu de atob/Buffer
          const payload = parseJwt(token);
          if (payload.role === 'ADMIN') {
            navigation.navigate('AdminTabs', { token });
          } else {
            navigation.navigate('Dashboard', { token });
          }

        });
      }
    } catch (err) {
      setError('Authentification échouée. Vérifiez vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
          colors={['rgba(10, 10, 30, 0.4)', 'rgba(10, 10, 30, 0.9)']}
          style={styles.gradient}
        >
          <Animated.View style={[
            styles.loginContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}>
            <Animated.Text style={[
              styles.logo,
              { transform: [{ scale: pulseAnim }] }
            ]}>🎯 OBJECTIVE</Animated.Text>
            
            <Text style={styles.tagline}>Visualisez, suivez, réussissez</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>IDENTIFIANT</Text>
              <TextInput
                placeholder="Entrez votre nom d'utilisateur"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>MOT DE PASSE</Text>
              <TextInput
                placeholder="Entrez votre mot de passe"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => alert('Fonctionnalité à venir')}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#4f46e5', '#4338ca']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'CONNEXION EN COURS...' : 'SE CONNECTER'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Animated.View>
        </LinearGradient>
      </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 20, 40, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 6,
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#6366f1',
    fontSize: 14,
  },
  button: {
    borderRadius: 30,
    marginTop: 10,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  }
});