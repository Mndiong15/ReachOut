import { Contact, FrequencyType } from '../types/contact';
import { isValid as isValidDate, parseISO } from 'date-fns';

interface ValidationError {
  field: string;
  message: string;
}

export class DataValidationError extends Error {
  errors: ValidationError[];
  
  constructor(message: string, errors: ValidationError[]) {
    super(message);
    this.name = 'DataValidationError';
    this.errors = errors;
  }
}

const isValidFrequency = (frequency: any): frequency is FrequencyType => {
  return ['daily', 'weekly', 'monthly'].includes(frequency);
};

export const validateContact = (contact: any): Contact => {
  const errors: ValidationError[] = [];

  // Validate ID
  if (!contact.id || typeof contact.id !== 'string') {
    errors.push({ field: 'id', message: 'Invalid or missing ID' });
  }

  // Validate name
  if (!contact.name || typeof contact.name !== 'string' || contact.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Invalid or missing name' });
  }

  // Validate frequency
  if (!isValidFrequency(contact.frequency)) {
    errors.push({ field: 'frequency', message: 'Invalid frequency value' });
  }

  // Validate lastReachedOut
  if (!contact.lastReachedOut || 
      typeof contact.lastReachedOut !== 'string' || 
      !isValidDate(parseISO(contact.lastReachedOut))) {
    errors.push({ field: 'lastReachedOut', message: 'Invalid last reached out date' });
  }

  // Validate reminderEnabled
  if (typeof contact.reminderEnabled !== 'boolean') {
    errors.push({ field: 'reminderEnabled', message: 'Invalid reminder enabled value' });
  }

  if (errors.length > 0) {
    throw new DataValidationError('Contact validation failed', errors);
  }

  return contact as Contact;
};