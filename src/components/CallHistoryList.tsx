import React, { useState } from 'react';
import { CallRecord } from '../types';
import {
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  PhoneCall,
  X,
  Sparkles,
  BarChart3,
  ListFilter,
  TrendingUp,
  Star,
} from 'lucide-react';
import { CallAnalyticsView } from './CallAnalyticsView';

interface CallHistoryListProps {
  history: CallRecord[];
  onSelectRecord: (record: CallRecord) => void;
  onClose: () => void;
  onNewCall: () => void;
}

export const CallHistoryList: React.FC<CallHistoryListProps> = ({
  history,
  onSelectRecord,
  onClose,
  onNewCall,
}) => {
  const [activeTab, setActiveTab] = useState<'records' | 'analytics'>('records');

  // Compute overall success rate for quick badge
  const successCount = history.filter(
    (r) =>
      r.report?.callOutcome === 'appointment_booked' ||
      r.report?.callOutcome === 'slots_found' ||
      r.report?.callOutcome === 'tentative_hold'
  ).length;
  const successRate = history.length > 0 ? Math.round((successCount / history.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-zinc-950 h-full shadow-2xl flex flex-col border-l border-zinc-800 animate-in slide-in-from-right duration-200 text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div>
            <div className="text-[10px] font-mono font-semibold tracking-wider uppercase text-indigo-400 mb-0.5">
              System Archives & Telemetry
            </div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Appointment Call Center</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {history.length}
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="grid grid-cols-2 border-b border-zinc-800 bg-zinc-900/50">
          <button
            onClick={() => setActiveTab('records')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'records'
                ? 'border-indigo-500 text-indigo-400 bg-zinc-900/80'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Call Logs ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-indigo-500 text-indigo-400 bg-zinc-900/80'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & KPIs</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                {successRate}%
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'analytics' ? (
            <CallAnalyticsView
              history={history}
              onDispatchNewCall={() => {
                onClose();
                onNewCall();
              }}
            />
          ) : (
            <>
              {history.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                  <PhoneCall className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                  <p className="text-sm font-semibold text-zinc-300">No Calls Placed Yet</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                    Once your AI agent places enquiry calls, transcripts, recorded slots, and booking reports will appear here.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onNewCall();
                    }}
                    className="mt-6 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
                  >
                    Place First Call
                  </button>
                </div>
              ) : (
                history.map((record) => {
                  const outcome = record.report?.callOutcome;
                  const bookedSlot = record.report?.bookedSlot;
                  const firstSlot = record.report?.availableSlots?.[0];

                  return (
                    <div
                      key={record.id}
                      onClick={() => onSelectRecord(record)}
                      className="p-4 rounded-xl border border-zinc-800 hover:border-indigo-500/50 bg-zinc-900/60 hover:bg-zinc-900 cursor-pointer transition-all space-y-2 group shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{record.brief.business.name}</span>
                          </h4>
                          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                            {record.brief.serviceNeeded}
                          </p>
                        </div>

                        {outcome === 'appointment_booked' ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                            Booked
                          </span>
                        ) : outcome === 'slots_found' ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
                            Slots Found
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                            Completed
                          </span>
                        )}
                      </div>

                      {bookedSlot ? (
                        <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-emerald-400 flex items-center justify-between">
                          <span className="font-semibold">{bookedSlot.date} @ {bookedSlot.time}</span>
                          <span className="text-[11px] text-zinc-400">{bookedSlot.practitionerOrStaff || 'Reserved'}</span>
                        </div>
                      ) : firstSlot ? (
                        <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between">
                          <span>Available: {firstSlot.date} @ {firstSlot.time}</span>
                        </div>
                      ) : null}

                      {record.report?.durationSeconds && (
                        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>Duration: {Math.floor(record.report.durationSeconds / 60)}m {record.report.durationSeconds % 60}s ({record.turns.length} turns)</span>
                        </div>
                      )}

                      {record.report?.confirmation && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{record.report.confirmation.method.toUpperCase()} Confirmation Sent ({record.report.confirmation.confirmationCode})</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span>{new Date(record.startedAt).toLocaleDateString()}</span>
                          {record.report?.rating && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-medium">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              <span>{((record.report.rating.accuracyRating + record.report.rating.performanceRating) / 2).toFixed(1)}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-indigo-400 font-semibold uppercase text-[11px] tracking-wider flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          View Report <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/90">
          <button
            onClick={() => {
              onClose();
              onNewCall();
            }}
            className="w-full py-3 text-xs font-semibold uppercase tracking-wider rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Dispatch New Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
