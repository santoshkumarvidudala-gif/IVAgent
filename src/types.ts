export type BusinessCategory =
  | 'medical'
  | 'dental'
  | 'salon_spa'
  | 'auto_service'
  | 'restaurant'
  | 'veterinary'
  | 'home_service'
  | 'professional_legal'
  | 'other';

export type BookingAuthority =
  | 'enquiry_only' // Just check availability and report slots
  | 'tentative_hold' // Place a soft hold / reserve if allowed
  | 'direct_book'; // Book the best slot directly within preferences

export type UrgencyLevel = 'standard' | 'priority' | 'urgent_asap';

export type TimeOfDayPreference = 'any' | 'morning' | 'afternoon' | 'evening';

export type CallStatus =
  | 'idle'
  | 'dialing'
  | 'ringing'
  | 'connected'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface UserCallerProfile {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth?: string;
  insuranceProvider?: string;
  insurancePolicyId?: string;
  isExistingClient: boolean;
  notesForReceptionist?: string;
}

export interface TargetBusiness {
  name: string;
  category: BusinessCategory;
  phone: string;
  address?: string;
  staffOrDoctorName?: string;
}

export interface EnquiryBrief {
  id: string;
  business: TargetBusiness;
  user: UserCallerProfile;
  serviceNeeded: string;
  preferredDates: string[]; // e.g. ["2026-09-02", "2026-09-03"]
  preferredTimeOfDay: TimeOfDayPreference;
  timeFlexibility: 'strict' | 'flexible_few_days' | 'anytime_this_week';
  urgency: UrgencyLevel;
  bookingAuthority: BookingAuthority;
  specificQuestions: string[];
  maxPriceBudget?: string;
  agentTone: 'professional' | 'friendly' | 'direct_concise';
  language?: string; // e.g. 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'mr' | 'bn' | 'gu' | 'pa' | 'en-IN'
  languageName?: string; // e.g. 'Telugu (తెలుగు)', 'Hindi (हिन्दी)'
  createdAt: string;
}

export interface AvailableSlot {
  id: string;
  date: string;
  time: string;
  practitionerOrStaff?: string;
  serviceType: string;
  priceEstimate?: string;
  isBestMatch: boolean;
  notes?: string;
}

export interface CallTurn {
  id: string;
  speaker: 'agent' | 'receptionist' | 'user_whisper' | 'system';
  speakerName: string;
  text: string;
  timestamp: string;
  agentInternalThought?: string;
  audioBase64?: string;
}

export interface ConfirmationDetails {
  confirmationCode: string;
  method: 'sms' | 'email' | 'both';
  recipientPhone?: string;
  recipientEmail?: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'pending';
  smsMessage: string;
  emailSubject: string;
  emailHtml: string;
  specificInstructions: string[];
  location: string;
  date: string;
  time: string;
  service: string;
  doctorOrStaff?: string;
}

export interface AgentCallRating {
  accuracyRating: number; // 1 to 5
  performanceRating: number; // 1 to 5
  tags?: string[];
  feedbackComment?: string;
  submittedAt: string;
}

export interface StructuredCallReport {
  enquiryId: string;
  businessName: string;
  callOutcome: 'slots_found' | 'appointment_booked' | 'tentative_hold' | 'unavailable' | 'requires_followup';
  executiveSummary: string;
  availableSlots: AvailableSlot[];
  bookedSlot?: AvailableSlot;
  answersToQuestions: { question: string; answer: string }[];
  policyNotes: {
    cancellationPolicy?: string;
    arrivalInstructions?: string;
    requiredDocuments?: string[];
    paymentPolicy?: string;
  };
  durationSeconds: number;
  callDate: string;
  confirmation?: ConfirmationDetails;
  rating?: AgentCallRating;
}

export interface CallRecord {
  id: string;
  brief: EnquiryBrief;
  status: CallStatus;
  turns: CallTurn[];
  report?: StructuredCallReport;
  startedAt: string;
  endedAt?: string;
  recordingAudioAvailable?: boolean;
  confirmation?: ConfirmationDetails;
  rating?: AgentCallRating;
}

export interface SavedBusinessContact {
  id: string;
  businessName: string;
  category: BusinessCategory;
  phone: string;
  address?: string;
  staffOrDoctorName?: string;
  defaultServiceNeeded?: string;
  notes?: string;
  createdAt: string;
  lastUsedAt?: string;
  isFavorite?: boolean;
}

export type CallMode = 'simulation' | 'live_pstn';

export interface TelephonyConfig {
  configured: boolean;
  provider: 'calle' | 'calle_live' | 'simulation';
  calleAuthenticated?: boolean;
  calleBrokerUrl?: string;
  calleCacheExists?: boolean;
  calleLoginUrl?: string;
  appUrl?: string;
}

export interface LiveCallSession {
  callSid: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';
  to: string;
  from: string;
  startTime?: string;
  duration?: number;
  recordingUrl?: string;
  events?: { time: string; event: string; detail?: string }[];
}

export type GcpLogLevel = 'DEFAULT' | 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface GcpLogEntry {
  id: string;
  timestamp: string;
  severity: GcpLogLevel;
  message: string;
  component: string;
  traceId?: string;
  spanId?: string;
  labels?: Record<string, string>;
  payload?: any;
}

export interface GcpCloudStatus {
  isCloudRun: boolean;
  projectId: string;
  region: string;
  serviceName: string;
  revision: string;
  containerPort: number;
  ingressUrl: string;
  uptimeSeconds: number;
  memoryUsageMb: number;
  services: {
    cloudRun: { status: 'healthy' | 'degraded' | 'disabled'; details: string };
    vertexAi: { status: 'healthy' | 'degraded' | 'disabled'; model: string };
    cloudSpeechTts: { status: 'healthy' | 'degraded' | 'disabled'; voicesCount: number };
    cloudLogging: { status: 'healthy' | 'degraded' | 'disabled'; streamActive: boolean };
    cloudStorage: { status: 'healthy' | 'degraded' | 'disabled'; bucket?: string };
    telephonyBridge: { status: 'healthy' | 'degraded' | 'disabled'; carrier: string };
  };
}

export interface GcpVoiceProfile {
  languageCode: string;
  languageName: string;
  voiceName: string;
  gender: 'FEMALE' | 'MALE';
  ssmlGender: string;
  sampleRateHertz: number;
  naturalSampleText: string;
  category?: 'regional' | 'global';
  flagEmoji?: string;
}
