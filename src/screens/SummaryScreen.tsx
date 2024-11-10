import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useContacts } from '../context/ContactContext';
import { ContactCard } from '../components/ContactCard';
import { getTimeUntilNext } from '../utils/dateUtils';
import { Contact } from '../types/contact';

type SortOption = 'name' | 'nextReachOut';

export const SummaryScreen = () => {
  const { state, markAsReachedOut } = useContacts();
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('nextReachOut');

  const sortedContacts = useMemo(() => {
    const contacts = [...state.contacts];
    return contacts.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        const timeA = getTimeUntilNext(a) === 'Overdue' ? -1 : 1;
        const timeB = getTimeUntilNext(b) === 'Overdue' ? -1 : 1;
        return timeA - timeB;
      }
    });
  }, [state.contacts, sortBy]);

  const handleReachOut = async (contact: Contact) => {
    await markAsReachedOut(contact.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Add any refresh logic here if needed
    setRefreshing(false);
  };

  if (state.loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading contacts...</Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{state.error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sort Controls */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
          onPress={() => setSortBy('name')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
            Name
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'nextReachOut' && styles.sortButtonActive]}
          onPress={() => setSortBy('nextReachOut')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'nextReachOut' && styles.sortButtonTextActive]}>
            Next Reach-out
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            onReachOut={() => handleReachOut(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No contacts yet</Text>
            <Text style={styles.emptySubtext}>Add contacts to start tracking your reach-outs</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortLabel: {
    marginRight: 12,
    color: '#666',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
});