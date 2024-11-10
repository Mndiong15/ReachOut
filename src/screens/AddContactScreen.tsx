import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Contact, FrequencyType } from '../types/contact';
import { useContacts } from '../context/ContactContext';
import Contacts from 'react-native-contacts';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Picker } from '@react-native-picker/picker';

type AddContactScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddContact'>;
};

interface DeviceContact {
  recordID: string;
  givenName: string;
  familyName: string;
  displayName?: string;
  phoneNumbers: Array<{
    label: string;
    number: string;
  }>;
}

interface ContactImportState {
  isModalVisible: boolean;
  isLoading: boolean;
  deviceContacts: DeviceContact[];
  selectedContacts: Set<string>;
  searchQuery: string;
}

export const AddContactScreen = ({ navigation }: AddContactScreenProps) => {
  const { addContact } = useContacts();
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('weekly');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contact import state
  const [importState, setImportState] = useState<ContactImportState>({
    isModalVisible: false,
    isLoading: false,
    deviceContacts: [],
    selectedContacts: new Set(),
    searchQuery: '',
  });

  const requestContactsPermission = async (): Promise<boolean> => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CONTACTS 
        : PERMISSIONS.ANDROID.READ_CONTACTS;

      const permissionStatus = await check(permission);
      
      if (permissionStatus === RESULTS.DENIED) {
        const result = await request(permission);
        return result === RESULTS.GRANTED;
      }
      
      return permissionStatus === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  };

  const loadDeviceContacts = async () => {
    setImportState(prev => ({ ...prev, isLoading: true }));
    try {
      const hasPermission = await requestContactsPermission();
      if (hasPermission) {
        const contacts = await Contacts.getAll();
        setImportState(prev => ({
          ...prev,
          deviceContacts: contacts.filter(contact => 
            contact.givenName || contact.familyName || contact.displayName
          ),
          isModalVisible: true
        }));
      } else {
        Alert.alert(
          'Permission Required',
          'Please grant contacts permission to import contacts.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setImportState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a contact name');
      return;
    }

    setIsSubmitting(true);
    try {
      await addContact({
        name: name.trim(),
        frequency,
        reminderEnabled,
        lastReachedOut: new Date().toISOString(),
      });

      Alert.alert(
        'Success',
        'Contact added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Summary'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportContacts = async (selectedContacts: DeviceContact[]) => {
    setIsSubmitting(true);
    try {
      for (const contact of selectedContacts) {
        const contactName = contact.displayName || `${contact.givenName} ${contact.familyName}`.trim();
        if (contactName) {
          await addContact({
            name: contactName,
            frequency,
            reminderEnabled,
            lastReachedOut: new Date().toISOString(),
          });
        }
      }

      Alert.alert(
        'Success',
        `Successfully imported ${selectedContacts.length} contacts`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Summary'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to import contacts. Please try again.');
    } finally {
      setIsSubmitting(false);
      setImportState(prev => ({ ...prev, isModalVisible: false }));
    }
  };

  // Contact selection modal component
  const ContactSelectionModal = () => {
    if (!importState.isModalVisible) return null;

    const filteredContacts = importState.deviceContacts.filter(contact => {
      const searchLower = importState.searchQuery.toLowerCase();
      const displayName = contact.displayName || `${contact.givenName} ${contact.familyName}`.trim();
      return displayName.toLowerCase().includes(searchLower);
    });

    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Contacts</Text>
          <TouchableOpacity 
            onPress={() => setImportState(prev => ({ ...prev, isModalVisible: false }))}
          >
            <Text style={styles.modalCloseButton}>Close</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={importState.searchQuery}
          onChangeText={(text) => setImportState(prev => ({ ...prev, searchQuery: text }))}
        />

        <ScrollView style={styles.contactsList}>
          {filteredContacts.map((contact) => {
            const displayName = contact.displayName || 
              `${contact.givenName} ${contact.familyName}`.trim();
            const isSelected = importState.selectedContacts.has(contact.recordID);

            return (
              <TouchableOpacity
                key={contact.recordID}
                style={[styles.contactItem, isSelected && styles.selectedContact]}
                onPress={() => {
                  const newSelected = new Set(importState.selectedContacts);
                  if (isSelected) {
                    newSelected.delete(contact.recordID);
                  } else {
                    newSelected.add(contact.recordID);
                  }
                  setImportState(prev => ({ ...prev, selectedContacts: newSelected }));
                }}
              >
                <Text style={styles.contactName}>{displayName}</Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.modalFooter}>
          <Text style={styles.selectedCount}>
            Selected: {importState.selectedContacts.size}
          </Text>
          <TouchableOpacity
            style={[
              styles.importButton,
              (!importState.selectedContacts.size || isSubmitting) && styles.importButtonDisabled
            ]}
            onPress={() => {
              const selectedContactObjects = importState.deviceContacts.filter(
                contact => importState.selectedContacts.has(contact.recordID)
              );
              handleImportContacts(selectedContactObjects);
            }}
            disabled={!importState.selectedContacts.size || isSubmitting}
          >
            <Text style={styles.importButtonText}>
              {isSubmitting ? 'Importing...' : 'Import Selected'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Import Button */}
          <TouchableOpacity
            style={styles.importFromContactsButton}
            onPress={loadDeviceContacts}
            disabled={importState.isLoading}
          >
            {importState.isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.importFromContactsButtonText}>
                Import from Contacts
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.separator}>OR</Text>

          {/* Manual Entry Form */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter contact name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={frequency}
                onValueChange={(value) => setFrequency(value as FrequencyType)}
                style={styles.picker}
              >
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
              </Picker>
            </View>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Enable Reminders</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={reminderEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity
            style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.addButtonText}>
              {isSubmitting ? 'Adding Contact...' : 'Add Contact'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {importState.isModalVisible && <ContactSelectionModal />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    padding: 20,
  },
  importFromContactsButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  importFromContactsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalCloseButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  searchInput: {
    margin: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedContact: {
    backgroundColor: '#f0f8ff',
  },
  contactName: {
    fontSize: 16,
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 20,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  importButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButtonDisabled: {
    backgroundColor: '#ccc',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});