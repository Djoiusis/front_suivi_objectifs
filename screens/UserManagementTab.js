import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  ImageBackground,
  Modal,
  Pressable,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function UserManagementTab({ token, navigation }) {
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'CONSULTANT' });
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  
  // Mise à jour de la gestion des années
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Générer les années disponibles (année courante +/- 5 ans)
  const currentYear = new Date().getFullYear();
  const availableYears = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    availableYears.push(i);
  }

  // Roles disponibles
  const availableRoles = ['CONSULTANT', 'ADMIN'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('https://suivi-consultants-backend-production.up.railway.app/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(res.data);
    } catch (error) {
      Alert.alert('Erreur', "Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAssignObjective = async () => {
    if (!description || selectedIds.length === 0) {
      return Alert.alert('Attention', 'Veuillez saisir un objectif et sélectionner au moins un utilisateur.');
    }

    // Ajout de console.log pour déboguer
    console.log("Assignation d'objectif avec année:", {
      description,
      userIds: selectedIds,
      annee: selectedYear
    });

    try {
      await axios.post('https://suivi-consultants-backend-production.up.railway.app/objectifs/admin/multiple', {
        description,
        userIds: selectedIds,
        annee: parseInt(selectedYear) // Assurez-vous que c'est un nombre
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      Alert.alert("Succès", `Objectif assigné aux utilisateurs sélectionnés pour l'année ${selectedYear}`);
      setDescription('');
      setSelectedIds([]);
    } catch (err) {
      console.error("Erreur d'assignation d'objectif:", err);
      Alert.alert("Erreur", "Impossible d'assigner l'objectif");
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.role) {
      return Alert.alert('Attention', 'Tous les champs sont obligatoires');
    }
    
    try {
      await axios.post('https://suivi-consultants-backend-production.up.railway.app/auth/register', {
        username: newUser.username,
        password: newUser.password,
        role: newUser.role
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      Alert.alert("Succès", "Utilisateur créé avec succès");
      setNewUser({ username: '', password: '', role: 'CONSULTANT' });
      fetchUsers();
    } catch (err) {
      Alert.alert("Erreur", "Impossible de créer l'utilisateur");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`https://suivi-consultants-backend-production.up.railway.app/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      Alert.alert("Succès", "Utilisateur supprimé avec succès");
      fetchUsers();
    } catch (err) {
      Alert.alert("Erreur", "Impossible de supprimer l'utilisateur");
    }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        selectedIds.includes(item.id) && styles.userCardSelected
      ]}
      onPress={() => toggleSelect(item.id)}
      onLongPress={() =>
        navigation.navigate('Dashboard', {
          token,
          consultantId: item.id
        })
      }
    >
      <Text style={styles.username}>{item.username}</Text>
      <Text style={styles.role}>🎭 {item.role}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000' }}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(10,10,30,0.6)', 'rgba(10,10,30,0.95)']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>🛠️ Gestion des utilisateurs</Text>

          <Text style={styles.subtitle}>🎯 Assigner un objectif groupé</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Nouvel objectif"
            placeholderTextColor="#aaa"
            style={styles.input}
          />
          
          {/* Sélecteur d'année modifié */}
          <View style={styles.yearSelectorContainer}>
            <Text style={styles.yearLabel}>Année:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedYear}
                onValueChange={(itemValue) => {
                  console.log("Année sélectionnée:", itemValue);
                  setSelectedYear(itemValue);
                }}
                style={styles.yearSelector}
                dropdownIconColor="#fff"
                itemStyle={{ color: Platform.OS === 'ios' ? '#fff' : '#000' }}
              >
                {availableYears.map(year => (
                  <Picker.Item 
                    key={year.toString()} 
                    label={year.toString()} 
                    value={year} 
                    color={Platform.OS === 'ios' ? '#fff' : '#000'}
                  />
                ))}
              </Picker>
            </View>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleAssignObjective}>
            <Text style={styles.buttonText}>✅ Assigner aux sélectionnés</Text>
          </TouchableOpacity>

          <Text style={styles.subtitle}>👥 Utilisateurs :</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#6366f1" />
          ) : (
            <FlatList
              data={users}
              keyExtractor={item => item.id.toString()}
              renderItem={renderUser}
              scrollEnabled={false}
            />
          )}

          <View style={{ marginTop: 20 }}>
            <Text style={styles.subtitle}>➕ Ajouter un utilisateur</Text>
            <TextInput
              placeholder="Nom d'utilisateur"
              placeholderTextColor="#aaa"
              value={newUser.username}
              onChangeText={(text) => setNewUser({ ...newUser, username: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Mot de passe"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={newUser.password}
              onChangeText={(text) => setNewUser({ ...newUser, password: text })}
              style={styles.input}
            />
            
            {/* Sélecteur de rôle */}
            <TouchableOpacity 
              style={styles.roleSelector}
              onPress={() => setRoleModalVisible(true)}
            >
              <Text style={styles.roleSelectorText}>
                {newUser.role || "Sélectionner un rôle"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleAddUser} style={styles.button}>
              <Text style={styles.buttonText}>Créer l'utilisateur</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>📋 Liste des utilisateurs</Text>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.userManagementCard}>
                <Text style={styles.username}>👤 {item.username} ({item.role})</Text>
                <TouchableOpacity onPress={() => handleDeleteUser(item.id)}>
                  <Text style={styles.deleteButton}>🗑️ Supprimer</Text>
                </TouchableOpacity>
              </View>
            )}
            scrollEnabled={false}
          />
        </ScrollView>
      </LinearGradient>
      
      {/* Modal pour sélectionner le rôle */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={roleModalVisible}
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner un rôle</Text>
            
            {availableRoles.map((role) => (
              <TouchableOpacity
                key={role}
                style={styles.roleItem}
                onPress={() => {
                  setNewUser({ ...newUser, role });
                  setRoleModalVisible(false);
                }}
              >
                <Text style={[
                  styles.roleItemText,
                  newUser.role === role && styles.roleItemTextSelected
                ]}>
                  {role}
                </Text>
                {newUser.role === role && (
                  <Ionicons name="checkmark-circle" size={24} color="#4f46e5" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  container: {
    paddingBottom: 50,
  },
  title: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  subtitle: {
    color: '#ccc',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#4f46e5',
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  userCard: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    marginBottom: 8,
  },
  userCardSelected: {
    borderColor: '#4ade80',
    borderWidth: 2,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  role: {
    color: '#ccc',
    fontSize: 12,
  },
  userManagementCard: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    marginBottom: 8,
  },
  deleteButton: {
    color: '#f87171',
    marginTop: 5,
  },
  // Styles pour le sélecteur de rôle
  roleSelector: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    padding: 12,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleSelectorText: {
    color: '#fff',
  },
  // Styles pour le sélecteur d'année
  yearSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    padding: 10,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  yearLabel: {
    color: '#fff',
    marginRight: 8,
  },
  pickerContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  yearSelector: {
    flex: 1,
    height: 40,
    color: '#fff',
    backgroundColor: 'transparent',
  },
  // Styles pour la modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  roleItemText: {
    color: '#ddd',
    fontSize: 16,
  },
  roleItemTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});