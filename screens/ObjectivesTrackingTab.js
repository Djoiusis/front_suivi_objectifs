import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { API_URL } from '../config/api';

export default function ObjectivesTrackingTab({ token }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [objectivesLoading, setObjectivesLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [commentaires, setCommentaires] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Générer un tableau d'années disponibles (année courante +/- 5 ans)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: 11 }, 
    (_, i) => currentYear - 5 + i
  );

  // Récupérer la liste des utilisateurs
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }

      const data = await response.json();
      // Filtrer pour n'avoir que les consultants
      const consultants = data.filter(user => user.role === 'CONSULTANT');
      setUsers(consultants);
      setLoading(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', error.message);
      setLoading(false);
    }
  };

  // Récupérer les objectifs d'un utilisateur pour une année spécifique
  const fetchUserObjectives = async (userId) => {
    if (!userId) return;
    
    try {
      setObjectivesLoading(true);
      const response = await fetch(`${API_URL}/objectifs/${userId}/${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des objectifs');
      }

      const data = await response.json();
      setObjectives(data);
      setObjectivesLoading(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', error.message);
      setObjectivesLoading(false);
    }
  };

  // Récupérer les commentaires d'un objectif
  const fetchObjectiveComments = async (objectiveId) => {
    try {
      const response = await fetch(`${API_URL}/objectifs/${objectiveId}/commentaires`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des commentaires');
      }

      const data = await response.json();
      setCommentaires(data);
    } catch (error) {
      console.error(error);
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
      const response = await fetch(`${API_URL}/objectifs/${selectedObjective.id}/commentaires`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contenu: newComment.trim() })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du commentaire');
      }

      const data = await response.json();
      
      // Ajouter le nouveau commentaire à la liste
      setCommentaires([data, ...commentaires]);
      setNewComment(''); // Réinitialiser le champ
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    } finally {
      setSubmittingComment(false);
    }
  };
  

  // Modifier un commentaire
  const updateComment = async () => {
    if (!editText.trim()) {
      return Alert.alert('Erreur', 'Le commentaire ne peut pas être vide');
    }

    try {
      const response = await fetch(`${API_URL}/objectifs/commentaire/${editingComment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contenu: editText.trim() })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification du commentaire');
      }

      const updatedComment = await response.json();
      
      // Mettre à jour la liste des commentaires
      setCommentaires(commentaires.map(c => 
        c.id === updatedComment.id ? updatedComment : c
      ));
      
      // Réinitialiser l'état d'édition
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de modifier le commentaire');
    }
  };

