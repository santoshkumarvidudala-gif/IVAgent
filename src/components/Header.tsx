import React from 'react';
import { PhoneCall, Sparkles, History, Volume2, VolumeX, ShieldCheck, Radio, BookUser, Server, Activity } from 'lucide-react';

interface HeaderProps {
  activeCallsCount: number;
  totalCallsCount: number;
  savedContactsCount?: number;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onOpenHistory: () => void;
  onOpenContacts?: () => void;
  onOpenGcpSettings?: () => void;
  onOpenCalleSettings?: () => void;
  onOpenGuardrails?: () => void;
  onNewEnquiry: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCallsCount,
  totalCallsCount,
  savedContactsCount = 0,
  isAudioMuted,
  onToggleAudio,
  onOpenHistory,
  onOpenContacts,
  onOpenGcpSettings,
  onOpenCalleSettings,
  onOpenGuardrails,
  onNewEnquiry,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-30 bg-[#0B0D14]/90 backdrop-blur-xl border-b border-zinc-800/80 text-zinc-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3.5 cursor-pointer group" onClick={onNewEnquiry}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <PhoneCall className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                  IVAgent
                </span>
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-semibold tracking-wide uppercase">
                    PSTN Live
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 hidden md:block">
                Autonomous Telephony & Appointment Dispatch Engine
              </p>
            </div>
          </div>

          {/* Center/Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Live Gateway Telemetry status */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900/80 border border-zinc-800 text-zinc-300 font-mono text-xs">
              <Activity className={`w-3.5 h-3.5 ${activeCallsCount > 0 ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
              <span className="text-[11px] text-zinc-400">MCP Gateway:</span>
              <span className="text-[11px] font-semibold text-zinc-200">
                {activeCallsCount > 0 ? 'CALL ACTIVE' : 'STANDBY (120ms)'}
              </span>
            </div>

            {/* Google Cloud Platform (GCP) Console Button */}
            {onOpenGcpSettings && (
              <button
                id="btn-header-open-gcp"
                onClick={onOpenGcpSettings}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Google Cloud Platform (GCP) Console - Cloud Run, Speech & Logging"
              >
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline font-semibold">GCP Console</span>
              </button>
            )}

            {/* CALL-E Telephony Integration Button */}
            {onOpenCalleSettings && (
              <button
                id="btn-header-open-calle"
                onClick={onOpenCalleSettings}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="CALL-E Autonomous Telephony & MCP Console"
              >
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">CALL-E</span>
              </button>
            )}

            {/* Privacy & Guardrails Button */}
            {onOpenGuardrails && (
              <button
                id="btn-header-open-guardrails"
                onClick={onOpenGuardrails}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Enterprise Guardrails & Privacy Protocol"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Guardrails</span>
              </button>
            )}

            {/* Audio Toggle */}
            <button
              id="btn-toggle-audio"
              onClick={onToggleAudio}
              title={isAudioMuted ? 'Unmute voice synthesis' : 'Mute voice synthesis'}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                isAudioMuted
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/50'
              }`}
            >
              {isAudioMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Audio On</span>
                </>
              )}
            </button>

            {/* Saved Contacts Button */}
            {onOpenContacts && (
              <button
                id="btn-header-open-contacts"
                onClick={onOpenContacts}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                title="Manage Saved Business Directory"
              >
                <BookUser className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Directory</span>
                {savedContactsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                    {savedContactsCount}
                  </span>
                )}
              </button>
            )}

            {/* Call History Button */}
            <button
              id="btn-open-history"
              onClick={onOpenHistory}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Logs</span>
              {totalCallsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                  {totalCallsCount}
                </span>
              )}
            </button>

            {/* New Call / Enquiry Button */}
            <button
              id="btn-header-new-call"
              onClick={onNewEnquiry}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-white" />
              <span>New Call</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


