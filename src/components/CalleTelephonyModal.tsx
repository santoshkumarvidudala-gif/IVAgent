import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Radio,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Server,
  Zap,
  Cpu,
  Copy,
  Check,
  X,
  ArrowRight,
  Info,
  Terminal,
  RefreshCw,
  LogOut,
  Play,
  Key,
} from 'lucide-react';
import { TelephonyConfig } from '../types';
import { soundEngine } from '../utils/audio';

interface CalleTelephonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

export const CalleTelephonyModal: React.FC<CalleTelephonyModalProps> = ({
  isOpen,
  onClose,
  appUrl,
}) => {
  const [config, setConfig] = useState<TelephonyConfig>({
    configured: true,
    provider: 'calle',
    calleAuthenticated: false,
    calleBrokerUrl: 'https://seleven-mcp-sg.airudder.com',
    appUrl: appUrl || window.location.origin,
  });

  const [activeTab, setActiveTab] = useState<'caller' | 'auth' | 'mcp_tools' | 'cli_docs'>('caller');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Direct Call Dispatch State
  const [targetPhone, setTargetPhone] = useState('+918886002844');
  const [callGoal, setCallGoal] = useState('Call clinic reception to inquire about doctor consultation availability for tomorrow morning and verify consultation fees.');
  const [callRegion, setCallRegion] = useState('IN');
  const [callLanguage, setCallLanguage] = useState('English');
  const [calleLoading, setCalleLoading] = useState(false);
  const [calleRunStatus, setCalleRunStatus] = useState<string | null>(null);
  const [calleRunId, setCalleRunId] = useState<string | null>(null);
  const [calleLogs, setCalleLogs] = useState<string[]>([]);

  // Auth States
  const [calleAuthStatus, setCalleAuthStatus] = useState<any | null>(null);
  const [authRefreshing, setAuthRefreshing] = useState(false);
  const [loginUrlLoading, setLoginUrlLoading] = useState(false);
  const [activeLoginUrl, setActiveLoginUrl] = useState<string | null>(null);

  // MCP Tools State
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      fetchCalleStatus();
      fetchMcpTools();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/telephony/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchCalleStatus = async () => {
    setAuthRefreshing(true);
    try {
      const res = await fetch('/api/calle/auth/status');
      if (res.ok) {
        const data = await res.json();
        setCalleAuthStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setAuthRefreshing(false);
    }
  };

  const fetchMcpTools = async () => {
    setLoadingTools(true);
    try {
      const res = await fetch('/api/calle/mcp/tools');
      if (res.ok) {
        const data = await res.json();
        setMcpTools(data.tools || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingTools(false);
    }
  };

  const handleStartCalleAuth = async () => {
    setLoginUrlLoading(true);
    soundEngine.playDialTone(0.2);
    try {
      const res = await fetch('/api/calle/auth/login-url');
      const data = await res.json();
      if (data.success && data.loginUrl) {
        setActiveLoginUrl(data.loginUrl);
        window.open(data.loginUrl, '_blank', 'width=600,height=750');

        let pollCount = 0;
        const poll = setInterval(async () => {
          pollCount++;
          if (pollCount > 30) {
            clearInterval(poll);
            return;
          }
          const sRes = await fetch('/api/calle/auth/status');
          if (sRes.ok) {
            const sData = await sRes.json();
            setCalleAuthStatus(sData);
            if (sData.authenticated || sData.usable) {
              clearInterval(poll);
              soundEngine.playSuccess();
              fetchConfig();
            }
          }
        }, 3000);
      }
    } catch (err) {
      console.warn('CALL-E Auth URL generation error:', err);
    } finally {
      setLoginUrlLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      soundEngine.playDtmfTone(697, 1209, 0.1);
      await fetch('/api/calle/auth/logout', { method: 'POST' });
      await fetchCalleStatus();
      await fetchConfig();
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    soundEngine.playDtmfTone(697, 1209, 0.05);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Direct Call Dispatch using CALL-E CLI
  const handleExecuteCalleCall = async () => {
    if (!targetPhone.trim()) return;
    setCalleLoading(true);
    setCalleRunStatus('Dispatching outbound phone call via CALL-E engine...');
    setCalleLogs([
      `[${new Date().toLocaleTimeString()}] Initializing CALL-E telephony dispatcher for ${targetPhone}...`,
      `[${new Date().toLocaleTimeString()}] Target Region: ${callRegion} | Language: ${callLanguage}`,
    ]);
    soundEngine.playDialTone(0.3);

    try {
      // Direct call attempt via unified backend
      const directRes = await fetch('/api/calle/call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: targetPhone.trim(),
          goal: callGoal || 'Call recipient to confirm appointment availability and timings',
          region: callRegion,
          language: callLanguage,
        }),
      });
      const directData = await directRes.json();

      if (directData.authRequired) {
        setActiveLoginUrl(directData.loginUrl);
        setCalleLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] CALL-E Broker authorization required.`,
          `[${new Date().toLocaleTimeString()}] Login URL: ${directData.loginUrl || 'Available in Auth Tab'}`,
        ]);
        setCalleRunStatus('CALL-E authorization required. Click "Authorize CALL-E Session" above or switch to Auth tab.');
        setCalleLoading(false);
        return;
      }

      let runId = directData.runId;

      // If direct call didn't yield a runId, fallback to plan + run
      if (!runId) {
        setCalleLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Direct call queued. Generating MCP plan for carrier dispatch...`,
        ]);

        const planRes = await fetch('/api/calle/plan-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to_phones: [targetPhone.trim()],
            goal: callGoal || 'Call recipient to confirm appointment availability and timings',
            region: callRegion,
            language: callLanguage,
            user_input: `Call ${targetPhone.trim()} with goal: ${callGoal}`,
          }),
        });

        const planData = await planRes.json();
        const planResult = planData.result;
        const planId = planData.plan_id || planResult?.plan_id || planResult?.plan?.plan_id;
        const confirmToken = planData.confirm_token || planResult?.confirm_token || planResult?.plan?.confirm_token;

        if (!planId || !confirmToken) {
          throw new Error(planData.error || 'Failed to acquire plan_id or confirm_token');
        }

        setCalleLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] CALL-E Plan confirmed (ID: ${planId})`,
          `[${new Date().toLocaleTimeString()}] Dispatching run_call to carrier gateway...`,
        ]);

        const runRes = await fetch('/api/calle/run-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_id: planId,
            confirm_token: confirmToken,
          }),
        });

        const runData = await runRes.json();
        runId = runData.run_id || runData.result?.run_id;
      }

      if (!runId) {
        throw new Error('Could not establish carrier run session ID');
      }

      setCalleRunId(runId);
      setCalleLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Call dispatched successfully! Run ID: ${runId}`,
        `[${new Date().toLocaleTimeString()}] Real-time carrier state: CALLING / RINGING`,
      ]);
      setCalleRunStatus('Call active on cellular carrier network. Polling status...');

      // 3. Poll call status
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > 25) {
          clearInterval(pollInterval);
          setCalleLoading(false);
          return;
        }

        try {
          const pollRes = await fetch('/api/calle/get-call-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ run_id: runId }),
          });

          if (pollRes.ok) {
            const pollData = await pollRes.json();
            const childRuns = pollData.result?.child_runs || [];
            const latestStatus = childRuns[childRuns.length - 1]?.status || pollData.result?.status || 'active';
            setCalleRunStatus(`Live carrier status: ${latestStatus.toUpperCase()}`);

            if (latestStatus === 'succeeded' || latestStatus === 'failed' || latestStatus === 'cancelled') {
              clearInterval(pollInterval);
              setCalleLoading(false);
              setCalleLogs((prev) => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] Call finished with status: ${latestStatus.toUpperCase()}`,
              ]);
            }
          }
        } catch {
          // ignore
        }
      }, 3000);
    } catch (err: any) {
      setCalleRunStatus(`Error: ${err.message}`);
      setCalleLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] CALL-E Dispatch Exception: ${err.message}`,
      ]);
      setCalleLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">
                  CALL-E Telephony Engine & MCP Console
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  Exclusive Provider
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Autonomous outbound voice dialing powered exclusively by CALL-E MCP Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 px-6 bg-zinc-950/30">
          <button
            onClick={() => setActiveTab('caller')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'caller'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Outbound Caller</span>
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'auth'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Auth & Session Broker</span>
            {calleAuthStatus?.usable && (
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('mcp_tools')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'mcp_tools'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>MCP Tools ({mcpTools.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('cli_docs')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'cli_docs'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>CLI Reference</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OUTBOUND CALLER */}
          {activeTab === 'caller' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-3">
                <Radio className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-zinc-300">
                  <span className="font-semibold text-white">Direct CALL-E Outbound Caller: </span>
                  This executes real telephone calls using the CALL-E MCP engine. The agent negotiates conversationally, adapts to receptionists, and returns structured confirmation data.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300">
                    Destination Phone Number (E.164)
                  </label>
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="+918886002844"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                  <span className="text-[11px] text-zinc-500">
                    Format with country code: e.g. +91 for India, +1 for US/Canada, +44 for UK.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Region Hint</label>
                    <select
                      value={callRegion}
                      onChange={(e) => setCallRegion(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="IN">IN (India)</option>
                      <option value="US">US (United States)</option>
                      <option value="GB">GB (United Kingdom)</option>
                      <option value="CN">CN (China)</option>
                      <option value="AU">AU (Australia)</option>
                      <option value="SG">SG (Singapore)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Language Hint</label>
                    <select
                      value={callLanguage}
                      onChange={(e) => setCallLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <optgroup label="Regional Indian Languages">
                        <option value="Telugu">Telugu (తెలుగు)</option>
                        <option value="Hindi">Hindi (हिन्दी)</option>
                        <option value="Tamil">Tamil (தமிழ்)</option>
                        <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                        <option value="Malayalam">Malayalam (മലയാളം)</option>
                        <option value="Marathi">Marathi (मराठी)</option>
                        <option value="Bengali">Bengali (বাংলা)</option>
                        <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                        <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                        <option value="English">English (India)</option>
                      </optgroup>
                      <optgroup label="International">
                        <option value="English">English (US/UK)</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300">
                  Call Objective & Autonomous Instruction
                </label>
                <textarea
                  value={callGoal}
                  onChange={(e) => setCallGoal(e.target.value)}
                  rows={3}
                  placeholder="Enter specific instructions for the CALL-E agent..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-indigo-500 leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Carrier Line Engine:</span>
                  <span className="text-xs font-mono font-medium text-emerald-400">
                    CALL-E Autonomous Protocol
                  </span>
                </div>
                <button
                  onClick={handleExecuteCalleCall}
                  disabled={calleLoading || !targetPhone.trim()}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  {calleLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Call...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Start CALL-E Outbound Call</span>
                    </>
                  )}
                </button>
              </div>

              {/* Real-Time Call Progress & Output */}
              {(calleLoading || calleLogs.length > 0) && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs text-zinc-300 font-semibold">CALL-E Telemetry Stream</span>
                    </div>
                    {calleRunStatus && (
                      <span className="text-[11px] text-indigo-300 font-mono bg-indigo-950/80 px-2.5 py-0.5 rounded border border-indigo-500/30">
                        {calleRunStatus}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-[11px] max-h-48 overflow-y-auto pr-2">
                    {calleLogs.map((log, index) => (
                      <div key={index} className="text-zinc-400 leading-tight">
                        {log}
                      </div>
                    ))}
                  </div>

                  {calleRunId && (
                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <span>Active CALL-E Run ID: <strong className="text-white">{calleRunId}</strong></span>
                      <button
                        onClick={() => handleCopy(calleRunId, 'runId')}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        {copiedKey === 'runId' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy ID
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTH & SESSION BROKER */}
          {activeTab === 'auth' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">CALL-E Authorization Status</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Broker endpoint: <code className="text-indigo-300 font-mono">https://seleven-mcp-sg.airudder.com</code>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchCalleStatus}
                    disabled={authRefreshing}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${authRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg bg-red-950/40 border border-red-800/40 hover:bg-red-900/50 text-red-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Clear Cache</span>
                  </button>
                </div>
              </div>

              {/* Status Indicator Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-xs text-zinc-400 mb-1">Session Token</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${calleAuthStatus?.usable ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50' : 'bg-amber-400'}`} />
                    <span className="text-sm font-medium text-white">
                      {calleAuthStatus?.usable ? 'Active & Usable' : 'Authorization Required'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-xs text-zinc-400 mb-1">Cache Integrity</div>
                  <div className="text-sm font-medium text-white">
                    {calleAuthStatus?.cache_exists ? 'Cache Present' : 'Empty Cache'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <div className="text-xs text-zinc-400 mb-1">Broker Channel</div>
                  <div className="text-sm font-mono text-indigo-300">
                    openagent_oauth
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-white">Authenticate CALL-E Session</h4>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      Initiate secure OAuth handshake with the CALL-E Airudder broker. This allows physical calls to be placed to real cellular/landline networks.
                    </p>
                  </div>
                  <button
                    onClick={handleStartCalleAuth}
                    disabled={loginUrlLoading}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shrink-0 transition-colors shadow-lg"
                  >
                    {loginUrlLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                    <span>Authorize Session</span>
                  </button>
                </div>

                {activeLoginUrl && (
                  <div className="pt-3 border-t border-indigo-500/20 flex items-center justify-between text-xs">
                    <span className="text-indigo-200/80 truncate font-mono text-[11px] max-w-md">
                      {activeLoginUrl}
                    </span>
                    <a
                      href={activeLoginUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-white underline font-mono text-[11px] shrink-0"
                    >
                      Open Link ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Raw JSON Debug View */}
              {calleAuthStatus && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] space-y-2">
                  <div className="text-xs text-zinc-400 font-semibold uppercase">CLI Auth Status Dump</div>
                  <pre className="text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(calleAuthStatus, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MCP TOOLS */}
          {activeTab === 'mcp_tools' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Exposed CALL-E MCP Tools</h3>
                  <p className="text-xs text-zinc-400">Available via Model Context Protocol JSON-RPC standard</p>
                </div>
                <button
                  onClick={fetchMcpTools}
                  disabled={loadingTools}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTools ? 'animate-spin' : ''}`} />
                  <span>Refresh Tools</span>
                </button>
              </div>

              <div className="space-y-3">
                {mcpTools.length === 0 && !loadingTools && (
                  <div className="p-8 text-center text-zinc-500 text-xs rounded-xl bg-zinc-950 border border-zinc-800">
                    No MCP tools discovered or server still starting. Click Refresh Tools.
                  </div>
                )}

                {mcpTools.map((tool, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-mono font-bold text-white">{tool.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        CALL-E Tool
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{tool.description}</p>
                    {tool.inputSchema && (
                      <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/80">
                        Required: {(tool.inputSchema.required || []).join(', ') || 'none'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CLI REFERENCE */}
          {activeTab === 'cli_docs' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h3 className="text-sm font-semibold text-white">CALL-E CLI Cheatsheet</h3>
                <p className="text-xs text-zinc-400">
                  The application uses the official <code className="text-indigo-400">@call-e/cli</code> package directly within Node.js:
                </p>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-zinc-300">1. Instant Outbound Dial:</div>
                    <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-emerald-400 flex items-center justify-between">
                      <span>calle call start --to-phone "+918886002844" --goal "Confirm booking" --json</span>
                      <button
                        onClick={() => handleCopy('calle call start --to-phone "+918886002844" --goal "Confirm booking" --json', 'cmd1')}
                        className="text-zinc-500 hover:text-white"
                      >
                        {copiedKey === 'cmd1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-zinc-300">2. Two-Step Plan & Confirm:</div>
                    <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-emerald-400 flex items-center justify-between">
                      <span>calle call plan --to-phone "+918886002844" --goal "Inquire about schedule" --json</span>
                      <button
                        onClick={() => handleCopy('calle call plan --to-phone "+918886002844" --goal "Inquire about schedule" --json', 'cmd2')}
                        className="text-zinc-500 hover:text-white"
                      >
                        {copiedKey === 'cmd2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-zinc-300">3. Check Call Run Status:</div>
                    <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-emerald-400 flex items-center justify-between">
                      <span>calle call status --run-id &lt;run_id&gt; --json</span>
                      <button
                        onClick={() => handleCopy('calle call status --run-id <run_id> --json', 'cmd3')}
                        className="text-zinc-500 hover:text-white"
                      >
                        {copiedKey === 'cmd3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-zinc-300">4. Inspect Auth Status:</div>
                    <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-emerald-400 flex items-center justify-between">
                      <span>calle auth status --json</span>
                      <button
                        onClick={() => handleCopy('calle auth status --json', 'cmd4')}
                        className="text-zinc-500 hover:text-white"
                      >
                        {copiedKey === 'cmd4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sole Telephony Stack: CALL-E Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
