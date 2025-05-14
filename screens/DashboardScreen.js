import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function DashboardScreen({ route, navigation }) {
  const { token } = route.params;
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const availableYears = Array.from({ length: 10 }, (_, i) => selectedYear - 5 + i);
  
  // États pour la modal de détails et les commentaires
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [commentaires, setCommentaires] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchObjectives();
  }, [selectedYear]);

  const fetchObjectives = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://suivi-consultants-backend-production.up.railway.app/objectifs/mine/${selectedYear}`, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setObjectives(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching objectives:', err);
      setError('Impossible de récupérer vos objectifs. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les commentaires d'un objectif
  const fetchObjectiveComments = async (objectiveId) => {
    try {
      const response = await axios.get(
        `https://suivi-consultants-backend-production.up.railway.app/objectifs/${objectiveId}/commentaires`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log('Commentaires récupérés:', response.data);
      setCommentaires(response.data);
    } catch (error) {
      console.error('Erreur récupération commentaires:', error);
      Alert.alert('Erreur', 'Impossible de charger les commentaires');
    }
  };

  // Ajouter un commentaire
  const addComment = async () => {
    if (!newComment.trim()) {
      return Alert.alert('Erreur', 'Le commentaire ne peut pas être vide');
    }

    try {
      setSubmittingComment(true);
      console.log('Ajout commentaire pour objectif:', selectedObjective.id);
      console.log('Contenu:', newComment);
      
      const response = await axios.post(
        `https://suivi-consultants-backend-production.up.railway.app/objectifs/${selectedObjective.id}/commentaires`,
        { contenu: newComment.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Réponse ajout commentaire:', response.data);
      
      // Ajouter le nouveau commentaire à la liste
      setCommentaires([response.data, ...commentaires]);
      setNewComment(''); // Réinitialiser le champ
    } catch (error) {
      console.error('Erreur ajout commentaire:', error.response ? error.response.data : error.message);
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Ouvrir la modal pour voir les détails d'un objectif
  const openObjectiveDetails = (objective) => {
    console.log("Ouverture des détails de l'objectif:", objective);
    setSelectedObjective(objective);
    fetchObjectiveComments(objective.id);
    setModalVisible(true);
  };

  // Fonction pour déterminer la couleur en fonction du statut
  const getColorByStatus = (status) => {
    if (status === 'En cours') return ['#2196F3', '#3f8ede']; // Bleu
    if (status === 'Atteint' || status === 'ACHIEVED') return ['#4CAF50', '#3d9240']; // Vert
    if (status === 'Validé') return ['#9C27B0', '#7B1FA2']; // Violet
    return ['#FB8C00', '#F57C00']; // Orange (par défaut)
  };

  const logout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement de vos objectifs...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Objectifs</Text>
        <View style={styles.headerRight}>
          {/* Sélecteur d'année */}
          <View style={styles.yearSelectorContainer}>
            <Text style={styles.yearLabel}>Année:</Text>
            <Picker
              selectedValue={selectedYear}
              onValueChange={(value) => setSelectedYear(value)}
              style={styles.yearSelector}
              mode="dropdown"
              dropdownIconColor="#fff"
            >
              {availableYears.map(year => (
                <Picker.Item key={year} label={year.toString()} value={year} color="#000" />
              ))}
            </Picker>
          </View>
          
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchObjectives} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && objectives.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun objectif trouvé pour l'année {selectedYear}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {objectives.map((objective) => {
            const statusColors = getColorByStatus(objective.status);
            
            return (
              <TouchableOpacity 
                key={objective.id} 
                style={styles.card}
                onPress={() => openObjectiveDetails(objective)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.objectiveTitle}>Objectif</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: statusColors[0] }
                  ]}>
                    <Text style={styles.statusText}>
                      {objective.status || "En cours"}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.objectiveDescription}>{objective.description}</Text>
                
                <View style={styles.metadataContainer}>
                  <Text style={styles.metadataLabel}>Créé le:</Text>
                  <Text style={styles.metadataValue}>
                    {objective.createdAt 
                      ? new Date(objective.createdAt).toLocaleDateString('fr-FR')
                      : "Date inconnue"}
                  </Text>
                </View>
                
                <View style={styles.metadataContainer}>
                  <Text style={styles.metadataLabel}>Année:</Text>
                  <Text style={styles.metadataValue}>
                    {objective.annee || selectedYear}
                  </Text>
                </View>
                
                {objective.validatedbyadmin && (
                  <View style={styles.validatedBadge}>
                    <Text style={styles.validatedText}>✓ Validé par l'administrateur</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Modal des détails d'objectif */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Détails de l'objectif</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {selectedObjective && (
                <>
                  <View style={styles.objectiveDetailCard}>
                    <Text style={styles.objectiveDetailDescription}>
                      {selectedObjective.description}
                    </Text>
                    <View style={styles.objectiveDetailMeta}>
                      <View>
                        <Text style={styles.objectiveDetailDate}>
                          Créé le {new Date(selectedObjective.createdAt).toLocaleDateString()}
                        </Text>
                        <Text style={styles.objectiveDetailYear}>
                          Année: {selectedObjective.annee || selectedYear}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getColorByStatus(selectedObjective.status)[0] }
                      ]}>
                        <Text style={styles.statusText}>
                          {selectedObjective.validatedbyadmin ? 'Validé' : selectedObjective.status || "En cours"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.commentsTitle}>Commentaires</Text>
                  
                  {/* Zone d'ajout de commentaire */}
                  <View style={styles.addCommentContainer}>
                    <TextInput
                      placeholder="Ajouter un commentaire..."
                      placeholderTextColor="#999"
                      style={styles.commentInput}
                      multiline
                      value={newComment}
                      onChangeText={setNewComment}
                      editable={!submittingComment}
                    />
                    <TouchableOpacity 
                      style={[
                        styles.addCommentButton,
                        (!newComment.trim() || submittingComment) && styles.disabledButton
                      ]}
                      onPress={addComment}
                      disabled={!newComment.trim() || submittingComment}
                    >
                      {submittingComment ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="send" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.commentsContainer}>
                    {commentaires.length > 0 ? (
                      commentaires.map(comment => (
                        <View key={comment.id} style={styles.commentItem}>
                          <View style={styles.commentHeader}>
                            <Text style={styles.commentAuthor}>
                              {comment.user?.username || 'Utilisateur'} 
                              {comment.user?.role === 'ADMIN' && ' (Admin)'}
                            </Text>
                            <Text style={styles.commentDate}>
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <Text style={styles.commentContent}>{comment.contenu}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noCommentsText}>
                        Aucun commentaire pour cet objectif
                      </Text>
                    )}
                  </ScrollView>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 10,
    color: '#e2e8f0',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  yearLabel: {
    color: '#fff',
    marginRight: 8,
    fontSize: 12,
  },
  yearSelector: {
    height: 30,
    width: 100,
    color: '#fff',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 8,
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
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  objectiveTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  objectiveDescription: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  metadataContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metadataLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginRight: 4,
  },
  metadataValue: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  validatedBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.3)',
  },
  validatedText: {
    color: '#ce93d8',
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  errorText: {
    color: '#fca5a5',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  
  // Styles pour la modal et les commentaires
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  objectiveDetailCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  objectiveDetailDescription: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  objectiveDetailMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  objectiveDetailDate: {
    color: '#999',
    fontSize: 12,
  },
  objectiveDetailYear: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  addCommentContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    padding: 4,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    color: '#fff',
    padding: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  addCommentButton: {
    backgroundColor: '#5568FE',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#3f4865',
    opacity: 0.7,
  },
  commentsContainer: {
    maxHeight: 250,
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthor: {
    fontWeight: '600',
    color: '#ddd',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentContent: {
    color: '#ddd',
    lineHeight: 20,
  },
  noCommentsText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  }
});