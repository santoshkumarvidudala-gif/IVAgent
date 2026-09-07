import { SavedBusinessContact, BusinessCategory } from '../types';

export const SAVED_CONTACTS_STORAGE_KEY = 'autonomous_booking_saved_contacts_v1';

export const DEFAULT_SAVED_CONTACTS: SavedBusinessContact[] = [
  {
    id: 'contact-sri-dental-india',
    businessName: 'Sri Dental Care & Polyclinic',
    category: 'dental',
    phone: '+919703711100',
    address: 'Road No. 12, Banjara Hills, Hyderabad, TS 500034',
    staffOrDoctorName: 'Dr. Santosh Kumar / Reception',
    defaultServiceNeeded: 'Dental checkup, cleaning, and routine appointment booking',
    notes: 'Direct line +919703711100. Supports English, Telugu, and Hindi consultations.',
    createdAt: '2026-09-01T10:00:00.000Z',
    lastUsedAt: '2026-09-04T13:00:00.000Z',
    isFavorite: true,
  },
  {
    id: 'contact-apex-dental',
    businessName: 'Apex Dental Care & Orthodontics',
    category: 'dental',
    phone: '+1 (555) 234-8890',
    address: '1042 Market St, Suite 400, San Francisco, CA 94102',
    staffOrDoctorName: 'Dr. Vance',
    defaultServiceNeeded: 'Routine 6-month dental prophylaxis cleaning and digital bite-wing X-rays',
    notes: 'In-network with Delta Dental. Dedicated underground validated parking.',
    createdAt: '2026-08-01T10:00:00.000Z',
    lastUsedAt: '2026-08-25T14:30:00.000Z',
    isFavorite: true,
  },
  {
    id: 'contact-pacific-derm',
    businessName: 'Pacific Dermatology & Skin Clinic',
    category: 'medical',
    phone: '+1 (555) 890-4321',
    address: '450 Sutter St, Floor 14, San Francisco, CA 94108',
    staffOrDoctorName: 'Dr. Michelle Chen',
    defaultServiceNeeded: 'Full-body mole examination and routine skin screening consultation',
    notes: 'Takes Blue Shield PPO. 48-hour cancellation policy.',
    createdAt: '2026-08-05T11:00:00.000Z',
    lastUsedAt: '2026-08-20T09:15:00.000Z',
    isFavorite: true,
  },
  {
    id: 'contact-precision-auto',
    businessName: 'Precision Auto Tech & Brake Center',
    category: 'auto_service',
    phone: '+1 (555) 345-9012',
    address: '1590 Bryant St, San Francisco, CA 94103',
    staffOrDoctorName: 'Service Advisor Dave',
    defaultServiceNeeded: '60,000-mile maintenance check, synthetic oil change, and front brake pad inspection',
    notes: 'Offers courtesy loaner vehicle with advance notice.',
    createdAt: '2026-08-10T12:00:00.000Z',
    lastUsedAt: '2026-08-18T16:45:00.000Z',
    isFavorite: true,
  },
  {
    id: 'contact-lumiere-salon',
    businessName: 'Lumière Studio & Hair Salon',
    category: 'salon_spa',
    phone: '+1 (555) 678-1290',
    address: '782 Valencia St, San Francisco, CA 94110',
    staffOrDoctorName: 'Marco (Master Stylist)',
    defaultServiceNeeded: "Men's scissor cut, beard trim, and scalp treatment",
    notes: 'Accepts card and Apple Pay. Free espresso bar.',
    createdAt: '2026-08-12T15:30:00.000Z',
    isFavorite: false,
  },
  {
    id: 'contact-osteria-bella',
    businessName: 'Osteria Bella Vista',
    category: 'restaurant',
    phone: '+1 (555) 456-7890',
    address: '2200 Powell St, San Francisco, CA 94133',
    staffOrDoctorName: 'Maitre D’ Gianni',
    defaultServiceNeeded: 'Dinner table reservation for 4 guests (patio / window view)',
    notes: '2-hour table seating window. Smart casual dress code.',
    createdAt: '2026-08-15T18:00:00.000Z',
    isFavorite: false,
  },
  {
    id: 'contact-paws-whiskers',
    businessName: 'Paws & Whiskers Animal Hospital',
    category: 'veterinary',
    phone: '+1 (555) 789-3214',
    address: '3200 Geary Blvd, San Francisco, CA 94118',
    staffOrDoctorName: 'Dr. Harper',
    defaultServiceNeeded: 'Annual canine wellness checkup, rabies booster, and heartworm screening',
    notes: 'Bring previous medical vaccine booklet. Separate cat/dog waiting areas.',
    createdAt: '2026-08-16T09:20:00.000Z',
    isFavorite: true,
  },
  {
    id: 'contact-bay-city-pt',
    businessName: 'Bay City Sports Physical Therapy',
    category: 'medical',
    phone: '+1 (555) 612-9933',
    address: '500 Parnassus Ave, Suite 210, San Francisco, CA 94143',
    staffOrDoctorName: 'Dr. Laura Hayes, DPT',
    defaultServiceNeeded: 'Initial sports physical therapy evaluation for knee rehabilitation',
    notes: 'Wear workout athletic attire. Elevator access on 2nd floor.',
    createdAt: '2026-08-18T14:10:00.000Z',
    isFavorite: false,
  },
];

