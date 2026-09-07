export type LanguageCategory = 'regional' | 'global';

export interface LanguageOption {
  code: string; // e.g. 'te', 'hi', 'en-US', 'es', 'fr', etc.
  speechCode: string; // BCP-47 tag, e.g. 'te-IN', 'hi-IN', 'en-US', 'es-ES'
  englishName: string;
  nativeName: string;
  category: LanguageCategory;
  regionCode: string; // ISO 3166-1 alpha-2, e.g. 'IN', 'US', 'GB', 'ES', 'FR', 'DE'
  flagEmoji: string;
  sampleGreeting: string;
  samplePrompt: string;
  isPopular?: boolean;
}

export const REGIONAL_LANGUAGES: LanguageOption[] = [
  {
    code: 'te',
    speechCode: 'te-IN',
    englishName: 'Telugu',
    nativeName: 'తెలుగు',
    category: 'regional',
    regionCode: 'IN',
    flagEmoji: '🇮🇳',
    sampleGreeting: 'నమస్కారం అండి! డాక్టర్ అపాయింట్‌మెంట్ గురించి మాట్లాడటానికి కాల్ చేస్తున్నాను.',
    samplePrompt: '8886002844 కి కాల్ చేసి రేపు ఉదయం డాక్టర్ అపాయింట్‌మెంట్ స్లాట్‌లు మరియు ఫీజు వివరాలు కనుక్కోండి (తెలుగులో మాట్లాడండి)',
    isPopular: true,
  },
  {
    code: 'hi',
    speechCode: 'hi-IN',
    englishName: 'Hindi',
    nativeName: 'हिन्दी',
    category: 'regional',
    regionCode: 'IN',
    flagEmoji: '🇮🇳',
    sampleGreeting: 'नमस्ते! मैं डॉक्टर परामर्श के अपॉइंटमेंट के लिए कॉल कर रहा हूँ।',
    samplePrompt: '8886002844 पर कॉल करके कल दोपहर डॉक्टर कंसल्टेशन के लिए उपलब्ध स्लॉट्स पता करो (हिंदी में बात करो)',
    isPopular: true,
  },
  {
    code: 'ta',
    speechCode: 'ta-IN',
    englishName: 'Tamil',
    nativeName: 'தமிழ்',
    category: 'regional',
    regionCode: 'IN',
    flagEmoji: '🇮🇳',
    sampleGreeting: 'வணக்கம்! மருத்துவ சந்திப்பு நேரத்தை முன்பதிவு செய்ய அழைக்கிறேன்.',
    samplePrompt: '8886002844 என்ற எண்ணிற்கு அழைத்து நாளை காலை மருத்துவ சந்திப்பு நேரத்தை அறியவும் (தமிழில் பேசவும்)',
    isPopular: true,
  },
  {
    code: 'kn',
    speechCode: 'kn-IN',
    englishName: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    category: 'regional',
    regionCode: 'IN',
    flagEmoji: '🇮🇳',
    sampleGreeting: 'ನಮಸ್ಕಾರ! ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಲಭ್ಯತೆಯ ಬಗ್ಗೆ ವಿಚಾರಿಸಲು ಕರೆ ಮಾಡುತ್ತಿದ್ದೇನೆ.',
    samplePrompt: '8886002844 ಗೆ ಕರೆ ಮಾಡಿ ನಾಳೆ ಮುಂಜಾನೆ ವೈದ್ಯರ ಭೇಟಿಯ ಸಮಯವನ್ನು ವಿಚಾರಿಸಿ (ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ)',
    isPopular: true,
  },
  {
    code: 'ml',
    speechCode: 'ml-IN',
    englishName: 'Malayalam',
    nativeName: 'മലയാളം',
    category: 'regional',
    regionCode: 'IN',
    flagEmoji: '🇮🇳',
    sampleGreeting: 'നമസ്കാരം! ഡോക്ടറെ കാണാനുള്ള അപ്പോയിന്റ്മെന്റിനായി വിളിക്കുകയാണ്.',
    samplePrompt: '8886002844 ലേക്ക് വിളിച്ച് നാളത്തെ ഡോക്ടർ അപ്പോയിന്റ്മെന്റ് സമയം അന്വേഷിക്കുക (മലയാളത്തിൽ സംസാരിക്കുക)',
  },
  {
    code: 'mr',
    speechCode: 'mr-IN',
    englishName: 'Marathi',
    nativeName: 'मराठी',
    category: 'regional',
    regionCode: 'IN',
    flagEmoji: '🇮🇳',
    sampleGreeting: 'नमस्कार! डॉक्टरांच्या अपॉइंटमेंटबाबत चौकशी करण्यासाठी मी कॉल केला आहे.',
    samplePrompt: '8886002844 वर कॉल करून उद्या सकाळच्या डॉक्टरांच्या भेटीच्या वेळेची माहिती घ्या (मराठीत बोला)',
  },
  {
    code: 'bn',
    speechCode: 'bn-IN',
    englishName: 'Bengali',
    nativeName: 'বাংলা',
    category: 'regional',
    regionCode: 'IN',
    flagEmoji: '🇮🇳',
    sampleGreeting: 'নমস্কার! ডাক্তারের সাথে সাক্ষাতের সময় জানার জন্য কল করেছি।',
    samplePrompt: '8886002844 নম্বরে কল করে আগামীকালের জন্য ডাক্তারের অ্যাপয়েন্টমেন্ট জেনে নিন (বাংলায় কথা বলুন)',
  },
  {
    code: 'gu',
    speechCode: 'gu-IN',
    englishName: 'Gujarati',
    nativeName: 'ગુજરાતી',
    category: 'regional',
    regionCode: 'IN',
    flagEmoji: '🇮🇳',
    sampleGreeting: 'નમસ્તે! ડોક્ટર સાથેની મુલાકાત માટે સમય નક્કી કરવા કોલ કર્યો છે.',
    samplePrompt: '8886002844 પર કોલ કરીને આવતીકાલ માટે ડોક્ટર એપોઇન્ટમેન્ટનો સમય જાણી લો (ગુજરાતીમાં વાત કરો)',
  },
  {
    code: 'pa',
    speechCode: 'pa-IN',
    englishName: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    category: 'regional',
    regionCode: 'IN',
    flagEmoji: '🇮🇳',
    sampleGreeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਡਾਕਟਰ ਦੀ ਮੁਲਾਕਾਤ ਦੇ ਸਮੇਂ ਬਾਰੇ ਪੁੱਛਣ ਲਈ ਕਾਲ ਕੀਤੀ ਹੈ।',
    samplePrompt: '8886002844 ਤੇ ਕਾਲ ਕਰਕੇ ਕੱਲ੍ਹ ਸਵੇਰੇ ਡਾਕਟਰ ਦੀ ਅਪਾਇੰਟਮੈਂਟ ਦੇ ਸਮੇਂ ਬਾਰੇ ਪਤਾ ਕਰੋ (ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲੋ)',
  },
  {
    code: 'ur',
    speechCode: 'ur-IN',
    englishName: 'Urdu',
    nativeName: 'اردو',
    category: 'regional',
    regionCode: 'IN',
    flagEmoji: '🇮🇳',
    sampleGreeting: 'السلام علیکم! میں ڈاکٹر صاحب سے ملاقات کا وقت معلوم کرنے کے لیے کال کر رہا ہوں۔',
    samplePrompt: '8886002844 پر کال کر کے کل کے لیے ڈاکٹر کے اپائنٹمنٹ کے اوقات معلوم کریں (اردو میں بات کریں)',
  },
  {
    code: 'en-IN',
    speechCode: 'en-IN',
    englishName: 'Indian English',
    nativeName: 'English (India)',
    category: 'regional',
    regionCode: 'IN',
    flagEmoji: '🇮🇳',
    sampleGreeting: 'Hello! I am calling on behalf of the patient to check doctor appointment slots.',
    samplePrompt: 'Call 8886002844 to check doctor consultation slots for tomorrow morning in Indian English',
    isPopular: true,
  },
];

