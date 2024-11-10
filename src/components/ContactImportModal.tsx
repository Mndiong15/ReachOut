import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Contacts from 'react-native-contacts';
import { requestContactsPermission } from '../utils/permissions';
import { FrequencyType } from '../types/contact';

interface DeviceContact {
  recordID: string;
  displayName: string;
  phoneNumbers: { label: string; number: string }[];
  selected?: boolean;
}

interface ContactImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (contacts: Array<{
    name: string;
    frequency: FrequencyType;
    reminderEnabled: boolean;
  }>) => void;
}

export const ContactImportModal = ({ visible, onClose, onImport }: ContactImportModalProps) => {
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [defaultFrequency] = useState<FrequencyType>('monthly');

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestContactsPermission();
      if (hasPermission) {
        const contacts = await Contacts.getAll();
        const formattedContacts = contacts
          .filter(contact => contact.displayName || contact.givenName)
          .map(contact => ({
            recordID: contact.recordID,
            displayName: contact.displayName || `${contact.givenName} ${contact.familyName}`,
            phoneNumbers: contact.phoneNumbers,
          }));
        setDeviceContacts(formattedContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleContactSelection = (recordID: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(recordID)) {
      newSelected.delete(recordID);
    } else {
      newSelected.add(recordID);
    }
    setSelectedContacts(newSelected);
  };

  const handleImport = () => {
    const contactsToImport = deviceContacts
      .filter(contact => selectedContacts.has(contact.recordID))
      .map(contact => ({
        name: contact.displayName,
        frequency: defaultFrequency,
        reminderEnabled: true,
      }));

    onImport(contactsToImport);
    onClose();
  };

  const filteredContacts = deviceContacts.filter(contact =>
    contact.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Import Contacts</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loading} size="large" color="#007AFF" />
        ) : (
          <>
            <FlatList
              data={filteredContacts}
              keyExtractor={item => item.recordID}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.contactItem,
                    selectedContacts.has(item.recordID) && styles.selectedContact,
                  ]}
                  onPress={() => toggleContactSelection(item.recordID)}
                >
                  <Text style={styles.contactName}>{item.displayName}</Text>
                  {selectedContacts.has(item.recordID) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />

            <View style={styles.footer}>
              <Text style={styles.selectedCount}>
                Selected: {selectedContacts.size}
              </Text>
              <TouchableOpacity
                style={[
                  styles.importButton,
                  selectedContacts.size === 0 && styles.importButtonDisabled,
                ]}
                onPress={handleImport}
                disabled={selectedContacts.size === 0}
              >
                <Text style={styles.importButtonText}>
                  Import Selected Contacts
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  importButton: {
    backgroundColor: '#007AFF',
    padding: 16,
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