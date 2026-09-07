import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  FileText,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  DataGuardrailsConfig,
  getGuardrailsConfig,
  saveGuardrailsConfig,
  DEFAULT_GUARDRAILS,
} from '../utils/guardrails';

interface GuardrailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuardrailsModal: React.FC<GuardrailsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<DataGuardrailsConfig>(DEFAULT_GUARDRAILS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getGuardrailsConfig());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof DataGuardrailsConfig) => {
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    saveGuardrailsConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_GUARDRAILS);
    saveGuardrailsConfig(DEFAULT_GUARDRAILS);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-100 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Data Protection & Privacy Guardrails
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold uppercase">
                  Active
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Autonomous voice synthesis filters • Redaction policies • PII defenses
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Banner */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3.5">
            <Lock className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-zinc-300 space-y-1">
              <p className="font-bold text-white uppercase tracking-wider text-[11px]">
                Strict Data Isolation & Caller Security Protocol
              </p>
              <p className="text-zinc-400 leading-relaxed text-xs">
                All voice simulation dialogues, TwiML telephony loops, and AI turn generators strictly adhere to zero-trust PII redaction. No unencrypted financial information or national IDs will ever be articulated over voice audio lines.
              </p>
            </div>
          </div>

          {/* Guardrails Control Checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>Voice Channel Protection Policies</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Policy 1 */}
              <div
                onClick={() => handleToggle('blockPaymentDetailsOverVoice')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  config.blockPaymentDetailsOverVoice
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase text-white">
                      Block Payment Details
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.blockPaymentDetailsOverVoice}
                    onChange={() => {}}
                    className="accent-indigo-600 rounded w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Strictly prohibits the AI agent from verbalizing credit card numbers or CVVs. If requested, insists on a secure digital invoice link.
                </p>
              </div>

              {/* Policy 2 */}
              <div
                onClick={() => handleToggle('maskCreditCards')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  config.maskCreditCards
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase text-white">
                      Automated Card Redaction
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.maskCreditCards}
                    onChange={() => {}}
                    className="accent-indigo-600 rounded w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Automatically sanitizes 13-19 digit number sequences from transcripts and live audio logs, converting to <span className="font-mono text-zinc-300">[PROTECTED_CARD]</span>.
                </p>
              </div>

              {/* Policy 3 */}
              <div
                onClick={() => handleToggle('maskSsnAndGovernmentId')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  config.maskSsnAndGovernmentId
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase text-white">
                      SSN & Government ID Defense
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.maskSsnAndGovernmentId}
                    onChange={() => {}}
                    className="accent-indigo-600 rounded w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Guards against full Social Security, tax, or passport disclosure. Substitutes identifiers with masked tokens.
                </p>
              </div>

              {/* Policy 4 */}
              <div
                onClick={() => handleToggle('enforceMinimalCallerDisclosure')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  config.enforceMinimalCallerDisclosure
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase text-white">
                      Minimal Necessary Disclosure
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enforceMinimalCallerDisclosure}
                    onChange={() => {}}
                    className="accent-indigo-600 rounded w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Limits personal information disclosures strictly to what the target receptionist requests to confirm schedule slots.
                </p>
              </div>

              {/* Policy 5 */}
              <div
                onClick={() => handleToggle('stripHipaaSensitiveNotes')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  config.stripHipaaSensitiveNotes
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase text-white">
                      HIPAA / Medical Confidentiality
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.stripHipaaSensitiveNotes}
                    onChange={() => {}}
                    className="accent-indigo-600 rounded w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Confines clinical questions to appointment scheduling and insurance acceptance without transmitting unneeded diagnosis logs.
                </p>
              </div>

              {/* Policy 6 */}
              <div
                onClick={() => handleToggle('prohibitRecordingConsentCheck')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  config.prohibitRecordingConsentCheck
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase text-white">
                      AI Agent Self-Identification
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.prohibitRecordingConsentCheck}
                    onChange={() => {}}
                    className="accent-indigo-600 rounded w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Requires the agent to transparently announce itself as an AI assistant placing the call on behalf of the named client.
                </p>
              </div>
            </div>
          </div>

          {/* Redaction Testing Sandbox */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real-Time Redaction Pattern Verification</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400">
                <span className="text-[10px] text-zinc-500 block mb-1 uppercase font-semibold">Incoming Raw Input</span>
                <p className="text-rose-400">"Hold with Visa 4111 2222 3333 4444 and SSN 123-45-6789"</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400">
                <span className="text-[10px] text-emerald-400 block mb-1 uppercase font-semibold">Sanitized Voice Output</span>
                <p className="text-emerald-400">"Hold with Visa [PROTECTED_CARD_••••] and SSN [PROTECTED_SSN_••••]"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Guardrail Policies Updated
              </span>
            ) : (
              <button
                onClick={handleResetDefaults}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer uppercase font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
          >
            Apply Guardrails
          </button>
        </div>
      </div>
    </div>
  );
};
