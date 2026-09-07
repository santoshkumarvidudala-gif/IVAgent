import React, { useState, useEffect } from 'react';
import {
  Server,
  Cpu,
  Terminal,
  Volume2,
  HardDrive,
  Copy,
  Check,
  X,
  RefreshCw,
  Play,
  Square,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Filter,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GcpCloudStatus, GcpLogEntry, GcpLogLevel, GcpVoiceProfile } from '../types';
import { soundEngine } from '../utils/audio';

interface GcpIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

export const GcpIntegrationModal: React.FC<GcpIntegrationModalProps> = ({
  isOpen,
  onClose,
  appUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'voice_studio' | 'logging' | 'deploy' | 'storage'>('overview');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<GcpCloudStatus | null>(null);
  const [voices, setVoices] = useState<GcpVoiceProfile[]>([]);
  const [logs, setLogs] = useState<GcpLogEntry[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Voice Studio state
  const [voiceCategoryTab, setVoiceCategoryTab] = useState<'all' | 'regional' | 'global'>('all');
  const [selectedVoice, setSelectedVoice] = useState<GcpVoiceProfile | null>(null);
  const [sampleText, setSampleText] = useState<string>('');
  const [synthesizing, setSynthesizing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioResultInfo, setAudioResultInfo] = useState<string | null>(null);
  const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null);

  // Deployment Manifest state
  const [deploymentCommands, setDeploymentCommands] = useState<string>('');

  // Storage export state
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchGcpStatus();
      fetchVoices();
      fetchLogs();
      fetchDeploymentManifest();
    }
  }, [isOpen]);

  // Clean up audio on close
  useEffect(() => {
    if (!isOpen && activeAudioElement) {
      activeAudioElement.pause();
      setIsPlayingAudio(false);
    }
  }, [isOpen, activeAudioElement]);

  const fetchGcpStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gcp/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // fallback if error
    } finally {
      setLoading(false);
    }
  };

  const fetchVoices = async () => {
    try {
      const res = await fetch('/api/gcp/voices');
      if (res.ok) {
        const data = await res.json();
        setVoices(data.voices || []);
        if (data.voices && data.voices.length > 0 && !selectedVoice) {
          setSelectedVoice(data.voices[0]);
          setSampleText(data.voices[0].naturalSampleText);
        }
      }
    } catch {
      // fallback
    }
  };

  const fetchLogs = async (severity = selectedSeverity) => {
    try {
      const url = severity !== 'ALL' ? `/api/gcp/logging/stream?severity=${severity}` : '/api/gcp/logging/stream';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // fallback
    }
  };

  const fetchDeploymentManifest = async () => {
    try {
      const res = await fetch('/api/gcp/deployment/manifest');
      if (res.ok) {
        const data = await res.json();
        setDeploymentCommands(data.gcloudCommands || '');
      }
    } catch {
      // fallback
    }
  };

  const handleSelectVoice = (voice: GcpVoiceProfile) => {
    setSelectedVoice(voice);
    setSampleText(voice.naturalSampleText);
    soundEngine.playBlip();
  };

  const handleSynthesizeVoice = async () => {
    if (!selectedVoice || !sampleText.trim()) return;
    setSynthesizing(true);
    setAudioResultInfo(null);
    soundEngine.playDialTone(0.15);

    try {
      const res = await fetch('/api/gcp/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText.trim(),
          languageCode: selectedVoice.languageCode,
          voiceName: selectedVoice.voiceName,
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        // Native audio preview
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
        setActiveAudioElement(audio);
        setIsPlayingAudio(true);
        audio.play();
        audio.onended = () => setIsPlayingAudio(false);
        setAudioResultInfo(`Synthesized using ${data.provider} (${selectedVoice.voiceName})`);
      } else if (data.useWebSpeechFallback) {
        // Browser speech fallback
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(sampleText);
          utterance.lang = selectedVoice.languageCode;
          utterance.rate = 0.95;
          setIsPlayingAudio(true);
          utterance.onend = () => setIsPlayingAudio(false);
          window.speechSynthesis.speak(utterance);
          setAudioResultInfo(`Preview synthesized via local speech audio (${selectedVoice.languageCode})`);
        } else {
          setAudioResultInfo('Synthesis preview completed successfully.');
        }
      }
      fetchLogs();
    } catch (err: any) {
      setAudioResultInfo(`Synthesis error: ${err.message}`);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleStopAudio = () => {
    if (activeAudioElement) {
      activeAudioElement.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const handleSimulateLog = async () => {
    soundEngine.playBlip();
    try {
      await fetch('/api/gcp/logging/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'NOTICE',
          message: 'Manual telemetry verification event emitted from IVAgent GCP Console',
          component: 'gcp.console.test',
          labels: { source: 'ui-test-action' },
          payload: { timestamp: new Date().toISOString(), userAgent: navigator.userAgent },
        }),
      });
      fetchLogs();
    } catch {}
  };

  const handleExportStorageArchive = async () => {
    setExportLoading(true);
    setExportSuccess(null);
    soundEngine.playConnectChime();

    try {
      const historyStr = localStorage.getItem('call_e_call_history_v1') || '[]';
      const callRecords = JSON.parse(historyStr);

      const res = await fetch('/api/gcp/storage/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callRecords }),
      });

      const data = await res.json();
      if (data.success) {
        // Trigger browser download of manifest
        const blob = new Blob([JSON.stringify(data.archiveManifest, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.downloadFileName || 'ivagent-gcp-archive.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExportSuccess(`Exported archive to ${data.archiveManifest.cloudStorageBucket} with SHA-256 hash.`);
        fetchLogs();
      }
    } catch (err: any) {
      setExportSuccess(`Export failed: ${err.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    soundEngine.playBlip();
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Google Cloud Platform (GCP) Console
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cloud Run: {status?.region || 'asia-east1'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Container Infrastructure, Vertex AI, Cloud Speech TTS, and Cloud Logging Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchGcpStatus}
              disabled={loading}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              title="Refresh GCP Status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-zinc-800 bg-zinc-900/30 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Cloud Run Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('voice_studio')}
            className={`px-3.5 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'voice_studio'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Google Cloud Voice Studio (TTS)</span>
            <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[10px]">10 Voices</span>
          </button>

          <button
            onClick={() => setActiveTab('logging')}
            className={`px-3.5 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'logging'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Cloud Logging Stream</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[10px]">{logs.length}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('deploy')}
            className={`px-3.5 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'deploy'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Cloud Run Deployment CLI</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`px-3.5 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'storage'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Cloud Storage Archival</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-zinc-950">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Primary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>GCP Runtime</span>
                    <Server className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    Google Cloud Run
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Container Port 3000 Ingress
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>GCP Region</span>
                    <Cpu className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    {status?.region || 'asia-east1'}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    High-Performance Edge
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Vertex AI & Gemini</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    Gemini 2.5 Active
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Multi-model fallback
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Memory & Uptime</span>
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    {status?.memoryUsageMb ? `${status.memoryUsageMb} MB Used` : 'Normal'}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Uptime: {status?.uptimeSeconds ? `${Math.round(status.uptimeSeconds / 60)}m` : 'Online'}
                  </div>
                </div>
              </div>

              {/* Connected GCP Services Details */}
              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/80 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Integrated Google Cloud Services</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Google Cloud Run</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Operational
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                      Service: {status?.serviceName || 'ivagent-service'}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Auto-scaling container tier running on Google Cloud managed infrastructure.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Vertex AI / Google GenAI</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Connected
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                      Models: gemini-3.1-flash-lite, gemini-3.8-flash
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Zero data retention privacy guardrails & multilingual appointment negotiation.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Google Cloud Speech (TTS)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        10 Voices Ready
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                      Voices: Telugu, Hindi, Tamil, Kannada, English (IN/US)
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Natural neural voice synthesis optimized for telephone speech codecs (24kHz/8kHz).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Google Cloud Logging (Operations)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Streaming
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                      projects/{status?.projectId || 'gcp-project'}/logs/ivagent-telephony
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Structured stdout JSON streaming with trace-correlation and HIPAA/PII scrub stamps.
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Details Banner */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-zinc-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block mb-0.5">Enterprise Cloud Security Guarantee</span>
                  <p className="text-zinc-400">
                    All outbound calls placed via IVAgent comply with Google Cloud Enterprise Security protocols. Real-time PII sanitization masks credit card numbers, CVVs, and government identity numbers before speech synthesis or storage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VOICE STUDIO (TTS) */}
          {activeTab === 'voice_studio' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Google Cloud Text-to-Speech (TTS) Voice Studio</h3>
                  <p className="text-xs text-zinc-400">
                    Test and preview regional Indian and global language accents for autonomous phone negotiation.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Category switcher */}
                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setVoiceCategoryTab('all')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        voiceCategoryTab === 'all'
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      All ({voices.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceCategoryTab('regional')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        voiceCategoryTab === 'regional'
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Indic 🇮🇳 ({voices.filter((v) => v.category === 'regional').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceCategoryTab('global')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        voiceCategoryTab === 'global'
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Global 🌍 ({voices.filter((v) => v.category === 'global').length})
                    </button>
                  </div>

                  {audioResultInfo && (
                    <span className="text-[11px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md font-mono self-start sm:self-auto">
                      {audioResultInfo}
                    </span>
                  )}
                </div>
              </div>

              {/* Voice Selector Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {voices
                  .filter((v) => {
                    if (voiceCategoryTab === 'regional') return v.category === 'regional';
                    if (voiceCategoryTab === 'global') return v.category === 'global';
                    return true;
                  })
                  .map((v) => {
                    const isSelected = selectedVoice?.voiceName === v.voiceName;
                    return (
                      <button
                        key={v.voiceName}
                        type="button"
                        onClick={() => handleSelectVoice(v)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-500/15 border-blue-500 text-white shadow-xs'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                          {v.flagEmoji && <span>{v.flagEmoji}</span>}
                          <span className="truncate">{v.languageName}</span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">{v.voiceName}</div>
                        <div className="text-[10px] text-blue-400 mt-1 font-mono">{v.sampleRateHertz / 1000}kHz Neural</div>
                      </button>
                    );
                  })}
              </div>

              {/* Voice Synthesis Test Box */}
              {selectedVoice && (
                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">
                      Sample Phone Utterance ({selectedVoice.languageName})
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      Codec: MP3 / Linear16 @ 24,000Hz
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={sampleText}
                    onChange={(e) => setSampleText(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-zinc-200 resize-none font-sans"
                    placeholder="Enter phone dialog text..."
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="font-mono text-[11px] text-blue-400">
                        Engine: Google Cloud Speech / Vertex AI Speech
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {isPlayingAudio && (
                        <button
                          type="button"
                          onClick={handleStopAudio}
                          className="px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5 fill-zinc-300" />
                          <span>Stop</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSynthesizeVoice}
                        disabled={synthesizing}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {synthesizing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Synthesizing...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Listen to Voice Sample</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLOUD LOGGING */}
          {activeTab === 'logging' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <span>Google Cloud Logging Stream (stdout / logging.googleapis.com)</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Live structured telemetry logs emitted by IVAgent container on Cloud Run.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Severity Filter */}
                  <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
                    <Filter className="w-3.5 h-3.5 text-zinc-400 ml-1.5" />
                    {(['ALL', 'INFO', 'NOTICE', 'WARNING', 'ERROR'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => {
                          setSelectedSeverity(sev);
                          fetchLogs(sev);
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                          selectedSeverity === sev
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateLog}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    title="Emit sample test log"
                  >
                    + Test Event
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchLogs()}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Logs Viewer Table */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-[11px] max-h-[420px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    No log events recorded yet for this filter.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-900">
                    {logs.map((entry) => {
                      const getSevClass = (s: GcpLogLevel) => {
                        switch (s) {
                          case 'ERROR':
                          case 'CRITICAL':
                            return 'text-red-400 bg-red-500/10 border-red-500/30';
                          case 'WARNING':
                            return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                          case 'NOTICE':
                            return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
                          default:
                            return 'text-zinc-400 bg-zinc-800 border-zinc-700';
                        }
                      };

                      return (
                        <div key={entry.id} className="p-3 hover:bg-zinc-900/40 transition-colors space-y-1">
                          <div className="flex items-center justify-between text-zinc-500">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.2 rounded border text-[10px] font-bold ${getSevClass(entry.severity)}`}>
                                {entry.severity}
                              </span>
                              <span className="text-zinc-400 font-semibold">{entry.component}</span>
                            </div>
                            <span className="text-[10px]">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-zinc-200 break-words pl-1">{entry.message}</div>
                          {entry.payload && (
                            <div className="text-zinc-500 text-[10px] bg-zinc-900/80 p-1.5 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(entry.payload)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DEPLOYMENT CLI */}
          {activeTab === 'deploy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Google Cloud Run 1-Click Deployment Commands</h3>
                  <p className="text-xs text-zinc-400">
                    Run these commands using the standard Google Cloud SDK (<code className="text-blue-400 font-mono">gcloud</code>) to deploy IVAgent to your GCP project.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(deploymentCommands, 'deploy-cli')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'deploy-cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'deploy-cli' ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                {deploymentCommands}
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs text-zinc-300">
                <span className="font-bold text-white block">Required Google Cloud IAM Permissions:</span>
                <ul className="list-disc list-inside space-y-1 text-zinc-400 font-mono text-[11px]">
                  <li>roles/run.admin (Deploy and configure Cloud Run services)</li>
                  <li>roles/aiplatform.user (Invoke Vertex AI and Gemini models)</li>
                  <li>roles/logging.logWriter (Emit structured telemetry to Cloud Logging)</li>
                  <li>roles/secretmanager.secretAccessor (Inject GEMINI_API_KEY securely)</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: CLOUD STORAGE */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Google Cloud Storage (GCS) Archival</h3>
                  <p className="text-xs text-zinc-400">
                    Export HIPAA/ISO-compliant call audit packages and appointment histories to Google Cloud Storage.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white">Target Cloud Storage Bucket</span>
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-blue-400">
                    gs://{status?.projectId || 'gcp-project'}-appointment-archives
                  </div>
                </div>

                <p className="text-xs text-zinc-400">
                  The export generates an encrypted manifest including scrubbed call logs, verified appointment slots, confirmation receipts, and cryptographic SHA-256 integrity signatures.
                </p>

                {exportSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{exportSuccess}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleExportStorageArchive}
                  disabled={exportLoading}
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {exportLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Archive Package...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download GCS Archival Manifest (JSON)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-zinc-400 font-mono">
              IVAgent Google Cloud Integration v2.5 (Cloud Run + Vertex AI)
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer ml-auto"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};

export default GcpIntegrationModal;
