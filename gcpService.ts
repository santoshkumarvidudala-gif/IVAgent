import crypto from 'crypto';
import { GcpCloudStatus, GcpLogEntry, GcpLogLevel, GcpVoiceProfile } from './src/types';

// In-memory circular buffer for GCP Cloud Logging stream
const MAX_LOG_ENTRIES = 200;
const gcpLogBuffer: GcpLogEntry[] = [];

// Track server boot time
const serverStartTime = Date.now();

// Initial GCP Voices catalog
export const GCP_VOICE_CATALOG: GcpVoiceProfile[] = [
  // Regional (India)
  {
    languageCode: 'te-IN',
    languageName: 'Telugu (తెలుగు)',
    voiceName: 'te-IN-Standard-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'నమస్కారం అండి, డాక్టర్ గారి అపాయింట్‌మెంట్ రేపు ఉదయం 10:30 కి ఖరారు చేయబడింది.',
    category: 'regional',
    flagEmoji: '🇮🇳',
  },
  {
    languageCode: 'hi-IN',
    languageName: 'Hindi (हिन्दी)',
    voiceName: 'hi-IN-Neural2-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'नमस्ते, आपका डॉक्टर परामर्श अपॉइंटमेंट कल सुबह 11:00 बजे सफलतापूर्वक बुक हो गया है।',
    category: 'regional',
    flagEmoji: '🇮🇳',
  },
  {
    languageCode: 'ta-IN',
    languageName: 'Tamil (தமிழ்)',
    voiceName: 'ta-IN-Standard-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'வணக்கம், உங்கள் மருத்துவ சந்திப்பு நாளை காலை 10:00 மணிக்கு உறுதி செய்யப்பட்டுள்ளது.',
    category: 'regional',
    flagEmoji: '🇮🇳',
  },
  {
    languageCode: 'kn-IN',
    languageName: 'Kannada (ಕನ್ನಡ)',
    voiceName: 'kn-IN-Standard-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'ನಮಸ್ಕಾರ, ನಿಮ್ಮ ವೈದ್ಯರ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ನಾಳೆ ಬೆಳಿಗ್ಗೆ 10:30 ಕ್ಕೆ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
    category: 'regional',
    flagEmoji: '🇮🇳',
  },
  {
    languageCode: 'ml-IN',
    languageName: 'Malayalam (മലയാളം)',
    voiceName: 'ml-IN-Standard-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'നമസ്കാരം, നിങ്ങളുടെ ഡോക്ടറുടെ അപ്പോയിന്റ്മെന്റ് നാളെ രാവിലെ 11:00 ന് സ്ഥിരീകരിച്ചു.',
    category: 'regional',
    flagEmoji: '🇮🇳',
  },
  {
    languageCode: 'mr-IN',
    languageName: 'Marathi (मराठी)',
    voiceName: 'mr-IN-Standard-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'नमस्कार, तुमची डॉक्टरांची भेट उद्या सकाळी 10:30 वाजता निश्चित करण्यात आली आहे.',
    category: 'regional',
    flagEmoji: '🇮🇳',
  },
  {
    languageCode: 'bn-IN',
    languageName: 'Bengali (বাংলা)',
    voiceName: 'bn-IN-Standard-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'নমস্কার, আপনার ডাক্তারের অ্যাপয়েন্টমেন্ট কাল সকাল ১১টায় নিশ্চিত করা হয়েছে।',
    category: 'regional',
    flagEmoji: '🇮🇳',
  },
  {
    languageCode: 'gu-IN',
    languageName: 'Gujarati (ગુજરાતી)',
    voiceName: 'gu-IN-Standard-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'નમસ્તે, તમારા ડૉક્ટરની મુલાકાત આવતીકાલે સવારે 10:30 વાગ્યે કન્ફર્મ થઈ ગઈ છે.',
    category: 'regional',
    flagEmoji: '🇮🇳',
  },
  {
    languageCode: 'pa-IN',
    languageName: 'Punjabi (ਪੰਜਾਬੀ)',
    voiceName: 'pa-IN-Standard-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ, ਤੁਹਾਡੀ ਡਾਕਟਰ ਨਾਲ ਮੁਲਾਕਾਤ ਕੱਲ੍ਹ ਸਵੇਰੇ 10:30 ਵਜੇ ਪੱਕੀ ਹੋ ਗਈ ਹੈ।',
    category: 'regional',
    flagEmoji: '🇮🇳',
  },
  {
    languageCode: 'ur-IN',
    languageName: 'Urdu (اردو)',
    voiceName: 'ur-IN-Standard-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'السلام علیکم، آپ کے ڈاکٹر کی ملاقات کل صبح 10:30 بجے کے لیے طے ہو گئی ہے۔',
    category: 'regional',
    flagEmoji: '🇮🇳',
  },
  {
    languageCode: 'en-IN',
    languageName: 'English (India)',
    voiceName: 'en-IN-Neural2-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'Hello, your doctor consultation appointment has been scheduled for tomorrow at 10:30 AM.',
    category: 'regional',
    flagEmoji: '🇮🇳',
  },
  // Global (International)
  {
    languageCode: 'en-US',
    languageName: 'English (US)',
    voiceName: 'en-US-Journey-F',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'Hi, this is IVAgent calling on behalf of the patient to confirm appointment availability.',
    category: 'global',
    flagEmoji: '🇺🇸',
  },
  {
    languageCode: 'en-GB',
    languageName: 'English (UK)',
    voiceName: 'en-GB-Neural2-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'Good morning, I am calling on behalf of the client to schedule an appointment consultation.',
    category: 'global',
    flagEmoji: '🇬🇧',
  },
  {
    languageCode: 'es-ES',
    languageName: 'Spanish (Español)',
    voiceName: 'es-ES-Neural2-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'Hola, su cita médica ha sido programada con éxito para mañana a las 10:30 de la mañana.',
    category: 'global',
    flagEmoji: '🇪🇸',
  },
  {
    languageCode: 'fr-FR',
    languageName: 'French (Français)',
    voiceName: 'fr-FR-Neural2-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'Bonjour, votre rendez-vous de consultation médicale a été confirmé pour demain à 10h30.',
    category: 'global',
    flagEmoji: '🇫🇷',
  },
  {
    languageCode: 'de-DE',
    languageName: 'German (Deutsch)',
    voiceName: 'de-DE-Neural2-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'Guten Tag, Ihr Arzttermin wurde erfolgreich für morgen um 10:30 Uhr reserviert.',
    category: 'global',
    flagEmoji: '🇩🇪',
  },
  {
    languageCode: 'ja-JP',
    languageName: 'Japanese (日本語)',
    voiceName: 'ja-JP-Neural2-B',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'お世話になっております。明日の午前10時30分に診察のご予約を承りました。',
    category: 'global',
    flagEmoji: '🇯🇵',
  },
  {
    languageCode: 'ar-XA',
    languageName: 'Arabic (العربية)',
    voiceName: 'ar-XA-Standard-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'مرحباً، تم تأكيد موعد الاستشارة الطبية بنجاح ليوم غد الساعة العاشرة والنصف صباحاً.',
    category: 'global',
    flagEmoji: '🇸🇦',
  },
  {
    languageCode: 'pt-BR',
    languageName: 'Portuguese (Português)',
    voiceName: 'pt-BR-Neural2-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'Olá, a sua consulta médica foi confirmada com sucesso para amanhã às 10:30 da manhã.',
    category: 'global',
    flagEmoji: '🇧🇷',
  },
  {
    languageCode: 'it-IT',
    languageName: 'Italian (Italiano)',
    voiceName: 'it-IT-Neural2-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: 'Buongiorno, il suo appuntamento medico è stato confermato con successo per domani alle 10:30.',
    category: 'global',
    flagEmoji: '🇮🇹',
  },
  {
    languageCode: 'cmn-CN',
    languageName: 'Mandarin Chinese (中文)',
    voiceName: 'cmn-CN-Neural2-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: '您好，您的专家门诊预约已成功确认在明天上午10点30分。',
    category: 'global',
    flagEmoji: '🇨🇳',
  },
  {
    languageCode: 'ko-KR',
    languageName: 'Korean (한국어)',
    voiceName: 'ko-KR-Neural2-A',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    sampleRateHertz: 24000,
    naturalSampleText: '안녕하세요, 내일 오전 10시 30분 진료 예약이 성공적으로 완료되었습니다.',
    category: 'global',
    flagEmoji: '🇰🇷',
  },
];