// Supprimer un commentaire
const deleteComment = async (commentId) => {
  try {
    const response = await fetch(`${API_URL}/objectifs/commentaire/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du commentaire');
    }
    
    // Mettre à jour la liste des commentaires
    const updatedComments = commentaires.filter(c => c.id !== commentId);
    setCommentaires(updatedComments);
    
    // Mettre également à jour les commentaires dans l'objectif sélectionné
    if (selectedObjective) {
      const updatedObjective = {
        ...selectedObjective,
        commentaires: selectedObjective.commentaires 
          ? selectedObjective.commentaires.filter(c => c.id !== commentId)
          : []
      };
      setSelectedObjective(updatedObjective);
      
      // Mettre à jour l'objectif dans la liste principale des objectifs
      setObjectives(prevObjectives => 
        prevObjectives.map(obj => 
          obj.id === selectedObjective.id ? updatedObjective : obj
        )
      );
    }
    
    Alert.alert('Succès', 'Commentaire supprimé avec succès');
  } catch (error) {
    console.error(error);
    Alert.alert('Erreur', 'Impossible de supprimer le commentaire');
  }
};


  // Valider un objectif
  const validateObjective = async (objectiveId) => {
    try {
      const response = await fetch(`${API_URL}/objectifs/${objectiveId}/valider`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la validation de l\'objectif');
      }

      // Mettre à jour la liste des objectifs
      setObjectives(objectives.map(obj => 
        obj.id === objectiveId 
          ? { ...obj, validatedbyadmin: true, status: 'Validé' } 
          : obj
      ));
      
      // Mettre à jour l'objectif sélectionné s'il est affiché dans la modal
      if (selectedObjective && selectedObjective.id === objectiveId) {
        setSelectedObjective({
          ...selectedObjective,
          validatedbyadmin: true,
          status: 'Validé'
        });
      }
      
      Alert.alert('Succès', 'Objectif validé avec succès');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', error.message);
    }
  };

// Ouvrir la modal pour voir les détails d'un objectif
const openObjectiveDetails = (objective) => {
  console.log("Ouverture des détails de l'objectif:", objective);
  setSelectedObjective(objective);
  
  // Vérifier si l'objectif contient déjà des commentaires
  if (objective.commentaires && objective.commentaires.length > 0) {
    console.log("Objectif contient déjà des commentaires:", objective.commentaires);
    setCommentaires(objective.commentaires);
  } else {
    // Sinon, les récupérer via l'API
    console.log("Récupération des commentaires via API");
    fetchObjectiveComments(objective.id);
  }
  
  setModalVisible(true);
};

// Et ajouter cette fonction pour rafraîchir les commentaires à tout moment
const refreshComments = () => {
  if (selectedObjective) {
    fetchObjectiveComments(selectedObjective.id);
  }
};

  // Démarrer l'édition d'un commentaire
  const startEditing = (comment) => {
    setEditingComment(comment);
    setEditText(comment.contenu);
  };

  // Annuler l'édition
  const cancelEditing = () => {
    setEditingComment(null);
    setEditText('');
  };

  // Confirmer la suppression d'un commentaire
  const confirmDelete = (commentId) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          onPress: () => deleteComment(commentId),
          style: 'destructive'
        }
      ]
    );
  };

  // Charger les utilisateurs au démarrage
  useEffect(() => {
    fetchUsers();
  }, []);

  // Mettre à jour les objectifs quand l'année change
  useEffect(() => {
    if (selectedUser) {
      fetchUserObjectives(selectedUser.id);
    }
  }, [selectedYear]);

  // Afficher le statut de l'objectif
  const renderStatusBadge = (status, validated) => {
    let badgeStyle = styles.statusBadge;
    let textStyle = styles.statusText;
    let text = status || 'En cours';

    if (validated) {
      badgeStyle = {...badgeStyle, backgroundColor: '#9C27B0'};
      text = 'Validé';
    } else if (status === 'Atteint' || status === 'ACHIEVED') {
      badgeStyle = {...badgeStyle, backgroundColor: '#4CAF50'};
      text = 'Atteint';
    } else {
      badgeStyle = {...badgeStyle, backgroundColor: '#2196F3'};
    }

    return (
      <View style={badgeStyle}>
        <Text style={textStyle}>{text}</Text>
      </View>
    );
  };

  // Rendre un commentaire (normal ou en mode édition)
  const renderComment = (comment) => {
    const isEditing = editingComment && editingComment.id === comment.id;
    
    return (
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
        
        {isEditing ? (
          // Mode édition
          <View style={styles.editCommentContainer}>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={styles.editCommentInput}
              multiline
              autoFocus
            />
            <View style={styles.editButtonsRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={updateComment}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Mode affichage
          <>
            <Text style={styles.commentContent}>{comment.contenu}</Text>
            
            {/* Actions (modifier/supprimer) - seulement pour l'auteur ou admin */}
            <View style={styles.commentActions}>
              <TouchableOpacity 
                onPress={() => startEditing(comment)}
                style={styles.actionButton}
              >
                <MaterialIcons name="edit" size={16} color="#64748b" />
                <Text style={styles.actionText}>Modifier</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => confirmDelete(comment.id)}
                style={styles.actionButton}
              >
                <MaterialIcons name="delete" size={16} color="#ef4444" />
                <Text style={[styles.actionText, styles.deleteText]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5568FE" />
          <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
        </View>
      ) : (
        <>
          {/* Liste horizontale des utilisateurs */}
          <View style={styles.usersContainer}>
            <Text style={styles.sectionTitle}>Consultants</Text>
            <FlatList
              horizontal
              data={users}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.userItem,
                    selectedUser?.id === item.id && styles.selectedUserItem
                  ]}
                  onPress={() => {
                    setSelectedUser(item);
                    fetchUserObjectives(item.id);
                  }}
                >
                  <View style={styles.userAvatar}>
                    <Ionicons 
                      name="person" 
                      size={24} 
                      color={selectedUser?.id === item.id ? "#5568FE" : "#fff"} 
                    />
                  </View>
                  <Text style={styles.userName}>{item.username}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.usersScrollContent}
              showsHorizontalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Aucun consultant trouvé</Text>
              }
            />
          </View>

          {/* Liste des objectifs avec sélection d'année */}
          <View style={styles.objectivesContainer}>
            <View style={styles.objectivesHeader}>
              <Text style={styles.sectionTitle}>
                {selectedUser ? `Objectifs de ${selectedUser.username}` : 'Sélectionnez un consultant'}
              </Text>
              
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
                    <Picker.Item key={year} label={year.toString()} value={year} color="#fff" />
                  ))}
                </Picker>
              </View>
            </View>
            
            {objectivesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5568FE" />
                <Text style={styles.loadingText}>Chargement des objectifs...</Text>
              </View>
            ) : (
              <FlatList
                data={objectives}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.objectiveCard}
                    onPress={() => openObjectiveDetails(item)}
                  >
                    <View style={styles.objectiveHeader}>
                      <Text style={styles.objectiveDescription}>{item.description}</Text>
                      {renderStatusBadge(item.status, item.validatedbyadmin)}
                    </View>
                    
                    <View style={styles.objectiveFooter}>
                      <View style={styles.objectiveMetadata}>
                        <Text style={styles.objectiveDate}>
                          Créé le {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                        <Text style={styles.objectiveYear}>
                          Année: {item.annee || selectedYear}
                        </Text>
                      </View>
                      
                      {item.status === 'Atteint' && !item.validatedbyadmin && (
                        <TouchableOpacity 
                          style={styles.validateButton}
                          onPress={() => validateObjective(item.id)}
                        >
                          <MaterialIcons name="verified" size={16} color="#fff" />
                          <Text style={styles.validateButtonText}>Valider</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.objectivesContent}
                ListEmptyComponent={
                  selectedUser ? (
                    <View style={styles.emptyContainer}>
                      <MaterialIcons name="assignment" size={64} color="#666" />
                      <Text style={styles.emptyText}>
                        Aucun objectif pour ce consultant en {selectedYear}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="person" size={64} color="#666" />
                      <Text style={styles.emptyText}>Veuillez sélectionner un consultant</Text>
                    </View>
                  )
                }
              />
            )}
          </View>
        </>
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
                      {renderStatusBadge(
                        selectedObjective.status, 
                        selectedObjective.validatedbyadmin
                      )}
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
                      commentaires.map(renderComment)
                    ) : (
                      <Text style={styles.noCommentsText}>
                        Aucun commentaire pour cet objectif
                      </Text>
                    )}
                  </ScrollView>

                  {!selectedObjective.validatedbyadmin && 
                  selectedObjective.status === 'Atteint' && (
                    <TouchableOpacity 
                      style={styles.fullValidateButton}
                      onPress={() => {
                        validateObjective(selectedObjective.id);
                        setModalVisible(false);
                      }}
                    >
                      <MaterialIcons name="verified" size={18} color="#fff" />
                      <Text style={styles.fullValidateButtonText}>
                        Valider cet objectif
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ddd',
    marginTop: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  usersContainer: {
    paddingTop: 20,
  },
  usersScrollContent: {
    paddingHorizontal: 16,
  },
  userItem: {
    alignItems: 'center',
    marginRight: 16,
    opacity: 0.7,
  },
  selectedUserItem: {
    opacity: 1,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  userName: {
    color: '#fff',
    fontWeight: '500',
  },
  objectivesContainer: {
    flex: 1,
    paddingTop: 20,
  },
  objectivesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  yearSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearLabel: {
    color: '#fff',
    marginRight: 8,
  },
  yearSelector: {
    height: 40,
    width: 120,
    color: '#fff',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  objectivesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  objectiveCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  objectiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  objectiveDescription: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
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
  objectiveFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  objectiveMetadata: {
    flex: 1,
  },
  objectiveDate: {
    color: '#999',
    fontSize: 12,
  },
  objectiveYear: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C27B0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
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
  // Styles pour les commentaires
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
  commentActions: {
    flexDirection: 'row',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 4,
  },
  actionText: {
    color: '#64748b',
    fontSize: 12,
    marginLeft: 4,
  },
  deleteText: {
    color: '#ef4444',
  },
  // Styles pour l'édition de commentaire
  editCommentContainer: {
    marginTop: 8,
  },
  editCommentInput: {
    backgroundColor: '#374151',
    color: '#fff',
    padding: 8,
    borderRadius: 4,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#9ca3af',
  },
  saveButton: {
    backgroundColor: '#5568FE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  noCommentsText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  fullValidateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    paddingVertical: 12,
    borderRadius: 8,
  },
  fullValidateButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});