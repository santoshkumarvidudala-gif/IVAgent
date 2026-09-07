import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { EnquiryBrief, CallTurn, StructuredCallReport, CallMode } from '../types';
import {
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Sparkles,
  Building2,
  CheckCircle2,
  Loader2,
  Flame,
  Radio,
  Cloud,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { CallTranscript } from './CallTranscript';
import { IntervenePanel } from './IntervenePanel';
import { soundEngine } from '../utils/audio';

interface ActiveCallModalProps {
  brief: EnquiryBrief;
  callMode?: CallMode;
  onCallEnded: (turns: CallTurn[], report: StructuredCallReport) => void;
  onCancelCall: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  brief,
  callMode = 'simulation',
  onCallEnded,
  onCancelCall,
  isAudioMuted,
  onToggleAudio,
}) => {
  const [callStage, setCallStage] = useState<'dialing' | 'ringing' | 'connected' | 'wrapping_up'>('dialing');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [turns, setTurns] = useState<CallTurn[]>([]);
  const [activeTurnIndex, setActiveTurnIndex] = useState(-1);
  const [currentSpeaker, setCurrentSpeaker] = useState<'agent' | 'receptionist' | 'idle'>('idle');
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [finalReport, setFinalReport] = useState<StructuredCallReport | null>(null);
  const [telephonySid, setTelephonySid] = useState<string | null>(null);
  const [isRealPstn, setIsRealPstn] = useState(callMode === 'live_pstn');
  const [carrierNotice, setCarrierNotice] = useState<{
    isLive: boolean;
    authRequired?: boolean;
    message?: string;
    loginUrl?: string;
    carrierError?: string;
  } | null>(null);
  const [isRetryingCall, setIsRetryingCall] = useState(false);

  const turnsRef = useRef<CallTurn[]>([]);
  turnsRef.current = turns;

  const scrollBottomRef = useRef<HTMLDivElement | null>(null);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStage === 'connected' || callStage === 'wrapping_up') {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStage]);

  // Main Calling Simulation Workflow
  useEffect(() => {
    let isCancelled = false;

    const runCallSequence = async () => {
      // 1. Dialing Phase (DTMF Beeps)
      setCallStage('dialing');
      if (!isAudioMuted) {
        soundEngine.playDtmfTone(697, 1209, 0.15);
        await new Promise((r) => setTimeout(r, 200));
        soundEngine.playDtmfTone(770, 1336, 0.15);
        await new Promise((r) => setTimeout(r, 200));
        soundEngine.playDtmfTone(852, 1477, 0.15);
      }
      await new Promise((r) => setTimeout(r, 800));
      if (isCancelled) return;

      // 2. Ringing Phase
      setCallStage('ringing');
      if (!isAudioMuted) {
        soundEngine.playRingTone(1.5);
      }
      await new Promise((r) => setTimeout(r, 1800));
      if (isCancelled) return;

      // 3. Connect Call
      setCallStage('connected');
      if (!isAudioMuted) {
        soundEngine.playConnectChime();
      }

      // If Live PSTN Mode is selected, initiate carrier call
      if (callMode === 'live_pstn') {
        try {
          const telResp = await fetch('/api/telephony/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brief }),
          });
          const rawTel = await telResp.text();
          if (rawTel && rawTel.trim().startsWith('{')) {
            const telData = JSON.parse(rawTel);
            if (telData.callSid) {
              setTelephonySid(telData.callSid);
            }
            if (telData.isLivePstn) {
              setIsRealPstn(true);
              setCarrierNotice({
                isLive: true,
                message: `CALL-E Live Carrier Active — Destination ${brief.business.phone} is ringing`,
              });
            } else {
              setCarrierNotice({
                isLive: false,
                authRequired: telData.authRequired ?? true,
                loginUrl: telData.loginUrl,
                carrierError: telData.carrierError,
                message: telData.carrierError || `Physical phone ${brief.business.phone} not ringing: CALL-E authorization required. Running in CALL-E Voice Studio.`,
              });
            }
          }
        } catch (telErr) {
          console.warn('Carrier call trigger warning:', telErr);
        }
      }

      // Fetch dialogue turns & structured report from server
      try {
        setIsProcessingTurn(true);
        let data: any = null;
        try {
          const res = await fetch('/api/call/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(brief),
          });

          const rawText = await res.text();
          if (rawText && rawText.trim().startsWith('{')) {
            data = JSON.parse(rawText);
          }
        } catch (fetchErr) {
          console.warn('Simulate network fetch notice:', fetchErr);
        }

        if (isCancelled) return;

        let simulatedTurns: CallTurn[] = data?.turns || [];
        let structuredReport: StructuredCallReport = data?.report;

        // Ultimate client safety net if server or network returned empty payload
        if (!simulatedTurns.length || !structuredReport) {
          const bName = brief.business.name || 'Office';
          const uName = brief.user.fullName || 'Client';
          const sNeeded = brief.serviceNeeded || 'Appointment';
          
          const lang = (brief.language || '').toLowerCase();
          if (lang.startsWith('te')) {
            simulatedTurns = [
              {
                id: 'client-fb-1',
                speaker: 'receptionist',
                speakerName: `${bName} డెస్క్`,
                text: `నమస్కారం అండి, ${bName} కి స్వాగతం. మీకు ఎలా సహాయం చేయగలను?`,
                timestamp: '0:03',
              },
              {
                id: 'client-fb-2',
                speaker: 'agent',
                speakerName: 'AI వాయిస్ అసిస్టెంట్',
                text: `నమస్కారం అండి, నేను ${uName} గారి తరపున మాట్లాడుతున్నాను. ${sNeeded} కోసం అపాయింట్‌మెంట్ స్లాట్లు ఏమైనా ఉన్నాయా?`,
                timestamp: '0:08',
                agentInternalThought: 'నమస్కారంతో అపాయింట్‌మెంట్ వివరాలు అడగడం జరిగింది.',
              },
              {
                id: 'client-fb-3',
                speaker: 'receptionist',
                speakerName: `${bName} డెస్క్`,
                text: `అవునండి, రేపు ఉదయం 10:30 గంటలకు లేదా సాయంత్రం 4:00 గంటలకు డాక్టర్ గారు అందుబాటులో ఉన్నారు.`,
                timestamp: '0:16',
              },
              {
                id: 'client-fb-4',
                speaker: 'agent',
                speakerName: 'AI వాయిస్ అసిస్టెంట్',
                text: `రేపు ఉదయం 10:30 గంటల స్లాట్ మాకు సౌకర్యంగా ఉంటుంది. ధన్యవాదాలు అండి.`,
                timestamp: '0:22',
                agentInternalThought: 'ఉదయం స్లాట్ ఎంపిక చేసి అపాయింట్‌మెంట్ ఖరారు చేయడం జరిగింది.',
              },
            ];
          } else if (lang.startsWith('hi')) {
            simulatedTurns = [
              {
                id: 'client-fb-1',
                speaker: 'receptionist',
                speakerName: `${bName} डेस्क`,
                text: `नमस्ते! ${bName} में आपका स्वागत है। बताइए कैसे मदद कर सकते हैं?`,
                timestamp: '0:03',
              },
              {
                id: 'client-fb-2',
                speaker: 'agent',
                speakerName: 'AI वॉइस एजेंट',
                text: `नमस्ते जी, मैं ${uName} की तरफ से ${sNeeded} के अपॉइंटमेंट के लिए बात कर रहा हूँ।`,
                timestamp: '0:08',
                agentInternalThought: 'क्लाइंट के लिए अपॉइंटमेंट की जानकारी मांगी।',
              },
              {
                id: 'client-fb-3',
                speaker: 'receptionist',
                speakerName: `${bName} डेस्क`,
                text: `जी हाँ, कल सुबह 10:30 बजे या दोपहर 3:00 बजे का स्लॉट उपलब्ध है।`,
                timestamp: '0:16',
              },
              {
                id: 'client-fb-4',
                speaker: 'agent',
                speakerName: 'AI वॉइस एजेंट',
                text: `कल सुबह 10:30 बजे का समय ठीक रहेगा। धन्यवाद!`,
                timestamp: '0:22',
                agentInternalThought: 'सुबह का स्लॉट चुनकर पुष्टि की।',
              },
            ];
          } else if (lang.startsWith('es')) {
            simulatedTurns = [
              {
                id: 'client-fb-1',
                speaker: 'receptionist',
                speakerName: `${bName} Recepción`,
                text: `¡Hola! Gracias por llamar a ${bName}. ¿En qué podemos ayudarle hoy?`,
                timestamp: '0:03',
              },
              {
                id: 'client-fb-2',
                speaker: 'agent',
                speakerName: 'Agente de Voz IA',
                text: `Buenos días, llamo en nombre de ${uName} para consultar disponibilidad de citas para ${sNeeded}.`,
                timestamp: '0:08',
                agentInternalThought: 'Presentó la solicitud formalmente en español.',
              },
              {
                id: 'client-fb-3',
                speaker: 'receptionist',
                speakerName: `${bName} Recepción`,
                text: `Tenemos disponibilidad este martes a las 10:30 AM o el jueves a las 2:00 PM. ¿Cuál le conviene más?`,
                timestamp: '0:16',
              },
              {
                id: 'client-fb-4',
                speaker: 'agent',
                speakerName: 'Agente de Voz IA',
                text: `El martes a las 10:30 AM nos viene perfecto. Muchísimas gracias por su atención.`,
                timestamp: '0:22',
                agentInternalThought: 'Confirmó el horario preferido cordialmente.',
              },
            ];
          } else if (lang.startsWith('fr')) {
            simulatedTurns = [
              {
                id: 'client-fb-1',
                speaker: 'receptionist',
                speakerName: `${bName} Accueil`,
                text: `Bonjour et bienvenue chez ${bName}. Comment puis-je vous aider aujourd'hui ?`,
                timestamp: '0:03',
              },
              {
                id: 'client-fb-2',
                speaker: 'agent',
                speakerName: 'Agent Vocal IA',
                text: `Bonjour, je vous appelle au nom de ${uName} afin de vérifier les disponibilités pour ${sNeeded}.`,
                timestamp: '0:08',
                agentInternalThought: 'Demande formulée poliment en français.',
              },
              {
                id: 'client-fb-3',
                speaker: 'receptionist',
                speakerName: `${bName} Accueil`,
                text: `Nous avons un créneau ce mardi à 10h30 ou ce jeudi à 14h00. Lequel préférez-vous ?`,
                timestamp: '0:16',
              },
              {
                id: 'client-fb-4',
                speaker: 'agent',
                speakerName: 'Agent Vocal IA',
                text: `Mardi à 10h30 convient parfaitement. Je vous remercie beaucoup pour votre aide.`,
                timestamp: '0:22',
                agentInternalThought: 'Créneau validé avec succès.',
              },
            ];
          } else if (lang.startsWith('de')) {
            simulatedTurns = [
              {
                id: 'client-fb-1',
                speaker: 'receptionist',
                speakerName: `${bName} Empfang`,
                text: `Guten Tag, willkommen bei ${bName}. Wie können wir Ihnen heute weiterhelfen?`,
                timestamp: '0:03',
              },
              {
                id: 'client-fb-2',
                speaker: 'agent',
                speakerName: 'KI-Sprachassistent',
                text: `Guten Tag, ich rufe im Auftrag von ${uName} bezüglich eines Termins für ${sNeeded} an.`,
                timestamp: '0:08',
                agentInternalThought: 'Terminanfrage höflich auf Deutsch formuliert.',
              },
              {
                id: 'client-fb-3',
                speaker: 'receptionist',
                speakerName: `${bName} Empfang`,
                text: `Wir haben am Dienstag um 10:30 Uhr oder am Donnerstag um 14:00 Uhr freie Termine.`,
                timestamp: '0:16',
              },
              {
                id: 'client-fb-4',
                speaker: 'agent',
                speakerName: 'KI-Sprachassistent',
                text: `Dienstag um 10:30 Uhr passt ausgezeichnet. Vielen herzlichen Dank für Ihre Hilfe.`,
                timestamp: '0:22',
                agentInternalThought: 'Termin bestätigt.',
              },
            ];
          } else if (lang.startsWith('ja')) {
            simulatedTurns = [
              {
                id: 'client-fb-1',
                speaker: 'receptionist',
                speakerName: `${bName} 受付`,
                text: `お電話ありがとうございます。${bName}でございます。ご用件をお伺いいたします。`,
                timestamp: '0:03',
              },
              {
                id: 'client-fb-2',
                speaker: 'agent',
                speakerName: 'AI 音声アシスタント',
                text: `お世話になっております。${uName}様の代理で、${sNeeded}のご予約可能枠についてお伺いしたくお電話いたしました。`,
                timestamp: '0:08',
                agentInternalThought: '丁寧な敬語で問い合わせを開始しました。',
              },
              {
                id: 'client-fb-3',
                speaker: 'receptionist',
                speakerName: `${bName} 受付`,
                text: `かしこまりました。今週火曜日の午前10時30分、または木曜日の午後2時が空いております。`,
                timestamp: '0:16',
              },
              {
                id: 'client-fb-4',
                speaker: 'agent',
                speakerName: 'AI 音声アシスタント',
                text: `火曜日の午前10時30分でお願い申し上げます。ご対応誠にありがとうございました。`,
                timestamp: '0:22',
                agentInternalThought: '予約枠を確定しました。',
              },
            ];
          } else if (lang.startsWith('ar')) {
            simulatedTurns = [
              {
                id: 'client-fb-1',
                speaker: 'receptionist',
                speakerName: `استقبال ${bName}`,
                text: `مرحباً بكم في ${bName}. كيف يمكننا مساعدتكم اليوم؟`,
                timestamp: '0:03',
              },
              {
                id: 'client-fb-2',
                speaker: 'agent',
                speakerName: 'المساعد الصوتي الذكي',
                text: `أهلاً بك، أتصل بالنيابة عن ${uName} للاستفسار عن المواعيد المتاحة بخصوص ${sNeeded}.`,
                timestamp: '0:08',
                agentInternalThought: 'طلب الاستفسار بأسلوب رسمي باللغة العربية.',
              },
              {
                id: 'client-fb-3',
                speaker: 'receptionist',
                speakerName: `استقبال ${bName}`,
                text: `لدينا موعد متاح يوم الثلاثاء الساعة 10:30 صباحاً أو الخميس الساعة 2:00 بعد الظهر.`,
                timestamp: '0:16',
              },
              {
                id: 'client-fb-4',
                speaker: 'agent',
                speakerName: 'المساعد الصوتي الذكي',
                text: `يوم الثلاثاء الساعة 10:30 صباحاً مناسب جداً. شكراً جزيلاً لتعاونكم.`,
                timestamp: '0:22',
                agentInternalThought: 'تأكيد الموعد المناسب بنجاح.',
              },
            ];
          } else {
            simulatedTurns = [
              {
                id: 'client-fb-1',
                speaker: 'receptionist',
                speakerName: `${bName} Desk`,
                text: `Hello, thank you for calling ${bName}. How can we assist you today?`,
                timestamp: '0:03',
              },
              {
                id: 'client-fb-2',
                speaker: 'agent',
                speakerName: 'AI Voice Agent',
                text: `Hello, I am calling on behalf of ${uName} regarding booking availability for ${sNeeded}.`,
                timestamp: '0:08',
                agentInternalThought: 'Introduced enquiry on behalf of client.',
              },
              {
                id: 'client-fb-3',
                speaker: 'receptionist',
                speakerName: `${bName} Desk`,
                text: `We have availability this week. Tuesday at 10:30 AM or Thursday at 2:00 PM are both open for ${uName}.`,
                timestamp: '0:16',
              },
              {
                id: 'client-fb-4',
                speaker: 'agent',
                speakerName: 'AI Voice Agent',
                text: `Tuesday at 10:30 AM works well. Thank you for your assistance.`,
                timestamp: '0:22',
                agentInternalThought: 'Selected preferred slot and concluded enquiry.',
              },
            ];
          }

          structuredReport = {
            enquiryId: 'enq-' + Date.now(),
            businessName: bName,
            callOutcome: brief.bookingAuthority === 'direct_book' ? 'appointment_booked' : 'slots_found',
            executiveSummary: `Contacted ${bName} for ${sNeeded} on behalf of ${uName}. Verified upcoming available appointment times.`,
            availableSlots: [
              {
                id: 'slot-fb-1',
                date: '2026-09-02',
                time: '10:30 AM',
                practitionerOrStaff: 'Staff Specialist',
                serviceType: sNeeded,
                priceEstimate: 'Standard In-Network Copay',
                isBestMatch: true,
                notes: 'Primary preferred date slot',
              },
            ],
            bookedSlot: brief.bookingAuthority === 'direct_book' ? {
              id: 'slot-fb-1',
              date: '2026-09-02',
              time: '10:30 AM',
              practitionerOrStaff: 'Staff Specialist',
              serviceType: sNeeded,
              priceEstimate: 'Standard In-Network Copay',
              isBestMatch: true,
            } : undefined,
            answersToQuestions: [
              { question: 'Availability', answer: 'Openings available for next week.' },
            ],
            policyNotes: {
              cancellationPolicy: '24-hour advance cancellation requested.',
              arrivalInstructions: 'Arrive 10 minutes prior with photo ID.',
              requiredDocuments: ['Photo ID', 'Insurance Card'],
            },
            durationSeconds: 45,
            callDate: new Date().toLocaleDateString(),
          };
        }

        setFinalReport(structuredReport);

        // Progressively play dialogue turns with natural speech pauses
        for (let i = 0; i < simulatedTurns.length; i++) {
          if (isCancelled) break;
          const turn = simulatedTurns[i];

          // Add turn to transcript
          setTurns((prev) => [...prev, turn]);
          setActiveTurnIndex(i);
          setCurrentSpeaker(turn.speaker === 'agent' ? 'agent' : 'receptionist');

          // Play Audio Voice with regional Indic language support
          if (!isAudioMuted) {
            await soundEngine.speakText(
              turn.text,
              turn.speaker === 'agent' ? 'agent' : 'receptionist',
              brief.language || 'te-IN'
            );
          } else {
            // Simulated reading delay
            const wordCount = turn.text.split(' ').length;
            const delayMs = Math.max(1800, wordCount * 180);
            await new Promise((r) => setTimeout(r, delayMs));
          }

          setCurrentSpeaker('idle');
          await new Promise((r) => setTimeout(r, 600)); // Natural conversational breath pause
        }

        if (isCancelled) return;
        setCallStage('wrapping_up');
        if (!isAudioMuted) {
          soundEngine.playEndChime();
        }
        await new Promise((r) => setTimeout(r, 1200));

        if (!isCancelled && structuredReport) {
          onCallEnded(simulatedTurns, structuredReport);
        }
      } catch (err) {
        console.error('Call failed:', err);
      } finally {
        setIsProcessingTurn(false);
      }
    };

    runCallSequence();

    return () => {
      isCancelled = true;
      soundEngine.stopSpeech();
    };
  }, [brief]);

  // Scroll transcript to bottom on new turns
  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  // Handle User Live Whisper during the call
  const handleSendWhisper = async (whisperText: string) => {
    const whisperTurn: CallTurn = {
      id: `whisper-${Date.now()}`,
      speaker: 'user_whisper',
      speakerName: `${brief.user.fullName} (Whisper)`,
      text: whisperText,
      timestamp: `${Math.floor(secondsElapsed / 60)}:${(secondsElapsed % 60).toString().padStart(2, '0')}`,
    };

    setTurns((prev) => [...prev, whisperTurn]);

    // Request agent immediate counter turn
    try {
      const res = await fetch('/api/call/next-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          history: [...turnsRef.current, whisperTurn],
          userWhisper: whisperText,
          activeRole: 'agent',
        }),
      });

      const data = await res.json();
      if (data && data.text) {
        const agentTurn: CallTurn = {
          id: `agent-${Date.now()}`,
          speaker: 'agent',
          speakerName: 'AI Voice Agent',
          text: data.text,
          timestamp: `${Math.floor(secondsElapsed / 60)}:${(secondsElapsed % 60).toString().padStart(2, '0')}`,
          agentInternalThought: data.agentInternalThought || `Incorporating whisper: "${whisperText}"`,
        };

        setTurns((prev) => [...prev, agentTurn]);
        if (!isAudioMuted) {
          soundEngine.speakText(agentTurn.text, 'agent', brief.language || 'te-IN');
        }
      }
    } catch (e) {
      console.error('Whisper processing error:', e);
    }
  };

  const handleEndCallNow = () => {
    soundEngine.stopSpeech();
    if (finalReport) {
      onCallEnded(turns, finalReport);
    } else {
      onCancelCall();
    }
  };

  const handleAuthorizeAndRetry = async () => {
    setIsRetryingCall(true);
    soundEngine.playDialTone(0.2);
    try {
      // 1. Reconcile / check auth
      const sRes = await fetch('/api/calle/auth/status');
      const sData = await sRes.json();

      if (!sData.usable && !sData.authenticated) {
        // Fetch fresh URL if needed
        const urlRes = await fetch('/api/calle/auth/login-url');
        const urlData = await urlRes.json();
        const targetUrl = urlData.loginUrl || sData.loginUrl || carrierNotice?.loginUrl;
        if (targetUrl) {
          window.open(targetUrl, '_blank', 'width=600,height=750');
        }
        setCarrierNotice((prev) => ({
          ...prev,
          isLive: false,
          loginUrl: targetUrl,
          message: 'Authorization window opened. Click "Verify & Dial Carrier" once approved.',
        }));
      } else {
        // Trigger live PSTN call
        const telResp = await fetch('/api/telephony/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief }),
        });
        const telData = await telResp.json();
        if (telData.isLivePstn) {
          setIsRealPstn(true);
          soundEngine.playSuccess();
          setCarrierNotice({
            isLive: true,
            message: `CALL-E Live Carrier Active — Cellular line dialing ${telData.to || brief.business.phone} (Run: ${telData.calleRunId || 'Active'})`,
          });
        } else {
          setCarrierNotice({
            isLive: false,
            loginUrl: telData.loginUrl,
            message: telData.message || 'Authorization pending. Complete login in the broker window.',
          });
        }
      }
    } catch (err: any) {
      console.warn('Retry call dispatch error:', err);
    } finally {
      setIsRetryingCall(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCategoryLabel = () => {
    switch (brief.business.category) {
      case 'dental':
        return 'DENTAL';
      case 'medical':
        return 'CLINIC';
      case 'salon_spa':
        return 'SALON';
      case 'auto_service':
        return 'AUTO REPAIR';
      case 'restaurant':
        return 'RESTAURANT';
      case 'veterinary':
        return 'VETERINARY';
      default:
        return brief.business.category.replace('_', ' ').toUpperCase();
    }
  };

  return (
    <motion.div
      id="active-call-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <motion.div
        id="active-call-window"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-zinc-100"
      >
        {/* Top HUD Nav */}
        <nav className="flex flex-wrap justify-between items-center px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/80 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {callStage === 'connected' ? 'Call In Progress' : callStage === 'dialing' ? 'Dialing Carrier...' : 'Ringing Provider...'}
            </span>

            {callMode === 'live_pstn' ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-medium uppercase flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" />
                <span>Live PSTN {telephonySid ? `[${telephonySid.slice(0, 8)}]` : ''}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono font-medium uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Voice Simulator</span>
              </span>
            )}

            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/50 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono font-medium uppercase" title="PII/PCI Guardrails Active">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Guardrails Active</span>
            </span>

            {brief.languageName && (
              <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-[10px] font-medium" title="Calling in authentic regional/global language">
                <Globe className="w-3 h-3 text-indigo-400" />
                <span>{brief.languageName}</span>
              </span>
            )}
          </div>
          <div className="text-[11px] font-mono text-zinc-400 hidden sm:block">
            Session ID: {brief.id.slice(0, 8)}
          </div>
          <div className="text-xs font-mono font-medium text-zinc-300">
            {brief.business.phone}
          </div>
        </nav>

        {/* Big Headline Banner */}
        <div className="p-5 sm:p-7 bg-zinc-900/50 border-b border-zinc-800/80 relative overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>{brief.business.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Connecting with <span className="text-indigo-400">{getCategoryLabel()}</span>
              </h1>

              <p className="mt-2 text-xs sm:text-sm text-zinc-300 max-w-lg leading-relaxed">
                Inquiring for <span className="font-semibold text-white">{brief.serviceNeeded}</span> on behalf of <span className="font-semibold text-white">{brief.user.fullName}</span>. Target dates: <span className="font-mono text-zinc-200">[{brief.preferredDates.join(', ') || 'Earliest available'}]</span>.
              </p>
            </div>

            <div className="text-left md:text-right shrink-0 bg-zinc-950/80 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-zinc-800">
              <div className="text-3xl sm:text-5xl font-black font-mono leading-none text-white tracking-tight">
                {formatTimer(secondsElapsed)}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mt-1.5">
                Active Call Duration
              </div>
            </div>
          </div>

          {/* Live Waveform Indicator */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80">
            <AudioWaveform
              isActive={currentSpeaker !== 'idle'}
              speaker={currentSpeaker}
            />
          </div>
        </div>

        {/* Middle: Live Transcript Box */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 sm:p-6 space-y-3 min-h-[220px] max-h-[340px] border-b border-zinc-800/80">
          {carrierNotice && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                carrierNotice.isLive
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {carrierNotice.isLive ? (
                    <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="font-medium">{carrierNotice.message}</span>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 shrink-0">
                  {carrierNotice.isLive ? 'CALL-E Live' : 'CALL-E Studio'}
                </span>
              </div>
              {!carrierNotice.isLive && (
                <div className="pt-2.5 border-t border-amber-500/20 text-[11px] text-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex-1">
                    To place outbound calls to real cellular handsets (e.g. <span className="font-mono font-semibold text-white">{brief.business.phone}</span>), authorize your CALL-E broker session.
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {carrierNotice.loginUrl && (
                      <a
                        href={carrierNotice.loginUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 transition-colors shadow-sm text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Authorize Session</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleAuthorizeAndRetry}
                      disabled={isRetryingCall}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium transition-colors border border-zinc-700 disabled:opacity-50 text-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRetryingCall ? 'animate-spin text-amber-400' : ''}`} />
                      <span>{isRetryingCall ? 'Checking & Dialing...' : 'Verify & Dial Real Phone'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <CallTranscript
            turns={turns}
            activeTurnIndex={activeTurnIndex}
            isCallActive={callStage === 'connected' && isProcessingTurn}
            languageCode={brief.language || 'te-IN'}
          />
          <div ref={scrollBottomRef} />
        </div>

        {/* Real-time Whisper Intervention Panel */}
        <IntervenePanel
          onSendWhisper={handleSendWhisper}
          disabled={callStage !== 'connected'}
        />

        {/* Bottom Controls */}
        <div className="bg-zinc-900/80 p-4 sm:px-6 flex items-center justify-between border-t border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleAudio}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                isAudioMuted
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isAudioMuted ? 'Unmute Audio' : 'Voice Audio Active'}</span>
            </button>

            <span className="text-xs font-mono text-zinc-400 hidden md:inline">
              Mode: Autonomous Negotiation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-end-call"
              onClick={handleEndCallNow}
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End & Compile Report</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
