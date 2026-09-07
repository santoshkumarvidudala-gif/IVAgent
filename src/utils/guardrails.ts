// Privacy Guardrails and Data Protection Configuration

export interface DataGuardrailsConfig {
  maskCreditCards: boolean;
  maskSsnAndGovernmentId: boolean;
  maskDobUnlessNecessary: boolean;
  blockPaymentDetailsOverVoice: boolean;
  prohibitRecordingConsentCheck: boolean;
  enforceMinimalCallerDisclosure: boolean; // Only reveal what is necessary for the booking
  anonymizeLogsAfterExport: boolean;
  stripHipaaSensitiveNotes: boolean;
}

export const DEFAULT_GUARDRAILS: DataGuardrailsConfig = {
  maskCreditCards: true,
  maskSsnAndGovernmentId: true,
  maskDobUnlessNecessary: true,
  blockPaymentDetailsOverVoice: true,
  prohibitRecordingConsentCheck: true,
  enforceMinimalCallerDisclosure: true,
  anonymizeLogsAfterExport: false,
  stripHipaaSensitiveNotes: true,
};

const STORAGE_KEY = 'appointment_call_agent_guardrails_v1';

export function getGuardrailsConfig(): DataGuardrailsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GUARDRAILS;
    return { ...DEFAULT_GUARDRAILS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GUARDRAILS;
  }
}

export function saveGuardrailsConfig(config: DataGuardrailsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save guardrails:', err);
  }
}

/**
 * Redacts credit cards, SSNs, financial IDs, CVVs, and sensitive PII from transcripts
 */
export function sanitizeTranscriptText(text: string): { sanitized: string; redactedCount: number } {
  let redactedCount = 0;
  let sanitized = text;

  // Credit Card Numbers (13-19 digits, possibly hyphen or space separated)
  const ccRegex = /\b(?:\d{4}[ -]?){3}\d{4}\b|\b(?:\d{4}[ -]?){3}\d{1,4}\b/g;
  sanitized = sanitized.replace(ccRegex, (match) => {
    redactedCount++;
    return '[REDACTED_PAYMENT_CARD_••••]';
  });

  // SSN (3-2-4 format or 9 digits grouped)
  const ssnRegex = /\b\d{3}[ -]\d{2}[ -]\d{4}\b/g;
  sanitized = sanitized.replace(ssnRegex, () => {
    redactedCount++;
    return '[REDACTED_SSN_•••-••-••••]';
  });

  // CVV / CVC codes (e.g. "cvv is 342" or "cvv 1234")
  const cvvRegex = /\b(?:cvv|cvc|security code|card code)[\s:]*([0-9]{3,4})\b/gi;
  sanitized = sanitized.replace(cvvRegex, (match) => {
    redactedCount++;
    return '[REDACTED_CVV_•••]';
  });

  // Full DOB patterns e.g. "DOB is 05/14/1988" -> "DOB is [PROTECTED_DOB]"
  const dobRegex = /\b(?:date of birth|dob|born on)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})\b/gi;
  sanitized = sanitized.replace(dobRegex, (match, p1) => {
    redactedCount++;
    return `Date of Birth: [PROTECTED_DOB_YEAR_ONLY: ${p1.split(/[\/\-\.]/).pop()}]`;
  });

  return { sanitized, redactedCount };
}

/**
 * Inspects a message before sending to telephony voice stream to block unauthorized financial transmission
 */
export function auditAgentUtterance(text: string): { safe: boolean; reason?: string; auditedText: string } {
  const { sanitized, redactedCount } = sanitizeTranscriptText(text);

  // Check for raw credit card reading attempts
  if (/\b(?:card number|credit card|cvv|expiry date|routing number)\b/i.test(text) && /\d{4}/.test(text)) {
    return {
      safe: false,
      reason: 'Agent blocked from reciting payment card information over unencrypted voice channel.',
      auditedText: sanitized,
    };
  }

  return {
    safe: true,
    auditedText: sanitized,
  };
}