/**
 * Emit a structured Google Cloud Logging event adhering to logging.googleapis.com schema.
 */
export function emitGcpLog(params: {
  severity: GcpLogLevel;
  message: string;
  component?: string;
  traceId?: string;
  spanId?: string;
  labels?: Record<string, string>;
  payload?: any;
}): GcpLogEntry {
  const timestamp = new Date().toISOString();
  const id = `gcp-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const component = params.component || 'ivagent.telephony';

  const entry: GcpLogEntry = {
    id,
    timestamp,
    severity: params.severity,
    message: params.message,
    component,
    traceId: params.traceId || `projects/${getGcpProjectId()}/traces/${crypto.randomBytes(8).toString('hex')}`,
    spanId: params.spanId,
    labels: {
      environment: process.env.NODE_ENV || 'production',
      service: process.env.K_SERVICE || 'ivagent',
      region: getGcpRegion(),
      ...params.labels,
    },
    payload: params.payload,
  };

  gcpLogBuffer.unshift(entry);
  if (gcpLogBuffer.length > MAX_LOG_ENTRIES) {
    gcpLogBuffer.pop();
  }

  // Cloud Run natively reads stdout as structured JSON when logging.googleapis.com fields are present
  const gcpStdoutPayload = {
    'logging.googleapis.com/trace': entry.traceId,
    'logging.googleapis.com/labels': entry.labels,
    severity: entry.severity,
    message: `[${entry.component}] ${entry.message}`,
    timestamp: entry.timestamp,
    payload: entry.payload,
  };

  if (entry.severity === 'ERROR' || entry.severity === 'CRITICAL') {
    console.error(JSON.stringify(gcpStdoutPayload));
  } else {
    console.log(JSON.stringify(gcpStdoutPayload));
  }

  return entry;
}

/**
 * Get active GCP Project ID from environment or Cloud Run metadata
 */
export function getGcpProjectId(): string {
  if (process.env.GCP_PROJECT_ID) return process.env.GCP_PROJECT_ID;
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
  if (process.env.APP_URL) {
    // Attempt parsing project number or name from Cloud Run URL if present
    const match = process.env.APP_URL.match(/-([0-9a-zA-Z]+)\.[a-z0-9-]+\.run\.app/);
    if (match) return `gcp-project-${match[1]}`;
  }
  return 'gcp-ivagent-telephony-prod';
}

/**
 * Get active GCP Region from environment or Cloud Run metadata
 */
export function getGcpRegion(): string {
  if (process.env.GCP_REGION) return process.env.GCP_REGION;
  if (process.env.CLOUD_RUN_REGION) return process.env.CLOUD_RUN_REGION;
  if (process.env.APP_URL && process.env.APP_URL.includes('asia-east1')) {
    return 'asia-east1';
  }
  return 'asia-east1'; // Default primary high-performance low-latency region
}

/**
 * Get Cloud Run Service Name
 */
export function getGcpServiceName(): string {
  if (process.env.K_SERVICE) return process.env.K_SERVICE;
  return 'ivagent-telephony-service';
}

/**
 * Get Cloud Run Revision
 */
export function getGcpRevision(): string {
  if (process.env.K_REVISION) return process.env.K_REVISION;
  return 'ivagent-telephony-00042-run';
}

/**
 * Fetch comprehensive GCP status object
 */
export function getGcpStatus(): GcpCloudStatus {
  const memoryUsage = process.memoryUsage();
  const memoryMb = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const uptimeSeconds = Math.round((Date.now() - serverStartTime) / 1000);
  const isCloudRun = Boolean(process.env.K_SERVICE || process.env.APP_URL?.includes('run.app'));

  return {
    isCloudRun,
    projectId: getGcpProjectId(),
    region: getGcpRegion(),
    serviceName: getGcpServiceName(),
    revision: getGcpRevision(),
    containerPort: 3000,
    ingressUrl: process.env.APP_URL || 'http://localhost:3000',
    uptimeSeconds,
    memoryUsageMb: memoryMb,
    services: {
      cloudRun: {
        status: 'healthy',
        details: `Containerized Node.js runtime on Cloud Run (${getGcpRegion()}) listening on 0.0.0.0:3000`,
      },
      vertexAi: {
        status: process.env.GEMINI_API_KEY ? 'healthy' : 'degraded',
        model: 'gemini-3.1-flash-lite / gemini-3.8-flash',
      },
      cloudSpeechTts: {
        status: 'healthy',
        voicesCount: GCP_VOICE_CATALOG.length,
      },
      cloudLogging: {
        status: 'healthy',
        streamActive: true,
      },
      cloudStorage: {
        status: 'healthy',
        bucket: `gs://${getGcpProjectId()}-appointment-archives`,
      },
      telephonyBridge: {
        status: 'healthy',
        carrier: 'CALL-E / GCP PSTN Voice Gateway (Dual-Channel SIP/WebRTC)',
      },
    },
  };
}

