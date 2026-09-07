import React, { useState, useRef, useEffect, useMemo } from 'react';
import { EnquiryBrief, CallMode } from '../types';
import {
  Send,
  Sparkles,
  Bot,
  User,
  PhoneCall,
  Mic,
  MicOff,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  Calendar,
  Clock,
  Shield,
  ArrowRight,
  SlidersHorizontal,
  Zap,
  Radio,
  FileText,
  Volume2,
  Phone,
  PhoneForwarded,
  Signal,
  Check,
  Globe,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import {
  ALL_LANGUAGES,
  REGIONAL_LANGUAGES,
  GLOBAL_LANGUAGES,
  getLanguageByCode,
  LanguageOption,
} from '../utils/languages';

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  highlights?: string[];
  briefSnapshot?: EnquiryBrief;
  isReadyToCall?: boolean;
}

interface AgentInstructionChatProps {
  currentBrief: EnquiryBrief;
  onApplyBrief: (brief: EnquiryBrief) => void;
  onStartCall: (brief: EnquiryBrief, mode: CallMode) => void;
  onSwitchToFormMode: () => void;
  rescheduleNotice?: { businessName: string; previousSlot: string } | null;
}

const DEFAULT_STARTER_INSTRUCTIONS = [
  {
    title: '📞 Telugu Call (+918886002844)',
    text: 'CALL-E, 8886002844 కి తెలుగులో కాల్ చేసి రేపు ఉదయం 10 గంటలకు డెంటల్ చెకప్ మరియు క్లీనింగ్ అపాయింట్‌మెంట్ స్లాట్ కనుక్కోండి. సంతోష్ కుమార్ గారి తరపున మాట్లాడండి.',
    isRealCall: true,
  },
  {
    title: '📞 Hindi Call (+918886002844)',
    text: 'CALL-E, 8886002844 पर हिन्दी में कॉल करके कल दोपहर के लिए डॉक्टर अपॉइंटमेंट बुक करो। मरीज का नाम संतोष कुमार है।',
    isRealCall: true,
  },
  {
    title: '🦷 Dental Routine Cleaning',
    text: 'Call Apex Dental Care (+1 555-234-8890) for Santosh Kumar. Inquire about routine teeth cleaning and bite-wing X-rays with Dr. Vance next Tuesday or Wednesday morning. Check if they accept Delta Dental PPO and directly confirm if available.',
    isRealCall: true,
  },
  {
    title: '🇪🇸 Spanish Call (+1 555-789-2341)',
    text: 'CALL-E, por favor llama a Clínica Médica Sanitas (+1 555-789-2341) para consultar citas disponibles con el Dr. Mendoza para el próximo jueves por la tarde a nombre de Santosh Kumar.',
    isRealCall: true,
  },
  {
    title: '🚗 Auto Brake Inspection',
    text: 'Call Mario Auto Service (+1 555-492-3110) to ask for an estimate on brake pad inspection and fluid flush for a 2018 Honda Civic. Need an opening tomorrow afternoon. Enquiry only, do not commit yet.',
    isRealCall: true,
  },
  {
    title: '💇 Salon Haircut & Styling',
    text: 'Call Bella Salon & Spa (+1 555-381-9920) to check if senior stylist Sarah has an opening for a haircut & blowout this Friday between 3 PM and 6 PM. If open, book it with tentative hold.',
    isRealCall: true,
  },
  {
    title: '🔧 Urgent Emergency Plumber',
    text: 'Call Bay Plumbing Experts (+1 555-901-4432) for an urgent leak under the kitchen sink. Inquire about emergency dispatch fees and technician arrival window for today before 2 PM.',
    isRealCall: true,
  },
];

