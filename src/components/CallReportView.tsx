import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StructuredCallReport, CallTurn, EnquiryBrief, ConfirmationDetails, AvailableSlot, AgentCallRating } from '../types';
import {
  CheckCircle2,
  Calendar,
  Clock,
  UserCheck,
  Building2,
  FileText,
  AlertTriangle,
  Download,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Volume2,
  CalendarPlus,
  CalendarClock,
  ShieldCheck,
  PhoneCall,
  Sparkles,
  Star,
  Award,
  MessageSquare,
} from 'lucide-react';
import { createGoogleCalendarUrl, generateIcsFile, generateSmsSummary } from '../utils/calendar';
import { soundEngine } from '../utils/audio';
import { ConfirmationDispatch } from './ConfirmationDispatch';
import { sanitizeTranscriptText } from '../utils/guardrails';

interface CallReportViewProps {
  report: StructuredCallReport;
  turns: CallTurn[];
  brief: EnquiryBrief;
  onNewEnquiry: () => void;
  onReschedule?: (brief: EnquiryBrief, report: StructuredCallReport) => void;
  onUpdateReport?: (updatedReport: StructuredCallReport) => void;
}

// Animation variants for smooth entrance and cascading children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const badgePopVariants = {
  hidden: { opacity: 0, scale: 0.82 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 22,
      delay: 0.15,
    },
  },
};

const cardHighlightVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const ACCURACY_DESCRIPTIONS: Record<number, string> = {
  1: '1 - Inaccurate (Missed critical details or wrong date/service)',
  2: '2 - Fair (Understood basic request but missed key details)',
  3: '3 - Good (Accurately conveyed primary request and timing)',
  4: '4 - Very Good (High precision across appointment and preferences)',
  5: '5 - Flawless (100% accurate on details, constraints & clinic policies)',
};

const PERFORMANCE_DESCRIPTIONS: Record<number, string> = {
  1: '1 - Ineffective (Robotic, repetitive, or confusing responses)',
  2: '2 - Stiff (Awkward pauses or hesitated during dialogue)',
  3: '3 - Good (Handled standard receptionist negotiation smoothly)',
  4: '4 - Smooth (Articulate, polite, and handled questions well)',
  5: '5 - Exceptional (Human-grade tone, natural dialect & negotiation)',
};

const QUICK_FEEDBACK_TAGS = [
  'Accurate Slot',
  'Natural Flow',
  'Polite & Courteous',
  'Handled Objections',
  'Clear Dialect',
  'Fast & Efficient',
  'Captured Clinic Policies',
  'Understood Accent',
];

interface StarRowProps {
  idPrefix: string;
  label: string;
  sublabel: string;
  value: number;
  hoverValue: number | null;
  onHover: (val: number | null) => void;
  onChange: (val: number) => void;
  descriptions: Record<number, string>;
}

