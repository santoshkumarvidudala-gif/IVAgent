import React, { useState, useEffect } from 'react';
import {
  EnquiryBrief,
  BusinessCategory,
  BookingAuthority,
  TimeOfDayPreference,
  UrgencyLevel,
  SavedBusinessContact,
  CallMode,
  CallRecord,
} from '../types';
import { PRESET_TEMPLATES, PresetTemplate } from '../data/presets';
import {
  PhoneCall,
  Sparkles,
  Building2,
  User,
  Calendar,
  Clock,
  Shield,
  HelpCircle,
  Plus,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Stethoscope,
  Scissors,
  Wrench,
  UtensilsCrossed,
  HeartPulse,
  Briefcase,
  Zap,
  BookUser,
  Bookmark,
  BookmarkCheck,
  Star,
  Check,
  MapPin,
  Phone,
  Cloud,
  Radio,
  ShieldCheck,
  Lock,
  MessageSquareText,
  SlidersHorizontal,
  Bot,
  CalendarClock,
  RotateCcw,
  Globe,
  Languages,
  Volume2,
} from 'lucide-react';
import {
  getSavedContacts,
  addOrUpdateContact,
  markContactUsed,
} from '../utils/contacts';
import { SavedContactsModal } from './SavedContactsModal';
import { soundEngine } from '../utils/audio';
import { AgentInstructionChat } from './AgentInstructionChat';
import {
  ALL_LANGUAGES,
  REGIONAL_LANGUAGES,
  GLOBAL_LANGUAGES,
  getLanguageByCode,
  LanguageOption,
  suggestLanguageForPhoneNumber,
} from '../utils/languages';
import { AppointmentSuccessRateChart } from './AppointmentSuccessRateChart';

interface EnquiryFormProps {
  onStartCall: (brief: EnquiryBrief, mode: CallMode) => void;
  initialBrief?: EnquiryBrief | null;
  rescheduleNotice?: { businessName: string; previousSlot: string } | null;
  onClearReschedule?: () => void;
  externalOpenContacts?: boolean;
  onCloseExternalContacts?: () => void;
  onOpenGcpSettings?: () => void;
  callHistory?: CallRecord[];
}

