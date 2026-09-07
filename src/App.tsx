import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EnquiryBrief, CallTurn, StructuredCallReport, CallRecord, CallMode } from './types';
import { Header } from './components/Header';
import { EnquiryForm } from './components/EnquiryForm';
import { ActiveCallModal } from './components/ActiveCallModal';
import { CallReportView } from './components/CallReportView';
import { CallHistoryList } from './components/CallHistoryList';
import { CalleTelephonyModal } from './components/CalleTelephonyModal';
import { GcpIntegrationModal } from './components/GcpIntegrationModal';
import { GuardrailsModal } from './components/GuardrailsModal';
import { getSavedContacts } from './utils/contacts';

const STORAGE_KEY = 'appointment_call_agent_history_v1';

export default function App() {
  const [activeView, setActiveView] = useState<'form' | 'active_call' | 'report'>('form');
  const [currentBrief, setCurrentBrief] = useState<EnquiryBrief | null>(null);
  const [activeCallMode, setActiveCallMode] = useState<CallMode>('simulation');
  const [activeTurns, setActiveTurns] = useState<CallTurn[]>([]);
  const [activeReport, setActiveReport] = useState<StructuredCallReport | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isGcpModalOpen, setIsGcpModalOpen] = useState(false);
  const [isCalleModalOpen, setIsCalleModalOpen] = useState(false);
  const [isGuardrailsModalOpen, setIsGuardrailsModalOpen] = useState(false);
  const [savedContactsCount, setSavedContactsCount] = useState(0);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [rescheduleNotice, setRescheduleNotice] = useState<{ businessName: string; previousSlot: string } | null>(null);

  // Load call history & contacts count on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCallHistory(JSON.parse(saved));
      }
      const contacts = getSavedContacts();
      setSavedContactsCount(contacts.length);
    } catch {
      // ignore
    }
  }, []);

  // Save history on changes
  const saveRecordToHistory = (record: CallRecord) => {
    setCallHistory((prev) => {
      const updated = [record, ...prev.filter((r) => r.id !== record.id)];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Launch Call handler
  const handleStartCall = (brief: EnquiryBrief, mode: CallMode = 'simulation') => {
    setCurrentBrief(brief);
    setActiveCallMode(mode);
    setActiveTurns([]);
    setActiveReport(null);
    setActiveView('active_call');
  };

  // Reschedule handler: pre-populates brief with previous appointment details
  const handleReschedule = (brief: EnquiryBrief, report: StructuredCallReport) => {
    const prevSlot = report.bookedSlot
      ? `${report.bookedSlot.date} at ${report.bookedSlot.time}`
      : report.availableSlots?.[0]
      ? `${report.availableSlots[0].date} at ${report.availableSlots[0].time}`
      : 'Previously requested slot';

    const rescheduledBrief: EnquiryBrief = {
      ...brief,
      id: `enq-reschedule-${Date.now()}`,
      business: {
        ...brief.business,
        name: report.businessName || brief.business.name,
        staffOrDoctorName: report.bookedSlot?.practitionerOrStaff || brief.business.staffOrDoctorName,
      },
      user: {
        ...brief.user,
        isExistingClient: true,
        notesForReceptionist: `Need to reschedule appointment previously arranged for ${prevSlot}. Please check next available openings.`,
      },
      preferredDates: ['Next Tuesday', 'Next Thursday'],
      preferredTimeOfDay: 'morning',
      timeFlexibility: 'flexible_few_days',
      urgency: 'standard',
      bookingAuthority: 'direct_book',
      specificQuestions: [
        `Reschedule existing appointment from ${prevSlot} to a new convenient opening`,
        'Check if there are any cancellation or rescheduling policy fees',
      ],
      createdAt: new Date().toISOString(),
    };

    setCurrentBrief(rescheduledBrief);
    setRescheduleNotice({
      businessName: report.businessName || brief.business.name,
      previousSlot: prevSlot,
    });
    setActiveView('form');
  };

  // Call Ended handler
  const handleCallEnded = (turns: CallTurn[], report: StructuredCallReport) => {
    setActiveTurns(turns);
    setActiveReport(report);
    setActiveView('report');

    if (currentBrief) {
      const newRecord: CallRecord = {
        id: `call-${Date.now()}`,
        brief: currentBrief,
        status: 'completed',
        turns,
        report,
        startedAt: currentBrief.createdAt,
        endedAt: new Date().toISOString(),
      };
      saveRecordToHistory(newRecord);
    }
  };

  // Update report (e.g. after sending confirmation)
  const handleUpdateReport = (updatedReport: StructuredCallReport) => {
    setActiveReport(updatedReport);
    if (currentBrief) {
      setCallHistory((prev) => {
        const updated = prev.map((rec) => {
          if (rec.brief.id === currentBrief.id || rec.report?.businessName === updatedReport.businessName) {
            return {
              ...rec,
              report: updatedReport,
            };
          }
          return rec;
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  };

  // Cancel/Exit Call handler
  const handleCancelCall = () => {
    setActiveView('form');
  };

  // New Enquiry handler
  const handleNewEnquiry = () => {
    setRescheduleNotice(null);
    setCurrentBrief(null);
    setActiveView('form');
  };

  // Open Contacts directory handler
  const handleOpenContacts = () => {
    setActiveView('form');
    setIsContactsModalOpen(true);
  };

  // Select historical record to view report
  const handleSelectRecord = (record: CallRecord) => {
    setCurrentBrief(record.brief);
    setActiveTurns(record.turns);
    setActiveReport(record.report || null);
    setIsHistoryDrawerOpen(false);
    setActiveView('report');
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Global Application Header */}
      <Header
        activeCallsCount={activeView === 'active_call' ? 1 : 0}
        totalCallsCount={callHistory.length}
        savedContactsCount={savedContactsCount}
        isAudioMuted={isAudioMuted}
        onToggleAudio={() => setIsAudioMuted(!isAudioMuted)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onOpenContacts={handleOpenContacts}
        onOpenGcpSettings={() => setIsGcpModalOpen(true)}
        onOpenCalleSettings={() => setIsCalleModalOpen(true)}
        onOpenGuardrails={() => setIsGuardrailsModalOpen(true)}
        onNewEnquiry={handleNewEnquiry}
      />

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {activeView === 'form' && (
            <motion.div
              key="view-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <EnquiryForm
                onStartCall={handleStartCall}
                initialBrief={currentBrief}
                rescheduleNotice={rescheduleNotice}
                onClearReschedule={() => {
                  setRescheduleNotice(null);
                  setCurrentBrief(null);
                }}
                externalOpenContacts={isContactsModalOpen}
                onCloseExternalContacts={() => {
                  setIsContactsModalOpen(false);
                  const contacts = getSavedContacts();
                  setSavedContactsCount(contacts.length);
                }}
                onOpenGcpSettings={() => setIsGcpModalOpen(true)}
                callHistory={callHistory}
              />
            </motion.div>
          )}

          {activeView === 'report' && activeReport && currentBrief && (
            <motion.div
              key="view-report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <CallReportView
                report={activeReport}
                turns={activeTurns}
                brief={currentBrief}
                onNewEnquiry={handleNewEnquiry}
                onReschedule={handleReschedule}
                onUpdateReport={handleUpdateReport}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Active Call Live Overlay Modal */}
      <AnimatePresence>
        {activeView === 'active_call' && currentBrief && (
          <ActiveCallModal
            brief={currentBrief}
            callMode={activeCallMode}
            onCallEnded={handleCallEnded}
            onCancelCall={handleCancelCall}
            isAudioMuted={isAudioMuted}
            onToggleAudio={() => setIsAudioMuted(!isAudioMuted)}
          />
        )}
      </AnimatePresence>

      {/* Call Records Drawer */}
      {isHistoryDrawerOpen && (
        <CallHistoryList
          history={callHistory}
          onSelectRecord={handleSelectRecord}
          onClose={() => setIsHistoryDrawerOpen(false)}
          onNewCall={() => {
            setIsHistoryDrawerOpen(false);
            handleNewEnquiry();
          }}
        />
      )}

      {/* Google Cloud Platform (GCP) Console */}
      <GcpIntegrationModal
        isOpen={isGcpModalOpen}
        onClose={() => setIsGcpModalOpen(false)}
      />

      {/* CALL-E Telephony Engine & MCP Console */}
      <CalleTelephonyModal
        isOpen={isCalleModalOpen}
        onClose={() => setIsCalleModalOpen(false)}
      />

      {/* Strict Data Protection & Privacy Guardrails Modal */}
      <GuardrailsModal
        isOpen={isGuardrailsModalOpen}
        onClose={() => setIsGuardrailsModalOpen(false)}
      />
    </div>
  );
}
