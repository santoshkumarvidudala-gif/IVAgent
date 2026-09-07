import React, { useState } from 'react';
import { Send, Mic, Sparkles, MessageSquarePlus } from 'lucide-react';

interface IntervenePanelProps {
  onSendWhisper: (text: string) => void;
  disabled?: boolean;
}

export const IntervenePanel: React.FC<IntervenePanelProps> = ({
  onSendWhisper,
  disabled = false,
}) => {
  const [whisperText, setWhisperText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const quickPrompts = [
    'Thursday works for me!',
    'Ask about cancellation fees',
    'Do they accept Delta Dental?',
    'Ask if afternoon is open',
    'Book the earliest slot',
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!whisperText.trim() || disabled) return;
    onSendWhisper(whisperText.trim());
    setWhisperText('');
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your instruction.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setWhisperText(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div id="intervene-whisper-panel" className="bg-zinc-900/80 border-t border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Operator Whisper</span>
        </div>
        <span className="text-[11px] text-zinc-400 hidden sm:inline">
          Agent adapts strategy mid-call
        </span>
      </div>

      {/* Quick Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSendWhisper(prompt)}
            className="whitespace-nowrap px-3 py-1 text-xs font-medium rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 hover:border-amber-400/50 transition-colors disabled:opacity-40 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input field */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
        <div className="relative flex-1">
          <input
            id="input-whisper-instruction"
            type="text"
            value={whisperText}
            onChange={(e) => setWhisperText(e.target.value)}
            disabled={disabled}
            placeholder="Type live instruction e.g., 'Tell them tomorrow afternoon at 2 PM is ideal'..."
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />
          <button
            type="button"
            onClick={handleVoiceInput}
            title="Speak instruction"
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer ${
              isListening ? 'text-red-400 animate-pulse bg-red-950/40' : ''
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <button
          id="btn-send-whisper"
          type="submit"
          disabled={disabled || !whisperText.trim()}
          className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-amber-400 hover:bg-amber-300 text-black shadow-sm transition-all disabled:opacity-30 flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Whisper</span>
        </button>
      </form>
    </div>
  );
};
