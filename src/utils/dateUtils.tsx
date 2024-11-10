import { differenceInDays, addDays, addWeeks, addMonths, format } from 'date-fns';
import { Contact, FrequencyType } from '../types/contact';

export const getNextReachOut = (lastReachOut: string, frequency: FrequencyType): Date => {
  const lastDate = new Date(lastReachOut);
  switch (frequency) {
    case 'daily':
      return addDays(lastDate, 1);
    case 'weekly':
      return addWeeks(lastDate, 1);
    case 'monthly':
      return addMonths(lastDate, 1);
  }
};

export const getTimeUntilNext = (contact: Contact): string => {
  const nextDate = getNextReachOut(contact.lastReachedOut, contact.frequency);
  const daysUntil = differenceInDays(nextDate, new Date());

  if (daysUntil < 0) {
    return 'Overdue';
  } else if (daysUntil === 0) {
    return 'Today';
  } else if (daysUntil === 1) {
    return 'Tomorrow';
  } else {
    return `In ${daysUntil} days`;
  }
};