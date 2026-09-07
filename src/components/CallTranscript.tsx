import React from 'react';
import { CallTurn } from '../types';
import { Bot, User, MessageSquareQuote, Volume2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { sanitizeTranscriptText } from '../utils/guardrails';

interface CallTranscriptProps {
  turns: CallTurn[];
  activeTurnIndex?: number;
  onPlayTurnAudio?: (turn: CallTurn) => void;
  isCallActive?: boolean;
  languageCode?: string;
}

export const CallTranscript: React.FC<CallTranscriptProps> = ({
  turns,
  activeTurnIndex = -1,
  isCallActive = false,
  languageCode,
}) => {
  const handlePlayTurn = (turn: CallTurn) => {
    const { sanitized } = sanitizeTranscriptText(turn.text);
    if (turn.speaker === 'agent') {
      soundEngine.speakText(sanitized, 'agent', languageCode);
    } else if (turn.speaker === 'receptionist') {
      soundEngine.speakText(sanitized, 'receptionist', languageCode);
    }
  };

  return (
    <div id="call-transcript-container" className="space-y-3 p-2 sm:p-4">
      {turns.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">Connecting to business line...</p>
          <p className="text-[11px] font-mono text-zinc-600 mt-1 uppercase tracking-wider">Live dialogue transcription will stream here</p>
        </div>
      ) : (
        turns.map((turn, index) => {
          const isAgent = turn.speaker === 'agent';
          const isReceptionist = turn.speaker === 'receptionist';
          const isWhisper = turn.speaker === 'user_whisper';
          const isCurrentActive = index === activeTurnIndex;

          return (
            <div
              key={turn.id || index}
              id={`transcript-turn-${index}`}
              className={`p-4 rounded-xl border transition-all ${
                isCurrentActive
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/20'
                  : 'bg-zinc-950/70 border-zinc-800'
              } ${isWhisper ? 'bg-amber-950/30 border-amber-500/40' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isAgent
                        ? 'bg-indigo-600 text-white'
                        : isReceptionist
                        ? 'bg-sky-600 text-white'
                        : isWhisper
                        ? 'bg-amber-500 text-black'
                        : 'bg-zinc-800 text-white'
                    }`}
                  >
                    {isAgent ? (
                      <Bot className="w-3.5 h-3.5" />
                    ) : isWhisper ? (
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <span className="text-xs font-semibold text-white">
                    {turn.speakerName}
                  </span>

                  {isAgent && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      Dispatch Agent
                    </span>
                  )}
                  {isWhisper && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Live Whisper
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-500">
                    {turn.timestamp}
                  </span>
                  <button
                    onClick={() => handlePlayTurn(turn)}
                    title="Play voice audio"
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Spoken Text */}
              {(() => {
                const { sanitized, redactedCount } = sanitizeTranscriptText(turn.text);
                return (
                  <div className="pl-9 space-y-1.5">
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {sanitized}
                    </p>
                    {redactedCount > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 w-fit">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Protected ({redactedCount} token{redactedCount > 1 ? 's' : ''})</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Agent internal strategic reasoning thought */}
              {turn.agentInternalThought && (
                <div className="mt-3 ml-9 p-2.5 rounded-lg bg-zinc-900 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold uppercase tracking-wider text-white">Reasoning: </span>
                    <span className="text-zinc-300">{turn.agentInternalThought}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {isCallActive && (
        <div className="flex items-center justify-center py-3 text-xs font-mono font-medium uppercase tracking-wider text-indigo-400 gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366F1] animate-ping" />
          <span>Call in progress • Transcribing provider line...</span>
        </div>
      )}
    </div>
  );
};
