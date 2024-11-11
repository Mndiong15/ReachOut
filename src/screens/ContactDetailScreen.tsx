import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useContacts } from '../context/ContactContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { DeviceContact, Contact, FrequencyType } from '../types/contact';

type ContactDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ContactDetail'>;
  route: RouteProp<RootStackParamList, 'ContactDetail'>;
};

export const ContactDetailScreen = ({ navigation, route }: ContactDetailScreenProps) => {
  const { contactId } = route.params;
  const { state, updateContact, deleteContact } = useContacts();
  const [isEditing, setIsEditing] = useState(false);
  const [contact, setContact] = useState<Contact | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedFrequency, setEditedFrequency] = useState<FrequencyType>('weekly');

  useEffect(() => {
    const foundContact = state.contacts.find(c => c.id === contactId);
    if (foundContact) {
      setContact(foundContact);
      setEditedName(foundContact.name);
      setEditedFrequency(foundContact.frequency);
    }
  }, [contactId, state.contacts]);

  const handleSave = async () => {
    if (!contact) return;

    try {
      const updatedContact: Contact = {
        ...contact,
        name: editedName.trim(),
        frequency: editedFrequency,
      };

      await updateContact(updatedContact);
      setIsEditing(false);
      Alert.alert('Success', 'Contact updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update contact');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContact(contactId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const handlePhoneAction = (phoneNumber: any) => {
    Alert.alert(
      'Contact Action',
      `What would you like to do?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${phoneNumber.number}`)
        },
        {
          text: 'Text',
          onPress: () => Linking.openURL(`sms:${phoneNumber.number}`)
        }
      ]
    );
  };

  if (!contact) {
    return (
      <View style={styles.container}>
        <Text>Contact not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Icon 
            name={isEditing ? 'close' : 'create-outline'} 
            size={24} 
            color="#007AFF"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isEditing ? (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Contact name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editedFrequency}
                  onValueChange={(value) => setEditedFrequency(value as FrequencyType)}
                  style={styles.picker}
                >
                  <Picker.Item label="Daily" value="daily" />
                  <Picker.Item label="Weekly" value="weekly" />
                  <Picker.Item label="Monthly" value="monthly" />
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.name}>{contact.name}</Text>
            <Text style={styles.frequency}>
              Reach out {contact.frequency}
            </Text>
            
            {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phone Numbers</Text>
          {contact.phoneNumbers.map((phone, index) => (
            <TouchableOpacity
              key={index}
              style={styles.phoneNumberContainer}
              onPress={() => handlePhoneAction(phone)}
            >
              <View style={styles.phoneNumberInfo}>
                <Text style={styles.phoneLabel}>{phone.label}</Text>
                <Text style={styles.phoneNumber}>{phone.number}</Text>
              </View>
              <View style={styles.phoneActions}>
                <Icon name="call-outline" size={20} color="#007AFF" />
                <Icon 
                  name="chatbubble-outline" 
                  size={20} 
                  color="#007AFF" 
                  style={{ marginLeft: 15 }} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Last Reached Out</Text>
              <Text style={styles.infoValue}>
                {new Date(contact.lastReachedOut).toLocaleDateString()}
              </Text>
            </View>
          </>
        )}

        {!isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Delete Contact</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  editButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  frequency: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
  },
  actionText: {
    marginTop: 8,
    color: '#007AFF',
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  phoneNumberInfo: {
    flex: 1,
  },
  phoneLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  phoneActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});