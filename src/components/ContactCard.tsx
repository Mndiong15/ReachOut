import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { Contact } from '../types/contact';
import { getTimeUntilNext } from '../utils/dateUtils';

interface ContactCardProps {
  contact: Contact;
  onReachOut: () => void;
}

export const ContactCard = ({ contact, onReachOut }: ContactCardProps) => {
  const timeUntil = getTimeUntilNext(contact);
  const isOverdue = timeUntil === 'Overdue';

  return (
    <View style={[styles.card, isOverdue && styles.cardOverdue]}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.frequency}>
          {contact.frequency.charAt(0).toUpperCase() + contact.frequency.slice(1)}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.lastReached}>
          Last reached out: {format(new Date(contact.lastReachedOut), 'MMM d, yyyy')}
        </Text>
        <Text style={[styles.nextReachOut, isOverdue && styles.textOverdue]}>
          Next reach-out: {timeUntil}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, isOverdue && styles.buttonOverdue]} 
        onPress={onReachOut}
      >
        <Text style={styles.buttonText}>Mark as Reached Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  frequency: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardBody: {
    marginBottom: 12,
  },
  lastReached: {
    color: '#666',
    marginBottom: 4,
  },
  nextReachOut: {
    fontSize: 16,
    fontWeight: '500',
  },
  textOverdue: {
    color: '#FF3B30',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonOverdue: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});