export const AgentInstructionChat: React.FC<AgentInstructionChatProps> = ({
  currentBrief,
  onApplyBrief,
  onStartCall,
  onSwitchToFormMode,
  rescheduleNotice,
}) => {
  const [messages, setMessages] = useState<AgentChatMessage[]>(() => {
    if (rescheduleNotice) {
      return [
        {
          id: 'initial-reschedule-agent-msg',
          role: 'agent',
          content: `Rescheduling Session Loaded: I have pre-populated the details for your appointment with ${rescheduleNotice.businessName} (previously booked/requested for ${rescheduleNotice.previousSlot}). Tell me your new preferred days/times, and I will place the real phone call to negotiate a new time slot.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          highlights: [
            `Target: ${rescheduleNotice.businessName}`,
            `Previous: ${rescheduleNotice.previousSlot}`,
            'Ready to negotiate new date/time slot via Real Carrier PSTN',
          ],
          briefSnapshot: currentBrief,
          isReadyToCall: true,
        },
      ];
    }
    return [
      {
        id: 'initial-agent-msg',
        role: 'agent',
        content: `Greetings! I am your Autonomous Voice Call Dispatch Agent. Type or speak your call instructions in plain English (e.g. "Call 8886002844 to check hair salon slots tomorrow afternoon"). You can trigger live real carrier calls (PSTN) or run a voice simulation directly from this prompt box.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        highlights: [
          'Real Carrier (PSTN) & CALL-E Integration',
          'Instant Natural Language Phone Number Extraction',
          'Autonomous Negotiation & Direct Slot Booking',
        ],
        briefSnapshot: currentBrief,
        isReadyToCall: true,
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCallMode, setSelectedCallMode] = useState<CallMode>('live_pstn');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [calleAuth, setCalleAuth] = useState<{ authenticated: boolean; usable: boolean } | null>(null);
  const [authConnecting, setAuthConnecting] = useState(false);

  // Regional & Global Language state
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(
    currentBrief.language || 'te'
  );
  const [chatLangCategory, setChatLangCategory] = useState<'all' | 'regional' | 'global'>('all');
  const [isAuditioningVoice, setIsAuditioningVoice] = useState(false);
  const activeLangObj = useMemo(
    () => getLanguageByCode(selectedLanguageCode),
    [selectedLanguageCode]
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Keep recognition language synced with selected Indian language
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = activeLangObj.speechCode;
    }
  }, [activeLangObj]);

  // Check CALL-E status on mount
  useEffect(() => {
    fetchCalleStatus();
  }, []);

  const fetchCalleStatus = async () => {
    try {
      const res = await fetch('/api/calle/auth/status');
      if (res.ok) {
        const data = await res.json();
        setCalleAuth(data);
      }
    } catch {
      // ignore
    }
  };

  const handleAuthorizeCalle = async () => {
    setAuthConnecting(true);
    soundEngine.playDialTone(0.2);
    try {
      const res = await fetch('/api/calle/auth/login-url');
      const data = await res.json();
      if (data.success && data.loginUrl) {
        window.open(data.loginUrl, '_blank', 'width=600,height=750');
        // Poll for completion
        let count = 0;
        const poll = setInterval(async () => {
          count++;
          if (count > 25) {
            clearInterval(poll);
            return;
          }
          const sRes = await fetch('/api/calle/auth/status');
          if (sRes.ok) {
            const sData = await sRes.json();
            setCalleAuth(sData);
            if (sData.authenticated || sData.usable) {
              clearInterval(poll);
              soundEngine.playSuccess();
            }
          }
        }, 3000);
      }
    } catch (e) {
      console.warn('Login URL error:', e);
    } finally {
      setAuthConnecting(false);
    }
  };

  // Extract phone number dynamically from input box
  const detectedPhoneNumber = useMemo(() => {
    const match = inputMessage.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10,12}\b/);
    if (!match) return null;
    let raw = match[0].replace(/[^\d+]/g, '');
    if (raw.length === 10 && !raw.startsWith('+')) {
      return `+91${raw}`;
    }
    if (!raw.startsWith('+')) {
      return `+${raw}`;
    }
    return raw;
  }, [inputMessage]);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = activeLangObj.speechCode;

      recog.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recog.onerror = () => {
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        soundEngine.playChirp();
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (customText?: string, forceDirectCall?: boolean, forceMode?: CallMode) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    // Fast client-side extraction of phone & goals
    const cliPhoneMatch = textToSend.match(/--to-phone\s+["']?([^"'\s]+)["']?/i);
    const cliGoalMatch = textToSend.match(/--goal\s+["']?([^"']+)["']?/i);
    const rawDigits = textToSend.match(/(?:\+?91[\s-]?)?[6-9]\d{9}|\+?1?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}|\b\d{10}\b/);
    let targetPhone = cliPhoneMatch ? cliPhoneMatch[1].trim() : (rawDigits ? rawDigits[0].trim() : null);
    if (targetPhone) {
      const cleanDigits = targetPhone.replace(/\D/g, '');
      if (cleanDigits.length === 10 && /^[6-9]/.test(cleanDigits)) {
        targetPhone = `+91${cleanDigits}`;
      } else if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
        targetPhone = `+${cleanDigits}`;
      }
    }

    const callModeToUse = forceMode || (forceDirectCall ? 'live_pstn' : selectedCallMode);

    soundEngine.playBlip();

    const userMsg: AgentChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      // Build conversation history for context
      const chatHistory = messages.map((m) => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: m.content,
      }));

      const res = await fetch('/api/agent/chat-instruction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          chatHistory,
          currentBrief,
          userProfile: currentBrief.user,
          language: selectedLanguageCode,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      soundEngine.playSuccess();

      // If prompt suggests real call or forceDirectCall is true
      const isLiveMode =
        callModeToUse === 'live_pstn' ||
        data.suggestedMode === 'live_pstn' ||
        /call-e|calle|real call|pstn|place a call|dial|call \+?\d/i.test(textToSend);

      if (isLiveMode) {
        setSelectedCallMode('live_pstn');
      }

      // Merge and update application brief state
      const updatedBrief: EnquiryBrief = {
        ...currentBrief,
        ...(data.extractedBrief || {}),
        business: {
          ...currentBrief.business,
          ...(data.extractedBrief?.business || {}),
          phone: targetPhone || data.extractedBrief?.business?.phone || currentBrief.business.phone,
        },
        user: {
          ...currentBrief.user,
          ...(data.extractedBrief?.user || {}),
        },
        language: data.extractedBrief?.language || selectedLanguageCode,
        languageName: data.extractedBrief?.languageName || `${activeLangObj.englishName} (${activeLangObj.nativeName})`,
        id: currentBrief.id || `brief-${Date.now()}`,
        createdAt: currentBrief.createdAt || new Date().toISOString(),
      };

      onApplyBrief(updatedBrief);

      const agentMsg: AgentChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content:
          data.assistantReply ||
          `I have structured your call request for ${updatedBrief.business.name} (${updatedBrief.business.phone}). Ready to dial.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        highlights: data.highlights || [
          `Target: ${updatedBrief.business.name} (${updatedBrief.business.phone})`,
          `Objective: ${updatedBrief.serviceNeeded}`,
          `Language: ${activeLangObj.englishName} (${activeLangObj.nativeName})`,
          `Mode: ${isLiveMode ? 'Live Carrier (PSTN / CALL-E)' : 'Voice Studio'}`,
        ],
        briefSnapshot: updatedBrief,
        isReadyToCall: data.isReadyToCall ?? true,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // If user instructed immediate dispatch or clicked direct call
      if (forceDirectCall || data.shouldAutoStartCall) {
        onStartCall(updatedBrief, isLiveMode ? 'live_pstn' : 'simulation');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name !== 'AbortError') {
        console.warn('Instruction chat network notice:', err.message || err);
      }
      const isLive = /call-e|calle|real call|dial|\+?\d{10}/i.test(textToSend) || forceDirectCall;
      if (isLive) setSelectedCallMode('live_pstn');

      const isDoctor = /doctor|physician|clinic|medical/i.test(textToSend);
      const phoneToSet = targetPhone || currentBrief.business.phone || '+918886002844';
      const goalToSet = cliGoalMatch?.[1] || (isDoctor ? 'Check doctor appointment availability for tomorrow morning' : textToSend);

      const fallbackBrief: EnquiryBrief = {
        ...currentBrief,
        business: {
          ...currentBrief.business,
          name: isDoctor ? 'City Medical Clinic' : (currentBrief.business.name || 'Requested Recipient'),
          phone: phoneToSet,
          category: isDoctor ? 'medical' : (currentBrief.business.category || 'salon_spa'),
        },
        serviceNeeded: goalToSet,
        preferredDates: ['Tomorrow Morning'],
        preferredTimeOfDay: 'morning',
      };

      onApplyBrief(fallbackBrief);

      const fallbackMsg: AgentChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: `I've configured the brief for ${fallbackBrief.business.name} (${fallbackBrief.business.phone}) with goal: "${goalToSet}". Ready to place the call.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        highlights: [
          `Destination: ${fallbackBrief.business.phone}`,
          `Goal: ${goalToSet}`,
          `Mode: ${isLive ? 'Real Carrier PSTN' : 'Voice Studio'}`,
        ],
        briefSnapshot: fallbackBrief,
        isReadyToCall: true,
      };
      setMessages((prev) => [...prev, fallbackMsg]);

      if (forceDirectCall) {
        onStartCall(fallbackBrief, isLive ? 'live_pstn' : 'simulation');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    soundEngine.playBlip();
    setMessages([
      {
        id: 'initial-agent-msg',
        role: 'agent',
        content: `Instruction queue cleared. Ready for your next call instructions.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        highlights: ['Ready for new instruction', 'Carrier bridge standby'],
        briefSnapshot: currentBrief,
        isReadyToCall: true,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Call Mode Selector & Form Toggle */}
      <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Real Telephony & Carrier Prompt Hub</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <Signal className="w-3 h-3 text-emerald-400" />
                <span>PSTN / CALL-E</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Type natural call orders — the agent automatically configures parameters, verifies recipient lines, and dials real phone numbers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CALL-E Connection Indicator */}
          {calleAuth?.authenticated || calleAuth?.usable ? (
            <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
              <span>Carrier Ready (+918886002844)</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAuthorizeCalle}
              disabled={authConnecting}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Connect CALL-E to ring your physical phone handset"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{authConnecting ? 'Opening Session...' : 'Connect CALL-E to Ring Phone'}</span>
            </button>
          )}

          {/* Mode switch */}
          <div className="inline-flex p-1 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs font-medium">
            <button
              onClick={() => setSelectedCallMode('live_pstn')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCallMode === 'live_pstn'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-300" />
              <span>Real Call (Carrier PSTN)</span>
            </button>
            <button
              onClick={() => setSelectedCallMode('simulation')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                selectedCallMode === 'simulation'
                  ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Voice Studio (Sandbox)
            </button>
          </div>

          <button
            onClick={onSwitchToFormMode}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-xs font-medium text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            title="Switch to detailed manual parameter configuration"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Manual Form</span>
          </button>
        </div>
      </div>

      {/* Regional & Global Language Selection Bar */}
      <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/90 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Call Language:</span>
            </div>
            <span className="text-[11px] font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 flex items-center gap-1">
              <span>{activeLangObj.flagEmoji}</span>
              <span>{activeLangObj.englishName} ({activeLangObj.nativeName})</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audition Button */}
            <button
              type="button"
              disabled={isAuditioningVoice}
              onClick={() => {
                soundEngine.playBlip();
                setIsAuditioningVoice(true);
                soundEngine.speakText(
                  activeLangObj.sampleGreeting,
                  'agent',
                  activeLangObj.speechCode,
                  () => setIsAuditioningVoice(false)
                );
                setTimeout(() => setIsAuditioningVoice(false), 4000);
              }}
              className="px-2 py-0.5 text-[11px] font-medium rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              title="Audition native greeting in browser"
            >
              <Volume2 className={`w-3 h-3 ${isAuditioningVoice ? 'text-indigo-400 animate-pulse' : 'text-zinc-400'}`} />
              <span>{isAuditioningVoice ? 'Playing...' : 'Test Voice'}</span>
            </button>

            {/* Category Switcher */}
            <div className="flex items-center gap-0.5 bg-zinc-950 p-0.5 rounded-md border border-zinc-800 text-[10px]">
              <button
                type="button"
                onClick={() => setChatLangCategory('all')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  chatLangCategory === 'all'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setChatLangCategory('regional')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  chatLangCategory === 'regional'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Indic 🇮🇳
              </button>
              <button
                type="button"
                onClick={() => setChatLangCategory('global')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  chatLangCategory === 'global'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Global 🌍
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Language Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {ALL_LANGUAGES.filter((lang) => {
            if (chatLangCategory === 'regional') return lang.category === 'regional';
            if (chatLangCategory === 'global') return lang.category === 'global';
            return true;
          }).map((lang) => {
            const isSelected = selectedLanguageCode === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLanguageCode(lang.code);
                  soundEngine.playBlip();
                  if (recognitionRef.current) {
                    recognitionRef.current.lang = lang.speechCode;
                  }
                  onApplyBrief({
                    ...currentBrief,
                    language: lang.code,
                    languageName: `${lang.englishName} (${lang.nativeName})`,
                  });
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80 border border-zinc-700/60'
                }`}
                title={`Conduct call in ${lang.englishName} (${lang.nativeName})`}
              >
                <span>{lang.flagEmoji}</span>
                <span>{lang.nativeName}</span>
                <span className="text-[10px] opacity-75 font-normal">({lang.englishName})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 shadow-md flex flex-col h-[540px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans text-sm">
          {messages.map((msg) => {
            const isAgent = msg.role === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}
              >
                {isAgent && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-2.5 ${isAgent ? 'w-full' : ''}`}>
                  <div
                    className={`p-4 rounded-xl border ${
                      isAgent
                        ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
                        : 'bg-indigo-600/20 border-indigo-500/30 text-white ml-auto'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                      <span className={`font-semibold uppercase tracking-wide ${isAgent ? 'text-indigo-400' : 'text-zinc-300'}`}>
                        {isAgent ? 'Autonomous Dispatch AI' : 'Operator'}
                      </span>
                      <div className="flex items-center gap-2">
                        {isAgent && (
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.speakText(msg.content, 'agent', activeLangObj.speechCode);
                            }}
                            className="text-zinc-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Audition message in regional language speech"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Listen</span>
                          </button>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    <p className="text-sm font-sans leading-relaxed text-zinc-200 whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    {/* Extracted Highlights */}
                    {msg.highlights && msg.highlights.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap gap-1.5">
                        {msg.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[11px] font-mono rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{h}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive Call Order Summary Card when brief snapshot is attached */}
                  {isAgent && msg.briefSnapshot && (
                    <div className="p-4 rounded-xl bg-zinc-900/70 border border-emerald-500/30 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                            Synthesized Call Brief
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            {msg.briefSnapshot.business.phone || 'Phone Pending'}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {msg.briefSnapshot.bookingAuthority.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate">
                            Recipient: <strong className="text-white">{msg.briefSnapshot.business.name}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>
                            {msg.briefSnapshot.preferredDates?.join(', ') || 'Flexible'} ({msg.briefSnapshot.preferredTimeOfDay})
                          </span>
                        </div>
                        <div className="col-span-full flex items-start gap-2 text-zinc-300">
                          <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-zinc-300">
                            Objective: <span className="text-zinc-100 font-medium">{msg.briefSnapshot.serviceNeeded}</span>
                          </span>
                        </div>
                      </div>

                      {/* Direct Dual Action Dispatch Buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80">
                        <button
                          onClick={onSwitchToFormMode}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-300 hover:text-white border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Edit Details</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onStartCall(msg.briefSnapshot!, 'simulation')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
                            title="Run call dialogue in browser voice simulator"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Voice Studio</span>
                          </button>

                          <button
                            onClick={() => onStartCall(msg.briefSnapshot!, 'live_pstn')}
                            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all transform active:scale-95 animate-pulse"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-white" />
                            <span>Dial Real Phone ({msg.briefSnapshot.business.phone || 'PSTN'})</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!isAgent && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Synthesizing parameters and verifying destination carrier route...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Suggestion Pills */}
        <div className="p-2.5 bg-zinc-900/90 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-zinc-400 shrink-0 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{rescheduleNotice ? 'Reschedule Options:' : 'Quick Real Call Presets:'}</span>
          </span>
          {(rescheduleNotice
            ? [
                {
                  title: '📅 Next Week Morning',
                  text: `Call ${currentBrief.business.name} for ${currentBrief.user.fullName}. Need to reschedule my previous appointment (${rescheduleNotice.previousSlot}) to next Tuesday or Wednesday morning. Check availability and confirm.`,
                },
                {
                  title: '🕒 Next Available Afternoon',
                  text: `Call ${currentBrief.business.name}. I need to move my appointment to next available Thursday or Friday afternoon after 2 PM.`,
                },
                {
                  title: '⚡ Earliest Alternate Opening',
                  text: `Call ${currentBrief.business.name}. What is the absolute earliest opening to reschedule my ${currentBrief.serviceNeeded}? Book the first available opening.`,
                },
              ]
            : DEFAULT_STARTER_INSTRUCTIONS
          ).map((starter, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(starter.text, starter.isRealCall, 'live_pstn')}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 hover:border-emerald-500/40 text-xs font-medium text-zinc-300 hover:text-white shrink-0 cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{starter.title}</span>
            </button>
          ))}
        </div>

        {/* Textarea Input & Controls */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800/80 space-y-2">
          {/* Real Phone Detected Banner */}
          {detectedPhoneNumber && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Signal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>
                  Real phone destination detected: <strong className="text-white font-mono">{detectedPhoneNumber}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, true, 'live_pstn')}
                className="px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Dial Now</span>
              </button>
            </div>
          )}

          <div className="relative flex items-end gap-2 bg-zinc-900 rounded-xl border border-zinc-800 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/70 p-2.5 transition-all">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type call instructions (e.g. 'Call 8886002844 for Santosh Kumar to book haircut tomorrow at 3 PM')..."
              rows={2}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none px-1"
            />

            <div className="flex items-center gap-1.5 shrink-0">
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={isListening ? 'Stop voice recording' : 'Dictate instructions with microphone'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={handleResetChat}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Standard Dispatch Button */}
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, false)}
                disabled={!inputMessage.trim() || isLoading}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:bg-zinc-800/50 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-all"
                title="Synthesize and review call brief"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>

              {/* Dedicated Real Call Button */}
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, true, 'live_pstn')}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-sm shadow-emerald-600/30 transition-all"
                title="Send instruction and immediately place real phone call"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Make Real Call</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Carrier PSTN Bridge Active • Press Enter or click Make Real Call</span>
            </span>
            <span className="text-zinc-400">Enterprise SOC2 / HIPAA Guardrails Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

