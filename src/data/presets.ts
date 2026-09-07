import { BusinessCategory, EnquiryBrief } from '../types';

export interface PresetTemplate {
  id: string;
  title: string;
  category: BusinessCategory;
  businessName: string;
  phone: string;
  address: string;
  serviceNeeded: string;
  description: string;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  specificQuestions: string[];
  iconName: string;
  language?: string;
  languageName?: string;
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'telugu-apollo-dental',
    title: '🇮🇳 Telugu: Apollo Dental Care Hyderabad',
    category: 'dental',
    businessName: 'Apollo Dental & Healthcare Jubilee Hills',
    phone: '+91 8886002844',
    address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    serviceNeeded: 'Routine dental consultation and teeth cleaning (దంత పరీక్ష మరియు క్లీనింగ్)',
    description: 'Call the Hyderabad clinic in authentic Telugu (తెలుగు) to book doctor appointment slot for tomorrow morning.',
    preferredTimeOfDay: 'morning',
    specificQuestions: [
      'రేపు ఉదయం డాక్టర్ గారి అపాయింట్‌మెంట్ ఉందా? (Is doctor available tomorrow morning?)',
      'కన్సల్టేషన్ ఫీజు ఎంత? (What is consultation fee?)',
      'ఆన్‌లైన్ పేమెంట్ లేదా UPI స్వీకరిస్తారా? (Do they accept UPI payment?)'
    ],
    iconName: 'Sparkles',
    language: 'te',
    languageName: 'Telugu (తెలుగు)'
  },
  {
    id: 'hindi-fortis-consult',
    title: '🇮🇳 Hindi: Max Healthcare Delhi',
    category: 'medical',
    businessName: 'Max Super Speciality Hospital Saket',
    phone: '+91 11 2651 5050',
    address: '1, 2 Press Enclave Marg, Saket, New Delhi 110017',
    serviceNeeded: 'Senior Physician OPD Consultation (वरिष्ठ चिकित्सक परामर्श)',
    description: 'Call the Delhi hospital desk in polite Hindi (हिन्दी) to confirm available slots this week.',
    preferredTimeOfDay: 'afternoon',
    specificQuestions: [
      'क्या कल दोपहर के समय डॉक्टर उपलब्ध हैं? (Is doctor available tomorrow afternoon?)',
      'ओपीडी रजिस्ट्रेशन और परामर्श शुल्क कितना है? (What is the OPD fee?)',
      'क्या पुरानी मेडिकल रिपोर्ट साथ लानी होगी? (Should past reports be brought?)'
    ],
    iconName: 'Stethoscope',
    language: 'hi',
    languageName: 'Hindi (हिन्दी)'
  },
  {
    id: 'tamil-kauvery-chennai',
    title: '🇮🇳 Tamil: Kauvery Hospital Chennai',
    category: 'medical',
    businessName: 'Kauvery Hospital Alwarpet',
    phone: '+91 44 4000 6000',
    address: '199, Luz Church Rd, Mylapore, Chennai, Tamil Nadu 600004',
    serviceNeeded: 'General Health Checkup (பொது மருத்துவ பரிசோதனை)',
    description: 'Call the reception in authentic Tamil (தமிழ்) to inquire about doctor availability.',
    preferredTimeOfDay: 'morning',
    specificQuestions: [
      'நாளை காலை மருத்துவரை பார்க்க நேரம் உள்ளதா? (Is there a slot tomorrow morning?)',
      'பரிசோதனைக்கான கட்டணம் எவ்வளவு? (What is the consultation fee?)'
    ],
    iconName: 'HeartPulse',
    language: 'ta',
    languageName: 'Tamil (தமிழ்)'
  },
  {
    id: 'kannada-manipal-blr',
    title: '🇮🇳 Kannada: Manipal Clinic Bangalore',
    category: 'medical',
    businessName: 'Manipal Hospital HAL Airport Road',
    phone: '+91 80 2502 4444',
    address: '98 HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017',
    serviceNeeded: 'Physician Consultation (ವೈದ್ಯರ ಸಮಾಲೋಚನೆ)',
    description: 'Call the clinic in Kannada (ಕನ್ನಡ) to check slots and scheduling.',
    preferredTimeOfDay: 'morning',
    specificQuestions: [
      'ನಾಳೆ ಮುಂಜಾನೆ ವೈದ್ಯರ ಭೇಟಿಯ ಸಮಯ ಲಭ್ಯವಿದೆಯೇ? (Is morning slot available?)',
      'ಆಸ್ಪತ್ರೆಗೆ ಮುಂಚಿತವಾಗಿ ಬರಬೇಕೇ? (Should we arrive early?)'
    ],
    iconName: 'Stethoscope',
    language: 'kn',
    languageName: 'Kannada (ಕನ್ನಡ)'
  },
  {
    id: 'dental-cleaning',
    title: 'Dental Routine Cleaning & Exam',
    category: 'dental',
    businessName: 'Apex Dental Care & Orthodontics',
    phone: '+1 (555) 234-8890',
    address: '1042 Market St, Suite 400, San Francisco, CA 94102',
    serviceNeeded: 'Routine 6-month dental prophylaxis cleaning and digital bite-wing X-rays',
    description: 'Call the dental clinic to enquire about next Tuesday or Thursday morning openings with Dr. Vance or dental hygienist.',
    preferredTimeOfDay: 'morning',
    specificQuestions: [
      'Do they accept Delta Dental Premier PPO insurance in-network?',
      'How long does the comprehensive cleaning and exam take?',
      'Can digital intake forms be filled out beforehand online?'
    ],
    iconName: 'Sparkles',
    language: 'en-IN',
    languageName: 'English (India)'
  },
  {
    id: 'dermatology-consult',
    title: 'Dermatologist Skin Consultation',
    category: 'medical',
    businessName: 'Pacific Dermatology & Skin Clinic',
    phone: '+1 (555) 890-4321',
    address: '450 Sutter St, Floor 14, San Francisco, CA 94108',
    serviceNeeded: 'Full-body mole examination and routine skin screening consultation',
    description: 'Enquire for new patient appointment availability within the next 2 weeks, preferably afternoons.',
    preferredTimeOfDay: 'afternoon',
    specificQuestions: [
      'Is a general practitioner referral letter required for new patients?',
      'Is Dr. Michelle Chen accepting new patients this month?',
      'What is the estimated out-of-pocket consultation fee if self-pay?'
    ],
    iconName: 'Stethoscope'
  },
  {
    id: 'salon-styling',
    title: 'Haircut & Styling Appointment',
    category: 'salon_spa',
    businessName: 'Lumière Studio & Hair Salon',
    phone: '+1 (555) 678-1290',
    address: '782 Valencia St, San Francisco, CA 94110',
    serviceNeeded: "Men's scissor cut, beard trim, and scalp treatment",
    description: 'Enquire with senior stylist Marco or Elena for Friday late afternoon or Saturday morning.',
    preferredTimeOfDay: 'afternoon',
    specificQuestions: [
      'Is senior stylist Marco available this coming weekend?',
      'What is their cancellation and rescheduling policy window?'
    ],
    iconName: 'Scissors'
  },
  {
    id: 'auto-service',
    title: 'Auto Brake & 60k Mile Service',
    category: 'auto_service',
    businessName: 'Precision Auto Tech & Brake Center',
    phone: '+1 (555) 345-9012',
    address: '1590 Bryant St, San Francisco, CA 94103',
    serviceNeeded: '60,000-mile maintenance check, synthetic oil change, and front brake pad inspection',
    description: 'Call the service desk to check drop-off availability early next week with loaner car option.',
    preferredTimeOfDay: 'morning',
    specificQuestions: [
      'Do they provide a complimentary loaner vehicle or shuttle ride?',
      'What is the expected turnaround time for same-day pickup?'
    ],
    iconName: 'Wrench'
  },
  {
    id: 'restaurant-reserve',
    title: 'Fine Dining Table Reservation',
    category: 'restaurant',
    businessName: 'Osteria Bella Vista',
    phone: '+1 (555) 456-7890',
    address: '2200 Powell St, San Francisco, CA 94133',
    serviceNeeded: 'Dinner table reservation for 4 guests (anniversary celebration)',
    description: 'Enquire for a table on Friday or Saturday evening between 7:00 PM and 8:30 PM, preferably patio seating.',
    preferredTimeOfDay: 'evening',
    specificQuestions: [
      'Is quiet terrace or garden seating available?',
      'Can the kitchen accommodate a mild shellfish allergy?'
    ],
    iconName: 'UtensilsCrossed'
  },
  {
    id: 'veterinary-exam',
    title: 'Veterinary Wellness & Vaccines',
    category: 'veterinary',
    businessName: 'Paws & Whiskers Animal Hospital',
    phone: '+1 (555) 789-3214',
    address: '3200 Geary Blvd, San Francisco, CA 94118',
    serviceNeeded: 'Annual canine wellness checkup, rabies booster, and heartworm screening',
    description: 'Check appointment availability with Dr. Harper on Wednesday or Thursday morning.',
    preferredTimeOfDay: 'morning',
    specificQuestions: [
      'Do you require medical records from our prior vet in advance?',
      'What are the fasting guidelines for morning bloodwork?'
    ],
    iconName: 'HeartPulse'
  }
];