export const GLOBAL_LANGUAGES: LanguageOption[] = [
  {
    code: 'en-US',
    speechCode: 'en-US',
    englishName: 'English (US)',
    nativeName: 'English (US)',
    category: 'global',
    regionCode: 'US',
    flagEmoji: '🇺🇸',
    sampleGreeting: 'Hello! I am calling to inquire about appointment availability for the patient.',
    samplePrompt: 'Call +1 (555) 234-5678 to check appointment slots for tomorrow afternoon',
    isPopular: true,
  },
  {
    code: 'en-GB',
    speechCode: 'en-GB',
    englishName: 'English (UK)',
    nativeName: 'English (UK)',
    category: 'global',
    regionCode: 'GB',
    flagEmoji: '🇬🇧',
    sampleGreeting: 'Good day! I am calling on behalf of the client to schedule a consultation.',
    samplePrompt: 'Call +44 20 7946 0912 to enquire about available appointment slots',
  },
  {
    code: 'es',
    speechCode: 'es-ES',
    englishName: 'Spanish',
    nativeName: 'Español',
    category: 'global',
    regionCode: 'ES',
    flagEmoji: '🇪🇸',
    sampleGreeting: '¡Hola! Buenas tardes, llamo en nombre del paciente para consultar la disponibilidad de citas.',
    samplePrompt: 'Llama para verificar los horarios de citas disponibles para mañana por la tarde',
    isPopular: true,
  },
  {
    code: 'fr',
    speechCode: 'fr-FR',
    englishName: 'French',
    nativeName: 'Français',
    category: 'global',
    regionCode: 'FR',
    flagEmoji: '🇫🇷',
    sampleGreeting: "Bonjour! Je vous appelle afin de convenir d'un rendez-vous de consultation médicale.",
    samplePrompt: 'Appelez pour vérifier les créneaux de rendez-vous disponibles demain matin',
    isPopular: true,
  },
  {
    code: 'de',
    speechCode: 'de-DE',
    englishName: 'German',
    nativeName: 'Deutsch',
    category: 'global',
    regionCode: 'DE',
    flagEmoji: '🇩🇪',
    sampleGreeting: 'Guten Tag! Ich rufe an, um mich nach freien Terminen für ein Beratungsgespräch zu erkundigen.',
    samplePrompt: 'Rufen Sie an, um die verfügbaren Termine für morgen Vormittag zu erfragen',
    isPopular: true,
  },
  {
    code: 'ja',
    speechCode: 'ja-JP',
    englishName: 'Japanese',
    nativeName: '日本語',
    category: 'global',
    regionCode: 'JP',
    flagEmoji: '🇯🇵',
    sampleGreeting: 'お世話になっております。相談の予約について確認したくお電話いたしました。',
    samplePrompt: '明日の午前の予約可能枠を確認するためにお電話してください',
    isPopular: true,
  },
  {
    code: 'ar',
    speechCode: 'ar-SA',
    englishName: 'Arabic',
    nativeName: 'العربية',
    category: 'global',
    regionCode: 'SA',
    flagEmoji: '🇸🇦',
    sampleGreeting: 'مرحباً! أتصل بالنيابة عن المريض للاستفسار عن المواعيد المتاحة لحجز استشارة.',
    samplePrompt: 'اتصل للاستفسار عن المواعيد المتاحة ليوم غد صباحاً',
  },
  {
    code: 'pt',
    speechCode: 'pt-BR',
    englishName: 'Portuguese',
    nativeName: 'Português',
    category: 'global',
    regionCode: 'BR',
    flagEmoji: '🇧🇷',
    sampleGreeting: 'Olá! Estou ligando em nome do paciente para verificar a disponibilidade de horários para uma consulta.',
    samplePrompt: 'Ligue para verificar os horários disponíveis para amanhã à tarde',
  },
  {
    code: 'it',
    speechCode: 'it-IT',
    englishName: 'Italian',
    nativeName: 'Italiano',
    category: 'global',
    regionCode: 'IT',
    flagEmoji: '🇮🇹',
    sampleGreeting: 'Buongiorno! Chiamo a nome del paziente per verificare la disponibilità di appuntamenti.',
    samplePrompt: 'Chiama per verificare le disponibilità di appuntamento per domani mattina',
  },
  {
    code: 'zh',
    speechCode: 'zh-CN',
    englishName: 'Mandarin Chinese',
    nativeName: '中文 (普通话)',
    category: 'global',
    regionCode: 'CN',
    flagEmoji: '🇨🇳',
    sampleGreeting: '您好！我代表客户致电，想咨询一下预约门诊的可选时间段。',
    samplePrompt: '致电咨询明天上午是否有空缺的预约名额',
  },
  {
    code: 'ko',
    speechCode: 'ko-KR',
    englishName: 'Korean',
    nativeName: '한국어',
    category: 'global',
    regionCode: 'KR',
    flagEmoji: '🇰🇷',
    sampleGreeting: '안녕하세요! 고객님을 대신하여 진료 예약 가능한 일정을 문의드리고자 연락드렸습니다.',
    samplePrompt: '내일 오전 예약 가능한 시간을 문의하기 위해 전화합니다',
  },
];