const StarRow: React.FC<StarRowProps> = ({
  idPrefix,
  label,
  sublabel,
  value,
  hoverValue,
  onHover,
  onChange,
  descriptions,
}) => {
  const activeRating = hoverValue || value;

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <span className="text-xs font-semibold text-zinc-200">{label}</span>
          <p className="text-[11px] text-zinc-400">{sublabel}</p>
        </div>
        <span className="text-[11px] font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 self-start sm:self-auto">
          {descriptions[activeRating] || `${activeRating} / 5 Stars`}
        </span>
      </div>

      <div className="flex items-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating;
          return (
            <button
              key={star}
              id={`${idPrefix}-star-${star}`}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => onHover(star)}
              onMouseLeave={() => onHover(null)}
              className="p-1.5 rounded-lg hover:bg-zinc-800 transition-transform active:scale-90 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400/50"
              title={`Rate ${star} out of 5`}
            >
              <Star
                className={`w-6 h-6 transition-all duration-150 ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const CallReportView: React.FC<CallReportViewProps> = ({
  report,
  turns,
  brief,
  onNewEnquiry,
  onReschedule,
  onUpdateReport,
}) => {
  const [copied, setCopied] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [currentReport, setCurrentReport] = useState<StructuredCallReport>(report);
  const [calendarToast, setCalendarToast] = useState<string | null>(null);

  // Rating and feedback state
  const [rating, setRating] = useState<AgentCallRating | null>(() => {
    if (report.rating) return report.rating;
    try {
      const cached = localStorage.getItem(`call_rating_${report.enquiryId}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });

  const [accuracyScore, setAccuracyScore] = useState<number>(() => {
    if (report.rating?.accuracyRating) return report.rating.accuracyRating;
    try {
      const cached = localStorage.getItem(`call_rating_${report.enquiryId}`);
      if (cached) return JSON.parse(cached).accuracyRating || 5;
    } catch {}
    return 5;
  });

  const [performanceScore, setPerformanceScore] = useState<number>(() => {
    if (report.rating?.performanceRating) return report.rating.performanceRating;
    try {
      const cached = localStorage.getItem(`call_rating_${report.enquiryId}`);
      if (cached) return JSON.parse(cached).performanceRating || 5;
    } catch {}
    return 5;
  });

  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (report.rating?.tags) return report.rating.tags;
    try {
      const cached = localStorage.getItem(`call_rating_${report.enquiryId}`);
      if (cached) return JSON.parse(cached).tags || ['Accurate Slot', 'Natural Flow'];
    } catch {}
    return ['Accurate Slot', 'Natural Flow'];
  });

  const [feedbackComment, setFeedbackComment] = useState<string>(() => {
    if (report.rating?.feedbackComment) return report.rating.feedbackComment;
    try {
      const cached = localStorage.getItem(`call_rating_${report.enquiryId}`);
      if (cached) return JSON.parse(cached).feedbackComment || '';
    } catch {}
    return '';
  });

  const [isEditingRating, setIsEditingRating] = useState<boolean>(() => {
    if (report.rating) return false;
    try {
      const cached = localStorage.getItem(`call_rating_${report.enquiryId}`);
      if (cached) return false;
    } catch {}
    return true;
  });

  const [hoverAccuracy, setHoverAccuracy] = useState<number | null>(null);
  const [hoverPerformance, setHoverPerformance] = useState<number | null>(null);

  const handleSaveFeedback = () => {
    const newRating: AgentCallRating = {
      accuracyRating: accuracyScore,
      performanceRating: performanceScore,
      tags: selectedTags,
      feedbackComment: feedbackComment.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };

    setRating(newRating);
    setIsEditingRating(false);

    try {
      localStorage.setItem(`call_rating_${currentReport.enquiryId}`, JSON.stringify(newRating));
    } catch {}

    const updated = { ...currentReport, rating: newRating };
    setCurrentReport(updated);
    if (onUpdateReport) {
      onUpdateReport(updated);
    }

    soundEngine.playConnectChime();
    setCalendarToast('Agent feedback & star rating saved!');
    setTimeout(() => setCalendarToast(null), 3000);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    soundEngine.playBlip();
  };

  const handleConfirmationUpdated = (conf: ConfirmationDetails) => {
    const updated = { ...currentReport, confirmation: conf };
    setCurrentReport(updated);
    if (onUpdateReport) {
      onUpdateReport(updated);
    }
  };

  const handleTriggerReschedule = () => {
    soundEngine.playBlip();
    if (onReschedule) {
      onReschedule(brief, currentReport);
    } else {
      onNewEnquiry();
    }
  };

  const primarySlot = currentReport.bookedSlot || currentReport.availableSlots.find((s) => s.isBestMatch) || currentReport.availableSlots[0];

  const bookedSlot: AvailableSlot | undefined =
    currentReport.bookedSlot ||
    (currentReport.confirmation?.date && currentReport.confirmation?.time
      ? {
          id: 'booked-confirmed-slot',
          date: currentReport.confirmation.date,
          time: currentReport.confirmation.time,
          practitionerOrStaff: currentReport.confirmation.doctorOrStaff,
          isBestMatch: true,
        }
      : currentReport.availableSlots.find((s) => s.isBestMatch) || currentReport.availableSlots[0]);

  const targetSlotForCalendar = bookedSlot || primarySlot;

  const handleCopySummary = () => {
    const text = generateSmsSummary(currentReport);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToGoogleCalendar = () => {
    const slotToUse = targetSlotForCalendar;
    if (!slotToUse) return;

    // Generates an ICS file download for the booked appointment
    generateIcsFile(slotToUse, currentReport.businessName, brief.serviceNeeded, currentReport, brief);
    soundEngine.playConnectChime();
    setCalendarToast('ICS file downloaded for Google Calendar');
    setTimeout(() => setCalendarToast(null), 3500);

    // Also attempt opening Google Calendar web template in new tab
    try {
      const gcalUrl = createGoogleCalendarUrl(
        slotToUse,
        currentReport.businessName,
        brief.serviceNeeded,
        brief.user.notesForReceptionist,
        brief.business.address
      );
      window.open(gcalUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Fallback if browser blocks popups inside iframe
    }
  };

  const handleDownloadIcs = () => {
    if (targetSlotForCalendar) {
      generateIcsFile(targetSlotForCalendar, currentReport.businessName, brief.serviceNeeded, currentReport, brief);
      soundEngine.playBlip();
      setCalendarToast('iCal (.ics) downloaded');
      setTimeout(() => setCalendarToast(null), 3000);
    }
  };

  const getOutcomeBadge = () => {
    switch (currentReport.callOutcome) {
      case 'appointment_booked':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Confirmed & Booked
          </span>
        );
      case 'tentative_hold':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            Tentative Slot Held
          </span>
        );
      case 'slots_found':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-[0_0_12px_rgba(99,102,241,0.15)]">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            Openings Found ({currentReport.availableSlots.length})
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
            No Desired Openings
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Follow-Up Action Needed
          </span>
        );
    }
  };

  return (
    <motion.div
      id="call-report-root"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-6 pb-24 text-zinc-100"
    >
      {/* Header Outcome Banner */}
      <motion.div variants={itemVariants} className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
              Dispatch Outcome Summary
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Call Engagement Report
              </h1>
              <motion.div variants={badgePopVariants}>{getOutcomeBadge()}</motion.div>
              {rating && (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('card-agent-star-rating-feedback');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors cursor-pointer"
                  title="Click to view or edit agent performance rating"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{((rating.accuracyRating + rating.performanceRating) / 2).toFixed(1)} / 5 Rated</span>
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-200">{currentReport.businessName}</span>
              <span>•</span>
              <span className="font-mono">Duration: {Math.floor(currentReport.durationSeconds / 60)}m {currentReport.durationSeconds % 60}s</span>
              <span>•</span>
              <span>{currentReport.callDate || new Date().toLocaleDateString()}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {targetSlotForCalendar && (
              <button
                id="btn-add-to-google-calendar-top"
                onClick={handleAddToGoogleCalendar}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                title="Add to Google Calendar & download ICS appointment file"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-white" />
                <span>Add to Google Calendar</span>
              </button>
            )}
            <button
              id="btn-copy-report-summary"
              onClick={handleCopySummary}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              id="btn-reschedule-appointment"
              onClick={handleTriggerReschedule}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Pre-populate enquiry with previous details to negotiate a new appointment time"
            >
              <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
              <span>Reschedule</span>
            </button>
            <button
              id="btn-new-enquiry-from-report"
              onClick={onNewEnquiry}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5 text-zinc-300" />
              <span>New Call</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Statement */}
        <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            Executive Summary
          </h4>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {currentReport.executiveSummary}
          </p>
        </motion.div>
      </motion.div>

      {/* Confirmation Dispatch Module */}
      <motion.div variants={itemVariants}>
        <ConfirmationDispatch
          brief={brief}
          report={currentReport}
          onConfirmationUpdated={handleConfirmationUpdated}
          autoPromptVoice={false}
        />
      </motion.div>

      {/* Primary Recommended or Booked Slot Highlight Card */}
      {primarySlot && (
        <motion.div variants={cardHighlightVariants} className="bg-zinc-900/60 rounded-2xl border border-indigo-500/40 p-6 sm:p-7 relative shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold border border-indigo-500/30">
                <Calendar className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block">
                  {currentReport.callOutcome === 'appointment_booked' ? 'Confirmed Appointment' : 'Recommended Slot'}
                </span>
                <h3 className="text-xl font-bold text-white">
                  {primarySlot.date} @ {primarySlot.time}
                </h3>
              </div>
            </div>

            {primarySlot.priceEstimate && (
              <div className="text-right">
                <span className="text-xs text-zinc-400 block">Est. Cost</span>
                <span className="text-sm font-semibold font-mono text-emerald-400">
                  {primarySlot.priceEstimate}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 mb-5">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-[11px] text-zinc-400 block">Date</span>
                <span className="text-xs font-semibold text-white">{primarySlot.date}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-[11px] text-zinc-400 block">Time</span>
                <span className="text-xs font-semibold text-white">{primarySlot.time}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-[11px] text-zinc-400 block">Specialist</span>
                <span className="text-xs font-semibold text-white">
                  {primarySlot.practitionerOrStaff || 'Assigned Staff'}
                </span>
              </div>
            </div>
          </div>

          {/* Calendar Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-add-to-google-calendar"
              onClick={handleAddToGoogleCalendar}
              className="inline-flex items-center px-4 py-2.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-95 gap-2 cursor-pointer shadow-sm shadow-indigo-600/30"
              title="Add to Google Calendar & download ICS appointment file"
            >
              <CalendarPlus className="w-4 h-4 text-white" />
              <span>Add to Google Calendar</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-normal">.ics</span>
            </button>

            <button
              id="btn-download-ics"
              onClick={handleDownloadIcs}
              className="inline-flex items-center px-4 py-2.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all active:scale-95 gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              <span>Download iCal (.ics)</span>
            </button>

            <button
              id="btn-reschedule-primary-slot"
              onClick={handleTriggerReschedule}
              className="inline-flex items-center px-4 py-2.5 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all active:scale-95 gap-2 cursor-pointer"
            >
              <CalendarClock className="w-4 h-4 text-amber-400" />
              <span>Reschedule</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Discovered Availability Options */}
      {currentReport.availableSlots.length > 0 && (
        <motion.div variants={itemVariants} className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-6 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-4 flex items-center gap-2 pb-3 border-b border-zinc-800">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Openings Offered by Provider ({currentReport.availableSlots.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentReport.availableSlots.map((slot, i) => (
              <motion.div
                key={slot.id || i}
                variants={itemVariants}
                className={`p-4 rounded-xl border transition-all ${
                  slot.isBestMatch
                    ? 'border-indigo-500/70 bg-indigo-500/10 ring-1 ring-indigo-500/20'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      {slot.date} @ {slot.time}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {slot.practitionerOrStaff ? `With ${slot.practitionerOrStaff}` : 'General Opening'}
                    </span>
                  </div>
                  {slot.isBestMatch ? (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      BEST MATCH
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                      OPENING
                    </span>
                  )}
                </div>

                {slot.notes && (
                  <p className="text-xs text-zinc-300 mt-1 mb-2">{slot.notes}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                  <span className="text-zinc-400 font-mono">
                    {slot.priceEstimate || 'Standard Rate'}
                  </span>
                  <a
                    href={createGoogleCalendarUrl(slot, currentReport.businessName, brief.serviceNeeded)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Save Slot</span>
                    <CalendarPlus className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Answers to Specific User Inquiries & Policies */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Answers to Questions */}
        <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-6 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3 flex items-center gap-2 pb-3 border-b border-zinc-800">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Receptionist Answers</span>
          </h3>

          {currentReport.answersToQuestions && currentReport.answersToQuestions.length > 0 ? (
            <div className="space-y-3">
              {currentReport.answersToQuestions.map((qa, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs space-y-1">
                  <p className="font-medium text-zinc-200">{qa.question}</p>
                  <p className="text-zinc-400">{qa.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No specific inquiry queries recorded.</p>
          )}
        </div>

        {/* Policy & Arrival Notes */}
        <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-6 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3 flex items-center gap-2 pb-3 border-b border-zinc-800">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Policies & Preparation</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {currentReport.policyNotes?.cancellationPolicy && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="font-semibold text-amber-300 block mb-0.5">Cancellation Policy:</span>
                <span className="text-zinc-300">{currentReport.policyNotes.cancellationPolicy}</span>
              </div>
            )}

            {currentReport.policyNotes?.arrivalInstructions && (
              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
                <span className="font-semibold text-zinc-200 block mb-0.5">Arrival Instructions:</span>
                <span className="text-zinc-400">{currentReport.policyNotes.arrivalInstructions}</span>
              </div>
            )}

            {currentReport.policyNotes?.requiredDocuments && currentReport.policyNotes.requiredDocuments.length > 0 && (
              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
                <span className="font-semibold text-zinc-200 block mb-1">Required to Bring:</span>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                  {currentReport.policyNotes.requiredDocuments.map((doc, i) => (
                    <li key={i}>{doc}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Agent Performance & Accuracy Feedback (Star-Rating) */}
      <motion.div
        id="card-agent-star-rating-feedback"
        variants={itemVariants}
        className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-6 shadow-sm overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Agent Performance & Accuracy Feedback</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Rank how well the autonomous agent handled negotiation, details accuracy, and conversational flow.
              </p>
            </div>
          </div>

          {rating && !isEditingRating ? (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Score: {((rating.accuracyRating + rating.performanceRating) / 2).toFixed(1)} / 5.0</span>
              </div>
              <button
                id="btn-edit-agent-rating"
                type="button"
                onClick={() => setIsEditingRating(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer"
              >
                Edit Rating
              </button>
            </div>
          ) : (
            <span className="text-[11px] font-mono font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 self-start sm:self-auto">
              Call Evaluation
            </span>
          )}
        </div>

        {rating && !isEditingRating ? (
          /* Readonly / Submitted State Card */
          <div className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">Appointment Accuracy</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= rating.accuracyRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-400">
                  {ACCURACY_DESCRIPTIONS[rating.accuracyRating]}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">Conversational Flow</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= rating.performanceRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-400">
                  {PERFORMANCE_DESCRIPTIONS[rating.performanceRating]}
                </p>
              </div>
            </div>

            {rating.tags && rating.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {rating.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-800/90 text-zinc-300 border border-zinc-700"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}

            {rating.feedbackComment && (
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300 flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-zinc-200 block mb-0.5">User Observations:</span>
                  <p className="text-zinc-400 italic">"{rating.feedbackComment}"</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-500 font-mono">
              <span>Submitted: {new Date(rating.submittedAt).toLocaleString()}</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Feedback Recorded
              </span>
            </div>
          </div>
        ) : (
          /* Interactive Rating Form */
          <div className="pt-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
              {/* Accuracy Track */}
              <StarRow
                idPrefix="accuracy"
                label="Information & Slot Accuracy"
                sublabel="Did the agent correctly convey patient constraints, desired date/time, and capture provider facts?"
                value={accuracyScore}
                hoverValue={hoverAccuracy}
                onHover={setHoverAccuracy}
                onChange={(val) => {
                  setAccuracyScore(val);
                  soundEngine.playBlip();
                }}
                descriptions={ACCURACY_DESCRIPTIONS}
              />

              {/* Performance Track */}
              <StarRow
                idPrefix="performance"
                label="Conversational Flow & Politeness"
                sublabel="How natural, courteous, and articulate was the voice dialogue, dialect, and objection handling?"
                value={performanceScore}
                hoverValue={hoverPerformance}
                onHover={setHoverPerformance}
                onChange={(val) => {
                  setPerformanceScore(val);
                  soundEngine.playBlip();
                }}
                descriptions={PERFORMANCE_DESCRIPTIONS}
              />
            </div>

            {/* Quick Feedback Tags */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-200 block">
                Quick Observations & Highlights
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_FEEDBACK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                          : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <span className="text-zinc-500">+</span>
                      )}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Comment Input */}
            <div className="space-y-1.5">
              <label htmlFor="textarea-agent-feedback-comment" className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                <span>Notes or Specific Observations (Optional)</span>
              </label>
              <textarea
                id="textarea-agent-feedback-comment"
                rows={2}
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="E.g. Handled receptionist's unexpected schedule question smoothly in Telugu..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-zinc-200 placeholder-zinc-600 resize-none transition-all"
              />
            </div>

            {/* Submit / Cancel Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <span>Combined Score:</span>
                <span className="font-bold text-amber-400 text-sm">
                  {((accuracyScore + performanceScore) / 2).toFixed(1)} / 5.0
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {rating && (
                  <button
                    type="button"
                    onClick={() => setIsEditingRating(false)}
                    className="px-3.5 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  id="btn-save-agent-rating"
                  type="button"
                  onClick={handleSaveFeedback}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-zinc-950" />
                  <span>{rating ? 'Update Feedback' : 'Submit Feedback'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Verbatim Call Transcript Toggle */}
      <motion.div variants={itemVariants} className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-sm">
        <button
          onClick={() => setShowFullTranscript(!showFullTranscript)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Verbatim Call Transcript ({turns.length} Dialog Turns)
            </span>
          </div>
          {showFullTranscript ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        <AnimatePresence>
          {showFullTranscript && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="border-t border-zinc-800 p-4 bg-zinc-950 space-y-3 overflow-hidden"
            >
              {turns.map((turn, i) => {
                const { sanitized, redactedCount } = sanitizeTranscriptText(turn.text);
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border text-xs ${
                      turn.speaker === 'agent'
                        ? 'bg-zinc-900/90 border-indigo-500/30 text-zinc-200'
                        : turn.speaker === 'receptionist'
                        ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200'
                        : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{turn.speakerName}</span>
                        {redactedCount > 0 && (
                          <span className="text-[10px] font-mono font-medium rounded-md bg-emerald-950/80 text-emerald-400 px-1.5 py-0.5 border border-emerald-500/30">
                            PII Masked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-400">{turn.timestamp}</span>
                        <button
                          onClick={() => {
                            soundEngine.speakText(
                              sanitized,
                              turn.speaker === 'agent' ? 'agent' : 'receptionist',
                              brief.language || 'te-IN'
                            );
                          }}
                          title="Play speech"
                          className="p-0.5 hover:text-indigo-400 cursor-pointer text-zinc-400"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="leading-relaxed text-zinc-300">{sanitized}</p>
                    {turn.agentInternalThought && (
                      <p className="mt-1.5 text-xs text-indigo-300 border-l-2 border-indigo-500 pl-2.5 py-0.5 bg-indigo-500/5 rounded-r">
                        Reasoning: {turn.agentInternalThought}
                      </p>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Calendar / Action Feedback Toast */}
      <AnimatePresence>
        {calendarToast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-zinc-900 border border-emerald-500/40 text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 backdrop-blur-md"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-zinc-100">{calendarToast}</p>
              <p className="text-[10px] text-zinc-400 font-normal">Ready to open in Google Calendar or your default calendar</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