export const EnquiryForm: React.FC<EnquiryFormProps> = ({
  onStartCall,
  initialBrief,
  rescheduleNotice,
  onClearReschedule,
  externalOpenContacts = false,
  onCloseExternalContacts,
  onOpenGcpSettings,
  callHistory = [],
}) => {
  // Input dispatch mode: 'chat' (natural language instructions) or 'form' (structured parameters)
  const [inputMode, setInputMode] = useState<'chat' | 'form'>('chat');

  // Preset selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('dental-cleaning');
  const [callMode, setCallMode] = useState<CallMode>('simulation');

  // Regional & Global Language state (default: Telugu 'te')
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(
    initialBrief?.language || 'te'
  );
  const [isPlayingVoiceSample, setIsPlayingVoiceSample] = useState(false);
  const [languageCategoryTab, setLanguageCategoryTab] = useState<'all' | 'regional' | 'global'>('all');
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');

  // Saved Contacts state
  const [savedContacts, setSavedContacts] = useState<SavedBusinessContact[]>([]);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Business info
  const [businessName, setBusinessName] = useState('Sri Dental Care & Polyclinic');
  const [category, setCategory] = useState<BusinessCategory>('dental');
  const [businessPhone, setBusinessPhone] = useState('+919703711100');
  const [businessAddress, setBusinessAddress] = useState('Road No. 12, Banjara Hills, Hyderabad, TS 500034');
  const [staffOrDoctorName, setStaffOrDoctorName] = useState('Dr. Santosh Kumar / Reception');

  // Sync with initialBrief when pre-populated (e.g., from Reschedule)
  useEffect(() => {
    if (initialBrief) {
      if (initialBrief.business) {
        if (initialBrief.business.name) setBusinessName(initialBrief.business.name);
        if (initialBrief.business.category) setCategory(initialBrief.business.category);
        if (initialBrief.business.phone) setBusinessPhone(initialBrief.business.phone);
        if (initialBrief.business.address !== undefined) setBusinessAddress(initialBrief.business.address || '');
        if (initialBrief.business.staffOrDoctorName !== undefined) setStaffOrDoctorName(initialBrief.business.staffOrDoctorName || '');
      }
      if (initialBrief.user) {
        if (initialBrief.user.fullName) setFullName(initialBrief.user.fullName);
        if (initialBrief.user.phone) setUserPhone(initialBrief.user.phone);
        if (initialBrief.user.email) setUserEmail(initialBrief.user.email);
        if (initialBrief.user.isExistingClient !== undefined) setIsExistingClient(initialBrief.user.isExistingClient);
        if (initialBrief.user.insuranceProvider !== undefined) setInsuranceProvider(initialBrief.user.insuranceProvider || '');
        if (initialBrief.user.insurancePolicyId !== undefined) setInsurancePolicyId(initialBrief.user.insurancePolicyId || '');
        if (initialBrief.user.notesForReceptionist !== undefined) setNotesForReceptionist(initialBrief.user.notesForReceptionist || '');
      }
      if (initialBrief.serviceNeeded) setServiceNeeded(initialBrief.serviceNeeded);
      if (initialBrief.preferredDates && initialBrief.preferredDates.length > 0) {
        setPreferredDates(initialBrief.preferredDates);
      }
      if (initialBrief.preferredTimeOfDay) setPreferredTimeOfDay(initialBrief.preferredTimeOfDay);
      if (initialBrief.timeFlexibility) setTimeFlexibility(initialBrief.timeFlexibility);
      if (initialBrief.urgency) setUrgency(initialBrief.urgency);
      if (initialBrief.bookingAuthority) setBookingAuthority(initialBrief.bookingAuthority);
      if (initialBrief.specificQuestions) setSpecificQuestions(initialBrief.specificQuestions);
      if (initialBrief.agentTone) setAgentTone(initialBrief.agentTone);
      if (initialBrief.language) setSelectedLanguageCode(initialBrief.language);
      setSelectedPresetId('');
    }
  }, [initialBrief]);

  // Load saved contacts on mount
  useEffect(() => {
    refreshSavedContacts();
  }, []);

  // Handle external trigger from Header
  useEffect(() => {
    if (externalOpenContacts) {
      setIsContactsModalOpen(true);
    }
  }, [externalOpenContacts]);

  const refreshSavedContacts = () => {
    const list = getSavedContacts();
    setSavedContacts(list);
  };

  // User Profile
  const [fullName, setFullName] = useState('Santosh Kumar');
  const [userPhone, setUserPhone] = useState('+919703711100');
  const [userEmail, setUserEmail] = useState('santoshkumar.vidudala@gmail.com');
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [insuranceProvider, setInsuranceProvider] = useState('Delta Dental Premier PPO');
  const [insurancePolicyId, setInsurancePolicyId] = useState('DL-908214');
  const [notesForReceptionist, setNotesForReceptionist] = useState('First-time patient, looking for routine checkup');

  // Appointment details
  const [serviceNeeded, setServiceNeeded] = useState(
    'Routine 6-month dental prophylaxis cleaning and digital bite-wing X-rays'
  );
  const [preferredDates, setPreferredDates] = useState<string[]>(['Next Tuesday', 'Next Thursday']);
  const [dateInput, setDateInput] = useState('');
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<TimeOfDayPreference>('morning');
  const [timeFlexibility, setTimeFlexibility] = useState<'strict' | 'flexible_few_days' | 'anytime_this_week'>(
    'flexible_few_days'
  );
  const [urgency, setUrgency] = useState<UrgencyLevel>('standard');
  const [bookingAuthority, setBookingAuthority] = useState<BookingAuthority>('direct_book');

  // Specific questions
  const [specificQuestions, setSpecificQuestions] = useState<string[]>([
    'Do they accept Delta Dental Premier PPO in-network?',
    'Can new patient digital intake forms be completed online beforehand?',
    'What is the cancellation or rescheduling notice window?',
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');

  // Agent tone
  const [agentTone, setAgentTone] = useState<'professional' | 'friendly' | 'direct_concise'>('professional');

  // Handle Voice Sample Testing
  const handleTestLanguageVoice = (lang: LanguageOption) => {
    soundEngine.playBlip();
    setIsPlayingVoiceSample(true);
    const speechText = lang.samplePrompt || lang.sampleGreeting;
    soundEngine.speakText(speechText, 'agent', lang.speechCode, () => {
      setIsPlayingVoiceSample(false);
    });
    setTimeout(() => {
      setIsPlayingVoiceSample(false);
    }, 4500);
  };

  // Handle Preset change
  const handleSelectPreset = (preset: PresetTemplate) => {
    setSelectedPresetId(preset.id);
    setBusinessName(preset.businessName);
    setCategory(preset.category);
    setBusinessPhone(preset.phone);
    setBusinessAddress(preset.address || '');
    setServiceNeeded(preset.serviceNeeded);
    setPreferredTimeOfDay(preset.preferredTimeOfDay);
    setSpecificQuestions(preset.specificQuestions);
    if (preset.language) {
      setSelectedLanguageCode(preset.language);
    }

    if (preset.category === 'dental') {
      setInsuranceProvider('Delta Dental Premier PPO');
      setStaffOrDoctorName('Dr. Vance');
    } else if (preset.category === 'medical') {
      setInsuranceProvider('BlueCross BlueShield PPO');
      setStaffOrDoctorName('Dr. Michelle Chen');
    } else {
      setInsuranceProvider('');
      setStaffOrDoctorName('');
    }
  };

  // Handle Saved Contact Selection
  const handleSelectSavedContact = (contact: SavedBusinessContact) => {
    setBusinessName(contact.businessName);
    setCategory(contact.category);
    setBusinessPhone(contact.phone);
    setBusinessAddress(contact.address || '');
    setStaffOrDoctorName(contact.staffOrDoctorName || '');
    if (contact.defaultServiceNeeded) {
      setServiceNeeded(contact.defaultServiceNeeded);
    }
    if (contact.notes) {
      setNotesForReceptionist(contact.notes);
    }
    setSelectedPresetId('');
    markContactUsed(contact.id);
    refreshSavedContacts();
    soundEngine.playDtmfTone(770, 1336, 0.08);
  };

  // Quick bookmark / save current business
  const handleSaveCurrentBusiness = () => {
    if (!businessName.trim()) {
      return;
    }
    if (!businessPhone.trim()) {
      return;
    }

    addOrUpdateContact({
      businessName: businessName.trim(),
      category,
      phone: businessPhone.trim(),
      address: businessAddress.trim() || undefined,
      staffOrDoctorName: staffOrDoctorName.trim() || undefined,
      defaultServiceNeeded: serviceNeeded.trim() || undefined,
      notes: notesForReceptionist.trim() || undefined,
      isFavorite: true,
    });

    soundEngine.playDtmfTone(941, 1477, 0.1);
    refreshSavedContacts();
    setSaveToast(`"${businessName.trim()}" saved to contacts!`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    setSpecificQuestions([...specificQuestions, newQuestionText.trim()]);
    setNewQuestionText('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setSpecificQuestions(specificQuestions.filter((_, i) => i !== idx));
  };

  const handleAddDate = () => {
    if (!dateInput.trim()) return;
    setPreferredDates([...preferredDates, dateInput.trim()]);
    setDateInput('');
  };

  const handleRemoveDate = (idx: number) => {
    setPreferredDates(preferredDates.filter((_, i) => i !== idx));
  };

  const activeLangObj = getLanguageByCode(selectedLanguageCode);

  const currentBrief: EnquiryBrief = {
    id: `enq-${Date.now()}`,
    business: {
      name: businessName.trim() || 'Service Provider',
      category,
      phone: businessPhone.trim() || '+1 (555) 000-0000',
      address: businessAddress.trim() || undefined,
      staffOrDoctorName: staffOrDoctorName.trim() || undefined,
    },
    user: {
      fullName: fullName.trim() || 'Client',
      phone: userPhone.trim() || '+1 (555) 123-4567',
      email: userEmail.trim() || 'client@example.com',
      insuranceProvider: insuranceProvider.trim() || undefined,
      insurancePolicyId: insurancePolicyId.trim() || undefined,
      isExistingClient,
      notesForReceptionist: notesForReceptionist.trim() || undefined,
    },
    serviceNeeded: serviceNeeded.trim() || 'Appointment consultation',
    preferredDates: preferredDates.length > 0 ? preferredDates : ['Next available opening'],
    preferredTimeOfDay,
    timeFlexibility,
    urgency,
    bookingAuthority,
    specificQuestions,
    agentTone,
    language: activeLangObj.code,
    languageName: `${activeLangObj.englishName} (${activeLangObj.nativeName})`,
    createdAt: new Date().toISOString(),
  };

  const handleApplyBriefFromChat = (brief: EnquiryBrief) => {
    if (brief.business) {
      if (brief.business.name) setBusinessName(brief.business.name);
      if (brief.business.category) setCategory(brief.business.category);
      if (brief.business.phone) setBusinessPhone(brief.business.phone);
      if (brief.business.address !== undefined) setBusinessAddress(brief.business.address);
      if (brief.business.staffOrDoctorName !== undefined) setStaffOrDoctorName(brief.business.staffOrDoctorName);
    }
    if (brief.user) {
      if (brief.user.fullName) setFullName(brief.user.fullName);
      if (brief.user.phone) setUserPhone(brief.user.phone);
      if (brief.user.email) setUserEmail(brief.user.email);
      if (brief.user.isExistingClient !== undefined) setIsExistingClient(brief.user.isExistingClient);
      if (brief.user.insuranceProvider !== undefined) setInsuranceProvider(brief.user.insuranceProvider);
      if (brief.user.insurancePolicyId !== undefined) setInsurancePolicyId(brief.user.insurancePolicyId);
      if (brief.user.notesForReceptionist !== undefined) setNotesForReceptionist(brief.user.notesForReceptionist);
    }
    if (brief.serviceNeeded) setServiceNeeded(brief.serviceNeeded);
    if (brief.preferredDates && brief.preferredDates.length > 0) setPreferredDates(brief.preferredDates);
    if (brief.preferredTimeOfDay) setPreferredTimeOfDay(brief.preferredTimeOfDay);
    if (brief.timeFlexibility) setTimeFlexibility(brief.timeFlexibility);
    if (brief.urgency) setUrgency(brief.urgency);
    if (brief.bookingAuthority) setBookingAuthority(brief.bookingAuthority);
    if (brief.specificQuestions) setSpecificQuestions(brief.specificQuestions);
    if (brief.language) setSelectedLanguageCode(brief.language);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartCall(currentBrief, callMode);
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-[#00FF41]" />;
      case 'Stethoscope':
        return <Stethoscope className="w-4 h-4 text-[#00FF41]" />;
      case 'Scissors':
        return <Scissors className="w-4 h-4 text-[#00FF41]" />;
      case 'Wrench':
        return <Wrench className="w-4 h-4 text-[#00FF41]" />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed className="w-4 h-4 text-[#00FF41]" />;
      case 'HeartPulse':
        return <HeartPulse className="w-4 h-4 text-[#00FF41]" />;
      default:
        return <Building2 className="w-4 h-4 text-[#00FF41]" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28">
      {/* Hero Action Header */}
      <div className="bg-[#111111] rounded-none p-6 sm:p-8 text-white border border-white/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00FF41]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2.5 h-2.5 bg-[#00FF41] rounded-full shadow-[0_0_10px_#00FF41]" />
            <span className="text-[11px] font-mono font-bold tracking-[0.3em] uppercase text-[#00FF41]">
              Autonomous Phone Dispatcher
            </span>
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-zinc-500 hidden sm:inline">
              // SYS.094
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-[-0.04em] leading-[1.05] text-white">
            AUTONOMOUS APPOINTMENT <br className="hidden sm:inline" />
            <span className="text-[#00FF41]">VOICE AGENT</span>
          </h1>

          <p className="mt-3 text-xs sm:text-sm font-light text-zinc-300 leading-relaxed max-w-2xl">
            Give instructions in plain English to the AI agent to dial businesses, negotiate time slots, check insurance policies, and confirm appointments.
          </p>
        </div>
      </div>

      {/* Rescheduling Active Session Alert Banner */}
      {rescheduleNotice && (
        <div className="p-4 bg-[#181308] border-2 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-400 text-black flex items-center justify-center font-bold shrink-0">
              <CalendarClock className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 border border-amber-500/30">
                  RESCHEDULING SESSION ACTIVE
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {rescheduleNotice.businessName}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-sans mt-0.5">
                Pre-populated with previous booking info ({rescheduleNotice.previousSlot}). Provide your new preferred days/times to initiate negotiation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClearReschedule && (
              <button
                type="button"
                onClick={onClearReschedule}
                className="px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-black/80 hover:bg-black border border-white/20 hover:border-white/40 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
                title="Reset to blank enquiry template"
              >
                <RotateCcw className="w-3 h-3 text-zinc-400" />
                <span>Reset to Default</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 30-Day Appointment Success Rate & Booking Telemetry Visualization */}
      <AppointmentSuccessRateChart callHistory={callHistory} />

      {/* Input Mode Navigation Tabs */}
      <div className="grid grid-cols-2 bg-zinc-950/80 border border-zinc-800/80 p-1.5 rounded-xl gap-2 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setInputMode('chat');
            soundEngine.playBlip();
          }}
          className={`py-2.5 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            inputMode === 'chat'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Instructions Chat</span>
          <span className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded-md uppercase ${
            inputMode === 'chat' ? 'bg-indigo-700/80 text-indigo-100' : 'bg-zinc-800 text-zinc-400'
          }`}>
            Natural Language
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setInputMode('form');
            soundEngine.playBlip();
          }}
          className={`py-2.5 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            inputMode === 'form'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Structured Form Editor</span>
          <span className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded-md uppercase ${
            inputMode === 'form' ? 'bg-indigo-700/80 text-indigo-100' : 'bg-zinc-800 text-zinc-400'
          }`}>
            Parameters
          </span>
        </button>
      </div>

      {/* Main View: Chat Box Mode */}
      {inputMode === 'chat' && (
        <AgentInstructionChat
          currentBrief={currentBrief}
          onApplyBrief={handleApplyBriefFromChat}
          onStartCall={onStartCall}
          onSwitchToFormMode={() => setInputMode('form')}
          rescheduleNotice={rescheduleNotice}
        />
      )}

      {/* Main View: Form Editor Mode */}
      {inputMode === 'form' && (
        <form id="enquiry-brief-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Quick 1-Click Presets */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Enterprise Preset Scenarios</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select a pre-configured template to populate appointment & inquiry parameters
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {PRESET_TEMPLATES.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-lg text-left border transition-all flex flex-col justify-between h-28 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-xs ring-1 ring-indigo-500/30'
                        : 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                        {getPresetIcon(preset.iconName)}
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-zinc-100 line-clamp-1 block">
                        {preset.title.split(' ')[0]}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 line-clamp-1 uppercase block">
                        {preset.category.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

      {/* Main Form Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Business & Service */}
        <div className="space-y-6">
          {/* Target Business Card */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-5 space-y-4 shadow-sm relative">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Target Provider & Service</span>
              </h3>

              <div className="flex items-center gap-2">
                {/* Save Current Business to Contacts */}
                <button
                  id="btn-save-current-contact"
                  type="button"
                  onClick={handleSaveCurrentBusiness}
                  title="Bookmark & Save Current Provider to Address Book"
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Bookmark className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Save</span>
                </button>

                {/* Open Contacts Directory Modal */}
                <button
                  id="btn-open-contacts-directory"
                  type="button"
                  onClick={() => setIsContactsModalOpen(true)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <BookUser className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Directory ({savedContacts.length})</span>
                </button>
              </div>
            </div>

            {/* Save Success Toast */}
            {saveToast && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveToast}</span>
              </div>
            )}

            {/* Quick Fill from Saved Contacts Chips */}
            {savedContacts.length > 0 && (
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <Star className="w-3 h-3 fill-indigo-400 text-indigo-400" />
                    <span>Quick Fill from Contacts:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsContactsModalOpen(true)}
                    className="text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    View All ({savedContacts.length})
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {savedContacts.slice(0, 4).map((c) => {
                    const isCurrent = businessPhone.replace(/\D/g, '') === c.phone.replace(/\D/g, '');
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectSavedContact(c)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition-all text-left whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200 font-medium'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        <span className="font-medium">{c.businessName.split(' ')[0]}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">({c.phone.slice(-4)})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Business / Provider Name <span className="text-indigo-400">*</span>
              </label>
              <input
                id="input-business-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Apex Dental Care, Pacific Dermatology"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm font-medium text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-zinc-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Category
                </label>
                <select
                  id="select-business-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
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

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Business Phone (E.164) <span className="text-indigo-400">*</span>
                </label>
                <input
                  id="input-business-phone"
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="+1 (555) 234-8890"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Physical Location / Address
              </label>
              <input
                id="input-business-address"
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="e.g., 1042 Market St, Suite 400, San Francisco, CA 94102"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Requested Practitioner / Specialist (Optional)
              </label>
              <input
                id="input-practitioner-name"
                type="text"
                value={staffOrDoctorName}
                onChange={(e) => setStaffOrDoctorName(e.target.value)}
                placeholder="e.g., Dr. Vance, Senior Stylist Marco, or Any"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Appointment Service Needed <span className="text-indigo-400">*</span>
              </label>
              <textarea
                id="textarea-service-needed"
                rows={2}
                value={serviceNeeded}
                onChange={(e) => setServiceNeeded(e.target.value)}
                placeholder="e.g., Routine 6-month dental cleaning, exam, and bite-wing X-rays"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Caller Identity & Insurance */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2 pb-3 border-b border-zinc-800">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Caller Profile & Authorization</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Full Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  id="input-caller-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Santosh Kumar"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Callback Phone <span className="text-indigo-400">*</span>
                </label>
                <input
                  id="input-caller-phone"
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="+1 (555) 892-1049"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Insurance Provider
                </label>
                <input
                  id="input-caller-insurance"
                  type="text"
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  placeholder="e.g., Delta Dental PPO"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Policy / Member ID
                </label>
                <input
                  id="input-caller-policyid"
                  type="text"
                  value={insurancePolicyId}
                  onChange={(e) => setInsurancePolicyId(e.target.value)}
                  placeholder="DL-908214"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  id="checkbox-existing-client"
                  type="checkbox"
                  checked={isExistingClient}
                  onChange={(e) => setIsExistingClient(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 bg-zinc-950 border-zinc-800 rounded cursor-pointer"
                />
                <span className="text-xs text-zinc-300">
                  Established customer / patient on file
                </span>
              </label>
            </div>

            {/* Privacy Guardrails Callout */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-200">Enterprise Guardrail Active: </span>
                <span className="text-zinc-300">Payment credentials and SSNs are protected from voice articulation. Only permitted scheduling details are disclosed.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Schedule Preferences, Authority & Questions */}
        <div className="space-y-6">
          {/* Regional & Global Language & Voice Setting */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Call Language & Dialect (Regional & Global)</span>
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {ALL_LANGUAGES.length} Languages
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Conduct autonomous telephony calls with native regional and global speech, authentic pronunciation, and respectful cultural phrasing.
            </p>

            {/* Smart Phone Prefix Language Suggestion Banner */}
            {(() => {
              const suggested = suggestLanguageForPhoneNumber(businessPhone);
              if (suggested && suggested.code !== selectedLanguageCode) {
                return (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <span className="text-base">{suggested.flagEmoji}</span>
                      <div>
                        <span className="text-zinc-400">Detected phone prefix matches </span>
                        <span className="font-semibold text-white">{suggested.englishName} ({suggested.nativeName})</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLanguageCode(suggested.code);
                        soundEngine.playBlip();
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shrink-0"
                    >
                      Switch to {suggested.englishName}
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* Category Filter Tabs & Quick Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setLanguageCategoryTab('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    languageCategoryTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All ({ALL_LANGUAGES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLanguageCategoryTab('regional')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    languageCategoryTab === 'regional'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Regional Indic ({REGIONAL_LANGUAGES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLanguageCategoryTab('global')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    languageCategoryTab === 'global'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Global ({GLOBAL_LANGUAGES.length})
                </button>
              </div>

              {/* Search input */}
              <input
                type="text"
                value={languageSearchQuery}
                onChange={(e) => setLanguageSearchQuery(e.target.value)}
                placeholder="Search language or dialect..."
                className="px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            {/* Language Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
              {ALL_LANGUAGES.filter((lang) => {
                if (languageCategoryTab !== 'all' && lang.category !== languageCategoryTab) {
                  return false;
                }
                if (languageSearchQuery.trim()) {
                  const q = languageSearchQuery.toLowerCase();
                  return (
                    lang.englishName.toLowerCase().includes(q) ||
                    lang.nativeName.toLowerCase().includes(q) ||
                    lang.code.toLowerCase().includes(q) ||
                    lang.speechCode.toLowerCase().includes(q)
                  );
                }
                return true;
              }).map((lang) => {
                const isSelected = selectedLanguageCode === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSelectedLanguageCode(lang.code);
                      soundEngine.playBlip();
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500/40 text-white shadow-xs'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm">{lang.flagEmoji}</span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-zinc-300'}`}>
                          {lang.nativeName}
                        </span>
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                      <span className="truncate">{lang.englishName}</span>
                      <span className="text-[9px] font-mono uppercase text-zinc-500">{lang.code}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Language Sample & Audio Audition Box */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{activeLangObj.flagEmoji}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {activeLangObj.code.toUpperCase()} • {activeLangObj.speechCode}
                  </span>
                  <span className="text-xs font-medium text-zinc-300">
                    {activeLangObj.englishName} ({activeLangObj.nativeName})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestLanguageVoice(activeLangObj)}
                  disabled={isPlayingVoiceSample}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Audition voice synthesis in browser"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingVoiceSample ? 'text-indigo-400 animate-pulse' : 'text-zinc-400'}`} />
                  <span>{isPlayingVoiceSample ? 'Playing...' : 'Test Voice'}</span>
                </button>
              </div>

              {/* Sample Native Dialogue */}
              <div className="text-xs bg-zinc-900/70 p-2.5 rounded-lg border border-zinc-800/80 font-sans space-y-1">
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <span className="font-semibold text-zinc-300">Agent Opening Greeting:</span>
                </div>
                <div className="text-zinc-200 font-medium italic">
                  "{activeLangObj.sampleGreeting}"
                </div>
                {activeLangObj.samplePrompt && (
                  <div className="text-zinc-400 text-[11px] pt-1 border-t border-zinc-800/50">
                    <span className="text-zinc-500">Sample Enquiry Prompt: </span>
                    "{activeLangObj.samplePrompt}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Preferences Card */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Target Windows & Timing</span>
            </h3>

            {/* Preferred Dates Pills */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Target Days / Dates
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {preferredDates.map((date, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200"
                  >
                    <span>{date}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDate(idx)}
                      className="text-zinc-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  placeholder="e.g. Next Wednesday, Sep 2nd..."
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDate();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddDate}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-colors cursor-pointer"
                >
                  Add Date
                </button>
              </div>
            </div>

            {/* Time of Day preference */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Preferred Time Window
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'any', label: 'ANYTIME' },
                  { id: 'morning', label: 'MORNING (8-12)' },
                  { id: 'afternoon', label: 'AFTERNOON (12-4)' },
                  { id: 'evening', label: 'EVENING (4-8)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreferredTimeOfDay(item.id as TimeOfDayPreference)}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all text-center cursor-pointer ${
                      preferredTimeOfDay === item.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                        : 'bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Booking Authority */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Autonomous Booking Authority
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: 'direct_book',
                    title: 'DIRECT CONFIRM & BOOK BEST MATCH',
                    desc: 'Agent is fully authorized to lock and finalize the best appointment slot.',
                    badge: 'RECOMMENDED',
                  },
                  {
                    id: 'tentative_hold',
                    title: 'PLACE TENTATIVE HOLD',
                    desc: 'Agent requests a 24-48h hold for your final confirmation.',
                  },
                  {
                    id: 'enquiry_only',
                    title: 'INSPECT AVAILABILITY ONLY',
                    desc: 'Agent probes all schedule openings and policies without booking.',
                  },
                ].map((auth) => (
                  <div
                    key={auth.id}
                    onClick={() => setBookingAuthority(auth.id as BookingAuthority)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      bookingAuthority === auth.id
                        ? 'border-indigo-500/80 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="booking_authority"
                          checked={bookingAuthority === auth.id}
                          onChange={() => setBookingAuthority(auth.id as BookingAuthority)}
                          className="accent-indigo-600 cursor-pointer"
                        />
                        <span className="text-xs font-semibold tracking-wide text-white">
                          {auth.title}
                        </span>
                      </div>
                      {auth.badge && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {auth.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 pl-5">{auth.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Specific Questions / Inquiries to Ask */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Questions for Receptionist</span>
            </h3>

            <div className="space-y-2">
              {specificQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                >
                  <span className="text-zinc-200">{q}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="text-zinc-400 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="e.g. Do they offer evening appointments? Parking info?"
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Call Execution Engine Selector */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400" />
                <span>Autonomous Dispatch & Telephony Route</span>
              </h3>

              {onOpenGcpSettings && (
                <button
                  type="button"
                  onClick={onOpenGcpSettings}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <Radio className="w-3 h-3 text-indigo-400" />
                  <span>Telephony Console</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: CALL-E Voice Studio Simulation */}
              <div
                onClick={() => setCallMode('simulation')}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  callMode === 'simulation'
                    ? 'bg-indigo-500/10 border-indigo-500/80 ring-1 ring-indigo-500/30'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${callMode === 'simulation' ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    <span className={`text-xs font-semibold uppercase ${callMode === 'simulation' ? 'text-white' : 'text-zinc-300'}`}>
                      Voice Studio (Simulated)
                    </span>
                  </div>
                  {callMode === 'simulation' && (
                    <span className="w-2 h-2 bg-indigo-400 rounded-full shadow-xs" />
                  )}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Autonomous phone session in browser with live speech synthesis, interactive receptionist negotiation, and structured report.
                </p>
                <div className="mt-2 text-[10px] font-mono text-indigo-400 uppercase">
                  Zero setup required • Instant preview
                </div>
              </div>

              {/* Option 2: CALL-E Live Real-World PSTN Cellular Call */}
              <div
                onClick={() => setCallMode('live_pstn')}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  callMode === 'live_pstn'
                    ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/30'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <PhoneCall className={`w-4 h-4 ${callMode === 'live_pstn' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <span className={`text-xs font-semibold uppercase ${callMode === 'live_pstn' ? 'text-white' : 'text-zinc-300'}`}>
                      Live PSTN Outbound Call
                    </span>
                  </div>
                  {callMode === 'live_pstn' && (
                    <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-xs" />
                  )}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Dials the actual phone number ({businessPhone || 'Target Business'}) over live carrier lines with autonomous speech recognition & conversational turns.
                </p>
                <div className="mt-2 text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1">
                  <span>Carrier Bridge Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Big Launch Call CTA */}
      <div className="sticky bottom-4 z-20 bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-white">
              Target Destination: {businessName}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 flex flex-wrap items-center gap-1.5">
            <span>For {fullName} • Window: {preferredDates.join(', ') || 'Earliest available'} ({preferredTimeOfDay})</span>
            <span className="text-zinc-500">•</span>
            <span className="inline-flex items-center gap-1 text-indigo-300 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>{activeLangObj.englishName} ({activeLangObj.nativeName})</span>
            </span>
          </p>
        </div>

        <button
          id="btn-start-call"
          type="submit"
          className="px-6 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-95 shrink-0 cursor-pointer"
        >
          <PhoneCall className="w-4 h-4 text-white" />
          <span>Launch AI Phone Call</span>
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
      </form>
      )}

      {/* Saved Contacts Directory Modal */}
      <SavedContactsModal
        isOpen={isContactsModalOpen}
        onClose={() => {
          setIsContactsModalOpen(false);
          if (onCloseExternalContacts) onCloseExternalContacts();
          refreshSavedContacts();
        }}
        onSelectContact={(contact) => {
          handleSelectSavedContact(contact);
        }}
        currentFormContact={{
          businessName,
          phone: businessPhone,
          address: businessAddress,
          category,
          staffOrDoctorName,
          serviceNeeded,
        }}
      />
    </div>
  );
};
