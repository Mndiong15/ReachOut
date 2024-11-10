import React, { useState } from 'react';
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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { FrequencyPicker } from '../components/FrequencyPicker';
import { useContacts } from '../context/ContactContext';
import { FrequencyType } from '../types/contact';
import { ContactImportModal } from '../components/ContactImportModal';


type AddContactScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddContact'>;
};

export const AddContactScreen = ({ navigation }: AddContactScreenProps) => {
  const { addContact } = useContacts();
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('weekly');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);


  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a contact name');
      return;
    }

    const handleImportContacts = async (contactsToImport: Array<{
      name: string;
      frequency: FrequencyType;
      reminderEnabled: boolean;
    }>) => {
      try {
        for (const contactData of contactsToImport) {
          await addContact({
            ...contactData,
            lastReachedOut: new Date().toISOString(),
          });
        }
        
        Alert.alert(
          'Success',
          `Successfully imported ${contactsToImport.length} contacts`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Summary'),
            },
          ]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to import contacts. Please try again.');
      }
    };

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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Add Import Button at the top */}
          <TouchableOpacity
            style={styles.importButton}
            onPress={() => setShowImportModal(true)}
          >
            <Text style={styles.importButtonText}>Import from Contacts</Text>
          </TouchableOpacity>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter contact name"
              placeholderTextColor="#666"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Frequency Picker */}
          <FrequencyPicker
            value={frequency}
            onValueChange={setFrequency}
          />

          {/* Reminder Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.label}>Enable Reminders</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={reminderEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Adding Contact...' : 'Add Contact'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  importButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  importButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});