export const ALL_LANGUAGES: LanguageOption[] = [
  ...REGIONAL_LANGUAGES,
  ...GLOBAL_LANGUAGES,
];

// Alias for backwards compatibility
export const INDIAN_LANGUAGES = REGIONAL_LANGUAGES;
export type IndianLanguageOption = LanguageOption;

/**
 * Retrieve a language option by code or name
 */
export function getLanguageByCode(code?: string): LanguageOption {
  if (!code) return REGIONAL_LANGUAGES[0]; // default to Telugu or first regional
  const clean = code.toLowerCase().trim();

  // Exact code or speechCode match
  const match = ALL_LANGUAGES.find(
    (l) =>
      l.code.toLowerCase() === clean ||
      l.speechCode.toLowerCase() === clean ||
      l.englishName.toLowerCase() === clean
  );
  if (match) return match;

  // Prefix match (e.g. 'es' matching 'es-ES' or 'en' matching 'en-US')
  const prefixMatch = ALL_LANGUAGES.find(
    (l) => l.code.toLowerCase().startsWith(clean) || clean.startsWith(l.code.toLowerCase())
  );
  return prefixMatch || REGIONAL_LANGUAGES[0];
}

// Alias for backwards compatibility
export const getIndianLanguageByCode = getLanguageByCode;

