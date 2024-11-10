// src/context/ContactContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../types/contact';
import { validateContact, DataValidationError } from '../utils/validation';
import { createBackup, getLatestValidBackup } from '../utils/storage';
import { Alert } from 'react-native';

interface ContactState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
}

type ContactAction =
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_ALL_CONTACTS' };

interface ContactContextType {
  state: ContactState;
  addContact: (contact: Omit<Contact, 'id'>) => Promise<void>;
  updateContact: (contact: Contact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  clearAllContacts: () => Promise<void>;
  markAsReachedOut: (id: string) => Promise<void>;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

const initialState: ContactState = {
  contacts: [],
  loading: true,
  error: null,
};

function contactReducer(state: ContactState, action: ContactAction): ContactState {
  switch (action.type) {
    case 'SET_CONTACTS':
      return {
        ...state,
        contacts: action.payload,
        loading: false,
      };
    case 'ADD_CONTACT':
      return {
        ...state,
        contacts: [...state.contacts, action.payload],
      };
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map((contact) =>
          contact.id === action.payload.id ? action.payload : contact
        ),
      };
    case 'DELETE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter((contact) => contact.id !== action.payload),
      };
    case 'CLEAR_ALL_CONTACTS':
      return {
        ...state,
        contacts: [],
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Create an event emitter for contact updates
export const contactUpdateEmitter = {
  listeners: new Set<(contactId: string) => void>(),
  emit(contactId: string) {
    this.listeners.forEach(listener => listener(contactId));
  },
  subscribe(listener: (contactId: string) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

export const ContactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(contactReducer, initialState);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const storedContacts = await AsyncStorage.getItem('contacts');
      
      if (storedContacts) {
        try {
          const parsedContacts = JSON.parse(storedContacts);
          
          if (Array.isArray(parsedContacts)) {
            parsedContacts.forEach(validateContact);
            dispatch({ type: 'SET_CONTACTS', payload: parsedContacts });
            return;
          }
        } catch (error) {
          console.error('Error loading contacts:', error);
          
          const backupData = await getLatestValidBackup();
          
          if (backupData) {
            const recoveredContacts = JSON.parse(backupData);
            dispatch({ type: 'SET_CONTACTS', payload: recoveredContacts });
            
            Alert.alert(
              'Data Recovery',
              'There was an issue with your contacts data. We\'ve restored it from a backup.',
              [{ text: 'OK' }]
            );
            
            await AsyncStorage.setItem('contacts', backupData);
          } else {
            dispatch({ type: 'SET_CONTACTS', payload: [] });
            Alert.alert(
              'Data Error',
              'We encountered an issue with your contacts data and couldn\'t recover it. Starting fresh.',
              [{ text: 'OK' }]
            );
          }
        }
      } else {
        dispatch({ type: 'SET_CONTACTS', payload: [] });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load contacts' });
    }
  };

  const saveContacts = async (contacts: Contact[]) => {
    try {
      const contactsJson = JSON.stringify(contacts);
      await AsyncStorage.setItem('contacts', contactsJson);
      await createBackup('contacts', contactsJson);
    } catch (error) {
      throw new Error('Failed to save contacts');
    }
  };

  const addContact = async (contactData: Omit<Contact, 'id'>) => {
    try {
      const newContact: Contact = validateContact({
        ...contactData,
        id: Date.now().toString(),
      });
      
      const updatedContacts = [...state.contacts, newContact];
      await saveContacts(updatedContacts);
      dispatch({ type: 'ADD_CONTACT', payload: newContact });
      
      // Emit contact update event
      contactUpdateEmitter.emit(newContact.id);
    } catch (error) {
      if (error instanceof DataValidationError) {
        dispatch({ type: 'SET_ERROR', payload: `Invalid contact data: ${error.errors.map(e => e.message).join(', ')}` });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to add contact' });
      }
      throw error;
    }
  };

  const updateContact = async (contact: Contact) => {
    try {
      validateContact(contact);
      const updatedContacts = state.contacts.map((c) => 
        c.id === contact.id ? contact : c
      );
      
      await saveContacts(updatedContacts);
      dispatch({ type: 'UPDATE_CONTACT', payload: contact });
      
      // Emit contact update event
      contactUpdateEmitter.emit(contact.id);
    } catch (error) {
      if (error instanceof DataValidationError) {
        dispatch({ type: 'SET_ERROR', payload: `Invalid contact data: ${error.errors.map(e => e.message).join(', ')}` });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update contact' });
      }
      throw error;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const updatedContacts = state.contacts.filter((c) => c.id !== id);
      await saveContacts(updatedContacts);
      dispatch({ type: 'DELETE_CONTACT', payload: id });
      
      // Emit contact update event
      contactUpdateEmitter.emit(id);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete contact' });
      throw error;
    }
  };

  const clearAllContacts = async () => {
    try {
      await AsyncStorage.removeItem('contacts');
      dispatch({ type: 'CLEAR_ALL_CONTACTS' });
      
      // Emit contact update event for all contacts
      state.contacts.forEach(contact => {
        contactUpdateEmitter.emit(contact.id);
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear contacts' });
      throw error;
    }
  };

  const markAsReachedOut = async (id: string) => {
    try {
      const contact = state.contacts.find((c) => c.id === id);
      if (contact) {
        const updatedContact: Contact = {
          ...contact,
          lastReachedOut: new Date().toISOString(),
        };
        await updateContact(updatedContact);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update reach-out status' });
      throw error;
    }
  };

  return (
    <ContactContext.Provider
      value={{
        state,
        addContact,
        updateContact,
        deleteContact,
        clearAllContacts,
        markAsReachedOut,
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactProvider');
  }
  return context;
};