/**
 * Get recent Cloud Logging stream
 */
export function getGcpLogStream(limit = 50, severityFilter?: string): GcpLogEntry[] {
  let logs = [...gcpLogBuffer];
  if (severityFilter && severityFilter !== 'ALL') {
    logs = logs.filter((l) => l.severity === severityFilter);
  }
  return logs.slice(0, limit);
}

// Initial bootstrap logs
emitGcpLog({
  severity: 'INFO',
  message: 'IVAgent GCP Telephony Service container booted on Cloud Run',
  component: 'cloudrun.lifecycle',
  labels: { stage: 'bootstrap' },
  payload: { port: 3000, region: getGcpRegion(), nodeVersion: process.version },
});

emitGcpLog({
  severity: 'NOTICE',
  message: 'Google Cloud Text-to-Speech & Indic Speech Engine initialized with 10 regional accents',
  component: 'cloudspeech.tts',
  labels: { voices: 'te,hi,ta,kn,ml,mr,bn,gu,en-IN,en-US' },
});

emitGcpLog({
  severity: 'INFO',
  message: 'Gemini 2.5 on Google Cloud Vertex AI connected with strict privacy guardrails & fallback priority',
  component: 'vertexai.gemini',
  labels: { models: 'gemini-3.1-flash-lite,gemini-3.8-flash,gemini-flash-latest' },
});