/**
 * Auto-detect appropriate language from natural text or script
 */
export function detectLanguageFromText(text: string): LanguageOption | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Telugu Unicode: \u0C00-\u0C7F
  if (/[\u0C00-\u0C7F]/.test(text) || /\b(telugu|తెలుగు|మాట్లాడు|అపాయింట్‌మెంట్)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'te') || null;
  }
  // Tamil Unicode: \u0B80-\u0BFF
  if (/[\u0B80-\u0BFF]/.test(text) || /\b(tamil|தமிழ்|பேசு)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'ta') || null;
  }
  // Kannada Unicode: \u0C80-\u0CFF
  if (/[\u0C80-\u0CFF]/.test(text) || /\b(kannada|ಕನ್ನಡ|ಮಾತನಾಡಿ)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'kn') || null;
  }
  // Malayalam Unicode: \u0D00-\u0D7F
  if (/[\u0D00-\u0D7F]/.test(text) || /\b(malayalam|മലയാളം)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'ml') || null;
  }
  // Bengali Unicode: \u0980-\u09FF
  if (/[\u0980-\u09FF]/.test(text) || /\b(bengali|bangla|বাংলা)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'bn') || null;
  }
  // Gujarati Unicode: \u0A80-\u0AFF
  if (/[\u0A80-\u0AFF]/.test(text) || /\b(gujarati|ગુજરાતી)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'gu') || null;
  }
  // Punjabi Unicode: \u0A00-\u0A7F
  if (/[\u0A00-\u0A7F]/.test(text) || /\b(punjabi|ਪੰਜਾਬੀ)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'pa') || null;
  }
  // Urdu / Arabic Arabic-Indic Unicode: \u0600-\u06FF
  if (/\b(urdu|اردو)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'ur') || null;
  }
  if (/\b(arabic|العربية|مرحبا|موعد)\b/i.test(lower) || /[\u0600-\u06FF]/.test(text)) {
    return ALL_LANGUAGES.find((l) => l.code === 'ar') || null;
  }
  // Marathi or Hindi Unicode: \u0900-\u097F
  if (/\b(marathi|मराठी)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'mr') || null;
  }
  if (/[\u0900-\u097F]/.test(text) || /\b(hindi|हिंदी|हिन्दी|बात करो)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'hi') || null;
  }

  // Japanese Kanji / Hiragana / Katakana
  if (/[\u3040-\u30FF\u4E00-\u9FAF]/.test(text) && /\b(japanese|日本語|電話|予約)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'ja') || null;
  }
  // Korean Hangul
  if (/[\uAC00-\uD7AF]/.test(text) || /\b(korean|한국어|예약)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'ko') || null;
  }
  // Chinese Hanzi
  if (/[\u4E00-\u9FFF]/.test(text) && /\b(chinese|mandarin|中文|普通话|预约)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'zh') || null;
  }

  // Spanish keywords
  if (/\b(spanish|español|cita|llamar|habla español|en español)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'es') || null;
  }
  // French keywords
  if (/\b(french|français|rendez-vous|appelle|en français)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'fr') || null;
  }
  // German keywords
  if (/\b(german|deutsch|termin|anrufen|auf deutsch)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'de') || null;
  }
  // Portuguese keywords
  if (/\b(portuguese|português|consulta|ligar|em português)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'pt') || null;
  }
  // Italian keywords
  if (/\b(italian|italiano|appuntamento|chiamare|in italiano)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'it') || null;
  }

  // English variants
  if (/\b(british english|english uk|uk english)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'en-GB') || null;
  }
  if (/\b(us english|english us|american english)\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'en-US') || null;
  }
  if (/\b(indian english|english \(india\))\b/i.test(lower)) {
    return ALL_LANGUAGES.find((l) => l.code === 'en-IN') || null;
  }

  return null;
}