export function getSavedContacts(): SavedBusinessContact[] {
  try {
    const raw = localStorage.getItem(SAVED_CONTACTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SAVED_CONTACTS_STORAGE_KEY, JSON.stringify(DEFAULT_SAVED_CONTACTS));
      return DEFAULT_SAVED_CONTACTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (!parsed.some((c: SavedBusinessContact) => c.phone === '+919703711100' || c.id === 'contact-sri-dental-india')) {
        const merged = [DEFAULT_SAVED_CONTACTS[0], ...parsed];
        localStorage.setItem(SAVED_CONTACTS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    }
    return DEFAULT_SAVED_CONTACTS;
  } catch (e) {
    console.error('Error loading saved contacts:', e);
    return DEFAULT_SAVED_CONTACTS;
  }
}

export function saveContacts(contacts: SavedBusinessContact[]): void {
  try {
    localStorage.setItem(SAVED_CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  } catch (e) {
    console.error('Error saving contacts:', e);
  }
}

export function addOrUpdateContact(
  contactData: {
    id?: string;
    businessName: string;
    category: BusinessCategory;
    phone: string;
    address?: string;
    staffOrDoctorName?: string;
    defaultServiceNeeded?: string;
    notes?: string;
    isFavorite?: boolean;
  }
): SavedBusinessContact {
  const contacts = getSavedContacts();
  const now = new Date().toISOString();

  if (contactData.id) {
    const index = contacts.findIndex((c) => c.id === contactData.id);
    if (index >= 0) {
      const updated: SavedBusinessContact = {
        ...contacts[index],
        ...contactData,
        lastUsedAt: now,
      };
      contacts[index] = updated;
      saveContacts(contacts);
      return updated;
    }
  }

  // Check if contact with identical phone or name already exists
  const existingIdx = contacts.findIndex(
    (c) =>
      c.phone.replace(/\D/g, '') === contactData.phone.replace(/\D/g, '') &&
      c.businessName.toLowerCase().trim() === contactData.businessName.toLowerCase().trim()
  );

  if (existingIdx >= 0) {
    const updated: SavedBusinessContact = {
      ...contacts[existingIdx],
      ...contactData,
      lastUsedAt: now,
    };
    contacts[existingIdx] = updated;
    saveContacts(contacts);
    return updated;
  }

  // Create new contact
  const newContact: SavedBusinessContact = {
    id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    businessName: contactData.businessName.trim(),
    category: contactData.category,
    phone: contactData.phone.trim(),
    address: contactData.address?.trim() || undefined,
    staffOrDoctorName: contactData.staffOrDoctorName?.trim() || undefined,
    defaultServiceNeeded: contactData.defaultServiceNeeded?.trim() || undefined,
    notes: contactData.notes?.trim() || undefined,
    createdAt: now,
    lastUsedAt: now,
    isFavorite: contactData.isFavorite ?? false,
  };

  const updatedContacts = [newContact, ...contacts];
  saveContacts(updatedContacts);
  return newContact;
}

export function deleteSavedContact(id: string): SavedBusinessContact[] {
  const contacts = getSavedContacts();
  const updated = contacts.filter((c) => c.id !== id);
  saveContacts(updated);
  return updated;
}

export function toggleFavorite(id: string): SavedBusinessContact[] {
  const contacts = getSavedContacts();
  const updated = contacts.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
  saveContacts(updated);
  return updated;
}

export function markContactUsed(id: string): void {
  const contacts = getSavedContacts();
  const updated = contacts.map((c) => (c.id === id ? { ...c, lastUsedAt: new Date().toISOString() } : c));
  saveContacts(updated);
}
