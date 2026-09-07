import React, { useState, useEffect } from 'react';
import { ConfirmationDetails, EnquiryBrief, StructuredCallReport, AvailableSlot } from '../types';
import {
  MessageSquare,
  Mail,
  Send,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Calendar,
  Clock,
  MapPin,
  FileText,
  RefreshCw,
  Volume2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  User,
  CalendarPlus,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { generateIcsFile, createGoogleCalendarUrl } from '../utils/calendar';

interface ConfirmationDispatchProps {
  brief: EnquiryBrief;
  report: StructuredCallReport;
  onConfirmationUpdated?: (confirmation: ConfirmationDetails) => void;
  autoPromptVoice?: boolean;
}

export const ConfirmationDispatch: React.FC<ConfirmationDispatchProps> = ({
  brief,
  report,
  onConfirmationUpdated,
  autoPromptVoice = false,
}) => {
  const primarySlot = report.bookedSlot || report.availableSlots.find((s) => s.isBestMatch) || report.availableSlots[0];

  const [method, setMethod] = useState<'sms' | 'email' | 'both'>('both');
  const [recipientPhone, setRecipientPhone] = useState(brief.user.phone || '+1 (555) 892-1049');
  const [recipientEmail, setRecipientEmail] = useState(brief.user.email || 'santoshkumar.vidudala@gmail.com');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationDetails | null>(report.confirmation || null);
  const [activePreviewTab, setActivePreviewTab] = useState<'sms' | 'email'>('sms');
  const [copiedText, setCopiedText] = useState(false);
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);

  const agentPromptText =
    "I've successfully locked in your appointment! Would you like me to dispatch your confirmation details with the date, time, location, and preparation instructions via SMS, Email, or both?";

  // Speak prompt if requested
  const handleSpeakPrompt = () => {
    setIsSpeakingPrompt(true);
    soundEngine.speakText(agentPromptText, 'agent');
    setTimeout(() => setIsSpeakingPrompt(false), 5000);
  };

  useEffect(() => {
    if (autoPromptVoice && !confirmation) {
      handleSpeakPrompt();
    }
  }, [autoPromptVoice]);

  // Send Confirmation Handler
  const handleSendConfirmation = async () => {
    try {
      setIsSending(true);
      soundEngine.playDtmfTone(852, 1477, 0.1);

      const res = await fetch('/api/confirmation/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          report,
          slot: primarySlot,
          method,
          recipientPhone,
          recipientEmail,
          customNotes: customNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.confirmation) {
        setConfirmation(data.confirmation);
        if (onConfirmationUpdated) {
          onConfirmationUpdated(data.confirmation);
        }
        soundEngine.playConnectChime();
      }
    } catch (err) {
      console.error('Failed to send confirmation:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopySms = () => {
    if (confirmation?.smsMessage) {
      navigator.clipboard.writeText(confirmation.smsMessage);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <div id="confirmation-dispatch-module" className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 overflow-hidden text-zinc-100 shadow-sm">
      {/* Module Header */}
      <div className="bg-zinc-900/80 px-6 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold">
            <Send className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              Automated Notification Engine
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Appointment Confirmation Delivery
            </h3>
          </div>
        </div>

        {confirmation && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Dispatched via {confirmation.method.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Agent Inquiry Prompt Speech Bubble */}
        <div className="bg-zinc-950/70 rounded-xl border border-indigo-500/30 p-4 sm:p-5 relative">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Agent Dispatch Message
                </span>
                <button
                  onClick={handleSpeakPrompt}
                  type="button"
                  className="text-xs text-zinc-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-medium">Listen Agent</span>
                </button>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                "{agentPromptText}"
              </p>
            </div>
          </div>
        </div>

        {/* If Confirmation Not Yet Sent: Selection Form */}
        {!confirmation ? (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">
                Select Preferred Dispatch Method <span className="text-indigo-400">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* SMS Option */}
                <button
                  type="button"
                  onClick={() => setMethod('sms')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    method === 'sms'
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/30'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                    </div>
                    {method === 'sms' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">SMS Message</div>
                    <div className="text-xs text-zinc-400 mt-0.5 font-mono">{recipientPhone}</div>
                    <div className="text-[11px] font-medium text-indigo-400 mt-2">
                      Direct Mobile SMS
                    </div>
                  </div>
                </button>

                {/* Email Option */}
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    method === 'email'
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/30'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-indigo-400" />
                    </div>
                    {method === 'email' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Email Receipt</div>
                    <div className="text-xs text-zinc-400 mt-0.5 font-mono truncate max-w-[190px]">
                      {recipientEmail}
                    </div>
                    <div className="text-[11px] font-medium text-indigo-400 mt-2">
                      Rich HTML Summary
                    </div>
                  </div>
                </button>

                {/* Both Option */}
                <button
                  type="button"
                  onClick={() => setMethod('both')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    method === 'both'
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/30'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    {method === 'both' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <span>SMS & Email</span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5 font-mono">Dual Dispatch</div>
                    <div className="text-[11px] font-medium text-indigo-400 mt-2">
                      Recommended
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recipient Details & Custom Note */}
            <div className="bg-zinc-950/70 rounded-xl border border-zinc-800 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Target Delivery Endpoints
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingContact(!isEditingContact)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  {isEditingContact ? 'Done Editing' : 'Edit Endpoints'}
                </button>
              </div>

              {isEditingContact ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Recipient Mobile Phone (SMS)
                    </label>
                    <input
                      type="text"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Recipient Email (HTML Receipt)
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{recipientPhone}</span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{recipientEmail}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Specific Dispatch Note / Reminder (Optional)
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g., Remember to bring parking ticket for validation"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-indigo-500 outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Send Action Button */}
            <button
              id="btn-dispatch-confirmation"
              type="button"
              onClick={handleSendConfirmation}
              disabled={isSending}
              className="w-full py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 text-white animate-spin" />
                  <span>Transmitting Confirmation...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>Send Confirmation ({method.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* If Confirmation Has Been Sent: Show Interactive Delivery Preview */
          <div className="space-y-6">
            {/* Delivery Success Bar */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-white">
                    Confirmation Successfully Transmitted
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    Code: <span className="text-emerald-400 font-bold">{confirmation.confirmationCode}</span> • Status: Delivered • {new Date(confirmation.sentAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const slotToUse = primarySlot || {
                      id: 'confirmed-slot',
                      date: confirmation.date,
                      time: confirmation.time,
                      practitionerOrStaff: confirmation.doctorOrStaff,
                      isBestMatch: true,
                    };
                    generateIcsFile(slotToUse, report.businessName, brief.serviceNeeded, report, brief);
                    soundEngine.playConnectChime();
                    try {
                      const gcalUrl = createGoogleCalendarUrl(
                        slotToUse,
                        report.businessName,
                        brief.serviceNeeded,
                        brief.user.notesForReceptionist,
                        brief.business.address
                      );
                      window.open(gcalUrl, '_blank', 'noopener,noreferrer');
                    } catch {}
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Add to Google Calendar & download ICS appointment file"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-white" />
                  <span>Add to Google Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-indigo-400" />
                  <span>Resend / Edit</span>
                </button>
              </div>
            </div>

            {/* Appointment Details Highlight Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-950/70 rounded-xl border border-zinc-800 p-4 text-xs">
              <div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">Date & Time</div>
                <div className="text-white font-bold mt-1 text-sm">{confirmation.date} at {confirmation.time}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">Location</div>
                <div className="text-zinc-200 font-medium mt-1 truncate" title={confirmation.location}>
                  {confirmation.location}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">Provider / Staff</div>
                <div className="text-zinc-200 font-medium mt-1">{confirmation.doctorOrStaff || 'Specialist'}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">Service</div>
                <div className="text-zinc-200 font-medium mt-1 truncate" title={confirmation.service}>
                  {confirmation.service}
                </div>
              </div>
            </div>

            {/* Instructions Accordion / Checklist */}
            <div className="bg-zinc-950/70 rounded-xl border border-zinc-800 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Instructions Included in Confirmation</span>
              </h4>
              <ul className="space-y-1.5 pl-1 text-xs text-zinc-300">
                {confirmation.specificInstructions.map((ins, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">✓</span>
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preview Tabs (SMS vs Email) */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden">
              <div className="flex border-b border-zinc-800 bg-zinc-900/80 px-3">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('sms')}
                  className={`py-3 px-4 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activePreviewTab === 'sms'
                      ? 'border-indigo-500 text-indigo-400 bg-zinc-950/50'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Delivered SMS Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab('email')}
                  className={`py-3 px-4 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activePreviewTab === 'email'
                      ? 'border-indigo-500 text-indigo-400 bg-zinc-950/50'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Delivered Email Receipt</span>
                </button>
              </div>

              {/* SMS Tab Content */}
              {activePreviewTab === 'sms' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-zinc-400">
                      SMS Sent to: <strong className="text-zinc-200 font-mono">{confirmation.recipientPhone}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySms}
                      className="text-xs text-zinc-300 hover:text-indigo-400 flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText ? 'Copied' : 'Copy SMS'}</span>
                    </button>
                  </div>

                  {/* Smartphone Message Bubble Mockup */}
                  <div className="max-w-md mx-auto bg-zinc-900 rounded-2xl border border-zinc-800 p-4 shadow-md">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800 text-[10px] text-zinc-400">
                      <span>SMS / iMessage</span>
                      <span className="text-emerald-400 font-medium">✓✓ Delivered</span>
                    </div>

                    <div className="bg-zinc-800 text-zinc-100 rounded-xl p-3.5 text-xs font-mono whitespace-pre-wrap leading-relaxed border-l-2 border-indigo-500">
                      {confirmation.smsMessage}
                    </div>

                    <div className="text-[10px] text-zinc-500 text-right mt-2">
                      Delivered • {new Date(confirmation.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}

              {/* Email Tab Content */}
              {activePreviewTab === 'email' && (
                <div className="p-6">
                  <div className="mb-3 text-xs text-zinc-400">
                    Subject: <strong className="text-zinc-200">{confirmation.emailSubject}</strong>
                    <br />
                    To: <strong className="text-zinc-200 font-mono">{confirmation.recipientEmail}</strong>
                  </div>

                  {/* Rendered HTML Email Preview */}
                  <div
                    className="border border-zinc-800 rounded-xl bg-zinc-950 p-3 overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: confirmation.emailHtml }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
