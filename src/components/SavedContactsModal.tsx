import React, { useState, useEffect } from 'react';
import { SavedBusinessContact, BusinessCategory } from '../types';
import {
  BookUser,
  Plus,
  Search,
  Star,
  Phone,
  MapPin,
  User,
  Trash2,
  Edit2,
  Check,
  X,
  Building2,
  ArrowUpRight,
  Copy,
  Sparkles,
  Stethoscope,
  Scissors,
  Wrench,
  UtensilsCrossed,
  HeartPulse,
  Briefcase,
  Home,
  Tag,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  getSavedContacts,
  addOrUpdateContact,
  deleteSavedContact,
  toggleFavorite,
  markContactUsed,
} from '../utils/contacts';
import { soundEngine } from '../utils/audio';

interface SavedContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contact: SavedBusinessContact) => void;
  currentFormContact?: {
    businessName: string;
    phone: string;
    address?: string;
    category?: BusinessCategory;
    staffOrDoctorName?: string;
    serviceNeeded?: string;
  };
}

export const SavedContactsModal: React.FC<SavedContactsModalProps> = ({
  isOpen,
  onClose,
  onSelectContact,
  currentFormContact,
}) => {
  const [contacts, setContacts] = useState<SavedBusinessContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form mode: 'list' | 'add' | 'edit'
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<BusinessCategory>('medical');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStaff, setFormStaff] = useState('');
  const [formService, setFormService] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsFavorite, setFormIsFavorite] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      refreshContacts();
      setMode('list');
      setSearchQuery('');
    }
  }, [isOpen]);

  const refreshContacts = () => {
    const list = getSavedContacts();
    setContacts(list);
  };

  const handleOpenAddForm = (prefillFromCurrent = false) => {
    if (prefillFromCurrent && currentFormContact) {
      setFormName(currentFormContact.businessName || '');
      setFormCategory(currentFormContact.category || 'medical');
      setFormPhone(currentFormContact.phone || '');
      setFormAddress(currentFormContact.address || '');
      setFormStaff(currentFormContact.staffOrDoctorName || '');
      setFormService(currentFormContact.serviceNeeded || '');
      setFormNotes('');
      setFormIsFavorite(true);
    } else {
      setFormName('');
      setFormCategory('dental');
      setFormPhone('');
      setFormAddress('');
      setFormStaff('');
      setFormService('');
      setFormNotes('');
      setFormIsFavorite(false);
    }
    setFormError('');
    setEditingContactId(null);
    setMode('add');
  };

  const handleOpenEditForm = (contact: SavedBusinessContact) => {
    setFormName(contact.businessName);
    setFormCategory(contact.category);
    setFormPhone(contact.phone);
    setFormAddress(contact.address || '');
    setFormStaff(contact.staffOrDoctorName || '');
    setFormService(contact.defaultServiceNeeded || '');
    setFormNotes(contact.notes || '');
    setFormIsFavorite(contact.isFavorite || false);
    setFormError('');
    setEditingContactId(contact.id);
    setMode('edit');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Business name is required.');
      return;
    }
    if (!formPhone.trim()) {
      setFormError('Phone number is required.');
      return;
    }

    addOrUpdateContact({
      id: editingContactId || undefined,
      businessName: formName.trim(),
      category: formCategory,
      phone: formPhone.trim(),
      address: formAddress.trim() || undefined,
      staffOrDoctorName: formStaff.trim() || undefined,
      defaultServiceNeeded: formService.trim() || undefined,
      notes: formNotes.trim() || undefined,
      isFavorite: formIsFavorite,
    });

    soundEngine.playDtmfTone(941, 1336, 0.08);
    refreshContacts();
    setMode('list');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Remove "${name}" from saved contacts?`)) {
      const updated = deleteSavedContact(id);
      setContacts(updated);
    }
  };

  const handleToggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleFavorite(id);
    setContacts(updated);
  };

  const handleSelect = (contact: SavedBusinessContact) => {
    markContactUsed(contact.id);
    soundEngine.playDtmfTone(697, 1209, 0.08);
    onSelectContact(contact);
    onClose();
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getCategoryIcon = (category: BusinessCategory) => {
    switch (category) {
      case 'dental':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
      case 'medical':
        return <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />;
      case 'salon_spa':
        return <Scissors className="w-3.5 h-3.5 text-indigo-400" />;
      case 'auto_service':
        return <Wrench className="w-3.5 h-3.5 text-indigo-400" />;
      case 'restaurant':
        return <UtensilsCrossed className="w-3.5 h-3.5 text-indigo-400" />;
      case 'veterinary':
        return <HeartPulse className="w-3.5 h-3.5 text-indigo-400" />;
      case 'home_service':
        return <Home className="w-3.5 h-3.5 text-indigo-400" />;
      case 'professional_legal':
        return <Briefcase className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  // Filtered Contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.staffOrDoctorName && c.staffOrDoctorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesFav = !showFavoritesOnly || c.isFavorite;

    return matchesSearch && matchesCategory && matchesFav;
  });

  if (!isOpen) return null;

  return (
    <div
      id="saved-contacts-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div
        id="saved-contacts-modal-container"
        className="bg-zinc-950 rounded-2xl border border-zinc-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-zinc-100 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-zinc-900/90 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold">
              <BookUser className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-indigo-400">
                Directory & Address Book
              </div>
              <h2 className="text-lg font-bold text-white">
                Saved Business Contacts
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'list' && (
              <button
                id="btn-add-new-contact-header"
                type="button"
                onClick={() => handleOpenAddForm(false)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            )}
            <button
              id="btn-close-contacts-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode: List Directory */}
        {mode === 'list' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search & Filter Bar */}
            <div className="p-4 sm:p-5 bg-zinc-900/50 border-b border-zinc-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-search-contacts"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search businesses by name, phone, address, or specialty..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-indigo-500 outline-none placeholder:text-zinc-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Favorites Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase border transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    showFavoritesOnly
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-300 text-amber-300' : ''}`} />
                  <span>Favorites Only</span>
                </button>
              </div>

              {/* Category Pills Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
                {[
                  { id: 'all', label: 'All Contacts' },
                  { id: 'dental', label: 'Dental' },
                  { id: 'medical', label: 'Medical' },
                  { id: 'salon_spa', label: 'Salon & Spa' },
                  { id: 'auto_service', label: 'Auto Repair' },
                  { id: 'restaurant', label: 'Restaurant' },
                  { id: 'veterinary', label: 'Veterinary' },
                  { id: 'home_service', label: 'Home Services' },
                  { id: 'professional_legal', label: 'Legal / Pro' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                      selectedCategory === tab.id
                        ? 'bg-indigo-600 border-indigo-500 text-white font-semibold shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contacts Scrollable Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12 px-4 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800 space-y-3">
                  <BookUser className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="text-sm font-semibold text-zinc-300">
                    No matching contacts found
                  </div>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Try adjusting your search filter or add a new business to your address book.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm(false)}
                    className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Contact</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="bg-zinc-900/60 rounded-xl border border-zinc-800 hover:border-indigo-500/50 transition-all p-4 flex flex-col justify-between group relative shadow-sm"
                    >
                      {/* Top Bar: Category & Favorite */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[11px] font-medium text-zinc-300">
                            {getCategoryIcon(contact.category)}
                            <span>{contact.category.replace('_', ' ')}</span>
                          </span>
                          {contact.staffOrDoctorName && (
                            <span className="text-xs text-zinc-400 truncate max-w-[140px]">
                              {contact.staffOrDoctorName}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleToggleFav(contact.id, e)}
                          title={contact.isFavorite ? 'Remove from favorites' : 'Pin to favorites'}
                          className="p-1 text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              contact.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-zinc-500'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Main Business Info */}
                      <div className="space-y-1.5 mb-3">
                        <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {contact.businessName}
                        </h3>

                        {/* Phone */}
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="font-semibold">{contact.phone}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(contact.phone, `phone-${contact.id}`, e)}
                            className="text-[11px] text-zinc-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `phone-${contact.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedId === `phone-${contact.id}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        {/* Address */}
                        {contact.address && (
                          <div className="flex items-start gap-1.5 text-xs text-zinc-400 pt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{contact.address}</span>
                          </div>
                        )}

                        {/* Default Service or Notes */}
                        {contact.defaultServiceNeeded && (
                          <p className="text-xs text-zinc-400 italic line-clamp-1 pt-1">
                            "{contact.defaultServiceNeeded}"
                          </p>
                        )}
                      </div>

                      {/* Action Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(contact)}
                            title="Edit Contact"
                            className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(contact.id, contact.businessName)}
                            title="Delete Contact"
                            className="p-1.5 rounded-lg bg-zinc-950 hover:bg-red-950/40 border border-zinc-800 text-zinc-400 hover:text-red-400 text-xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelect(contact)}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <span>Fill Form</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Footer */}
            <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-zinc-400">
                Total Contacts: <strong className="text-white font-mono">{contacts.length}</strong> • Favorites:{' '}
                <strong className="text-indigo-400 font-mono">{contacts.filter((c) => c.isFavorite).length}</strong>
              </span>

              {currentFormContact?.businessName && (
                <button
                  type="button"
                  onClick={() => handleOpenAddForm(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Current Form Business ("{currentFormContact.businessName.slice(0, 20)}...")</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mode: Add or Edit Form */}
        {(mode === 'add' || mode === 'edit') && (
          <form onSubmit={handleSaveForm} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400">
                  {mode === 'add' ? 'Create New Business Contact' : 'Edit Business Contact'}
                </span>
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Cancel & Return to List
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 text-xs">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Business Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Business / Clinic Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Apex Dental Care, Dr. Hayes Physical Therapy"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-medium text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as BusinessCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="dental">Dental Clinic</option>
                    <option value="medical">Medical / Specialist</option>
                    <option value="salon_spa">Hair & Beauty Salon</option>
                    <option value="auto_service">Auto Repair & Service</option>
                    <option value="restaurant">Dining / Restaurant</option>
                    <option value="veterinary">Veterinary Clinic</option>
                    <option value="home_service">Home Service / Trade</option>
                    <option value="professional_legal">Legal / Professional</option>
                    <option value="other">Other Service</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Phone Number <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+1 (555) 234-8890"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Physical Address / Location
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g., 1042 Market St, Suite 400, San Francisco, CA 94102"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:border-indigo-500 outline-none placeholder:text-zinc-600"
                  />
                </div>

                {/* Practitioner / Staff */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Practitioner / Specialist (Optional)
                  </label>
                  <input
                    type="text"
                    value={formStaff}
                    onChange={(e) => setFormStaff(e.target.value)}
                    placeholder="e.g., Dr. Vance, Stylist Elena"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:border-indigo-500 outline-none placeholder:text-zinc-600"
                  />
                </div>

                {/* Favorite Checkbox */}
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-200">
                    <input
                      type="checkbox"
                      checked={formIsFavorite}
                      onChange={(e) => setFormIsFavorite(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                    <span className="font-semibold uppercase tracking-wider">Pin to Favorites</span>
                  </label>
                </div>

                {/* Default Service Needed */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Default Service / Routine Booking
                  </label>
                  <input
                    type="text"
                    value={formService}
                    onChange={(e) => setFormService(e.target.value)}
                    placeholder="e.g., 6-month routine cleaning & X-rays"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:border-indigo-500 outline-none placeholder:text-zinc-600"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Internal Notes / Office Policies (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g., Parking validated in basement. Requires 24-hr notice for cancellation."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:border-indigo-500 outline-none placeholder:text-zinc-600 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions Footer */}
            <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                {mode === 'add' ? 'Save Contact to Book' : 'Update Contact'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