// Alias for backwards compatibility
export const detectIndianLanguage = detectLanguageFromText;

/**
 * Suggest optimal language based on phone country dialing code
 */
export function suggestLanguageForPhoneNumber(phone: string): LanguageOption | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');

  if (phone.startsWith('+91') || digits.startsWith('91')) {
    return ALL_LANGUAGES.find((l) => l.code === 'te') || null;
  }
  if (phone.startsWith('+1') || (digits.length === 10 && !phone.startsWith('+'))) {
    return ALL_LANGUAGES.find((l) => l.code === 'en-US') || null;
  }
  if (phone.startsWith('+44')) {
    return ALL_LANGUAGES.find((l) => l.code === 'en-GB') || null;
  }
  if (phone.startsWith('+34') || phone.startsWith('+52')) {
    return ALL_LANGUAGES.find((l) => l.code === 'es') || null;
  }
  if (phone.startsWith('+33')) {
    return ALL_LANGUAGES.find((l) => l.code === 'fr') || null;
  }
  if (phone.startsWith('+49')) {
    return ALL_LANGUAGES.find((l) => l.code === 'de') || null;
  }
  if (phone.startsWith('+81')) {
    return ALL_LANGUAGES.find((l) => l.code === 'ja') || null;
  }
  if (phone.startsWith('+971') || phone.startsWith('+966')) {
    return ALL_LANGUAGES.find((l) => l.code === 'ar') || null;
  }
  if (phone.startsWith('+55') || phone.startsWith('+351')) {
    return ALL_LANGUAGES.find((l) => l.code === 'pt') || null;
  }
  if (phone.startsWith('+39')) {
    return ALL_LANGUAGES.find((l) => l.code === 'it') || null;
  }

  return null;
}
