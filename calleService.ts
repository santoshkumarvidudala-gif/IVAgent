import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface CalleExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
  parsed?: any;
  error?: string;
  authRequired?: boolean;
}

export interface CalleAuthStatus {
  authenticated: boolean;
  usable: boolean;
  status: string;
  loginUrl?: string;
  expiresAt?: string | null;
  serverUrl: string;
  brokerBaseUrl: string;
  hasApiKey: boolean;
  raw?: any;
  error?: string;
}

export interface CalleCallResult {
  success: boolean;
  isLivePstn: boolean;
  authRequired?: boolean;
  loginUrl?: string;
  runId?: string;
  planId?: string;
  to: string;
  status: string;
  provider: 'calle-mcp' | 'calle-api';
  message: string;
  raw?: any;
  error?: string;
}

export const CALLE_CONFIG = {
  serverUrl: 'https://seleven-mcp-sg.airudder.com/mcp/openagent_oauth',
  brokerBaseUrl: 'https://seleven-mcp-sg.airudder.com',
  authBaseUrl: 'https://seleven-mcp-sg.airudder.com',
  channel: 'openagent_oauth',
  scope: 'openid email profile',
  clientName: 'calle Login',
  cacheRoot: process.env.HOME ? path.join(process.env.HOME, '.calle-mcp/cli') : '/root/.calle-mcp/cli',
  timeoutSeconds: 15,
};

// Normalizes arbitrary user-entered phone number into standard E.164
export function normalizeToE164(phone: string, preferredRegion: string = 'IN'): string {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // 10 digits
  if (cleaned.length === 10) {
    if (preferredRegion === 'IN' || /^[6-9]/.test(cleaned)) {
      return `+91${cleaned}`;
    }
    return `+1${cleaned}`;
  }

  // 11 digits starting with 1 (US / North America)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // 12 digits starting with 91 (India)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }

  // Default fallback prepend +
  return `+${cleaned}`;
}

// Resolves local or global CALL-E CLI path
export function getCalleCliCommand(): string {
  const localCli = path.resolve(process.cwd(), 'node_modules/@call-e/cli/bin/calle.js');
  if (fs.existsSync(localCli)) {
    return `node "${localCli}"`;
  }
  return 'calle';
}

export async function runCalleCli(args: string, timeoutMs: number = 30000): Promise<CalleExecResult> {
  const cliCmd = getCalleCliCommand();
  const fullCmd = `env CALLE_SOURCE=skills_sh CALLE_INTEGRATION=skills_sh_skill CALLE_INTEGRATION_VERSION=0.1.0 ${cliCmd} ${args}`;
  try {
    const { stdout, stderr } = await execPromise(fullCmd, { timeout: timeoutMs });
    let parsed: any = null;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      // ignore non-json
    }
    return {
      success: true,
      stdout: stdout || '',
      stderr: stderr || '',
      parsed,
    };
  } catch (err: any) {
    const stdout = err.stdout || '';
    const stderr = err.stderr || '';
    let parsed: any = null;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      // ignore
    }
    const isAuthReq =
      parsed?.error?.code === 'auth_required' ||
      stdout.includes('auth_required') ||
      stdout.includes('usable CALL-E auth token is required') ||
      stderr.includes('auth_required');

    return {
      success: false,
      stdout,
      stderr,
      parsed,
      error: parsed?.error?.message || err.message,
      authRequired: isAuthReq,
    };
  }
}

// Reconciles active broker pending session and checks token validity
export async function checkAndReconcileCalleAuth(): Promise<CalleAuthStatus> {
  const hasApiKey = Boolean(process.env.CALLE_API_KEY && process.env.CALLE_API_KEY.trim());

  try {
    const cache = await import('@call-e/core/cache');
    const bc = await import('@call-e/core/broker-client');
    const cachePath = cache.tokenCachePath(CALLE_CONFIG.cacheRoot, CALLE_CONFIG.serverUrl);
    const cachedToken = cache.readJson(cachePath);

    if (cache.tokenIsUsable(cachedToken, 0)) {
      return {
        authenticated: true,
        usable: true,
        status: 'authorized',
        expiresAt: cachedToken?.expires_at || null,
        serverUrl: CALLE_CONFIG.serverUrl,
        brokerBaseUrl: CALLE_CONFIG.brokerBaseUrl,
        hasApiKey,
        raw: cachedToken,
      };
    }

    // Check if there is an active pending login session
    const pendingPath = cache.pendingCachePath(CALLE_CONFIG.cacheRoot, CALLE_CONFIG.serverUrl);
    const pending = cache.readPendingLogin(pendingPath);
    if (pending?.session_id) {
      try {
        const brokerStatus = await bc.getBrokerSessionStatus(CALLE_CONFIG, pending);
        const status = String(brokerStatus?.status || '').toUpperCase();

        if (status === 'AUTHORIZED') {
          // Exchange broker session for token!
          const exchanged = await bc.exchangeBrokerSession(CALLE_CONFIG, pending);
          cache.writePrivateJson(cachePath, exchanged);
          cache.removeFile(pendingPath);
          console.log('[CALL-E] Brokered OAuth successfully authorized and token stored!');
          return {
            authenticated: true,
            usable: true,
            status: 'authorized',
            expiresAt: exchanged?.expires_at || null,
            serverUrl: CALLE_CONFIG.serverUrl,
            brokerBaseUrl: CALLE_CONFIG.brokerBaseUrl,
            hasApiKey,
            raw: exchanged,
          };
        }

        if (status === 'PENDING') {
          return {
            authenticated: false,
            usable: false,
            status: 'pending',
            loginUrl: pending.login_url || brokerStatus.login_url,
            expiresAt: pending.expires_at || brokerStatus.expires_at,
            serverUrl: CALLE_CONFIG.serverUrl,
            brokerBaseUrl: CALLE_CONFIG.brokerBaseUrl,
            hasApiKey,
            raw: brokerStatus,
          };
        }
      } catch (err: any) {
        console.warn('[CALL-E] Pending status query warning:', err.message);
      }
    }
  } catch (err: any) {
    console.warn('[CALL-E] Reconcile warning:', err.message);
  }

  // Fallback to CLI
  try {
    const check = await runCalleCli('auth status --json', 5000);
    const parsed = check.parsed;
    const isUsable = Boolean(parsed?.usable);
    const hasCache = Boolean(parsed?.cache_exists);

    return {
      authenticated: isUsable || hasCache,
      usable: isUsable,
      status: isUsable ? 'authorized' : parsed?.pending_exists ? 'pending' : 'login_required',
      loginUrl: parsed?.pending_login_url,
      serverUrl: CALLE_CONFIG.serverUrl,
      brokerBaseUrl: CALLE_CONFIG.brokerBaseUrl,
      hasApiKey,
      raw: parsed,
    };
  } catch (e: any) {
    return {
      authenticated: false,
      usable: false,
      status: 'error',
      serverUrl: CALLE_CONFIG.serverUrl,
      brokerBaseUrl: CALLE_CONFIG.brokerBaseUrl,
      hasApiKey,
      error: e.message,
    };
  }
}

// Generate or retrieve fresh CALL-E Login URL
export async function getFreshCalleLoginUrl(forceLogin: boolean = false): Promise<{ success: boolean; loginUrl?: string; error?: string }> {
  try {
    const forceFlag = forceLogin ? '--force-login ' : '';
    const res = await runCalleCli(`auth login ${forceFlag}--start-only --no-browser-open --json`, 12000);
    if (res.parsed?.login_url) {
      return { success: true, loginUrl: res.parsed.login_url };
    }
    if (res.parsed?.pending_login_url) {
      return { success: true, loginUrl: res.parsed.pending_login_url };
    }
  } catch (e: any) {
    console.warn('[CALL-E] Failed to get fresh login URL:', e.message);
  }

  // Fallback to direct cache check
  try {
    const cache = await import('@call-e/core/cache');
    const pendingPath = cache.pendingCachePath(CALLE_CONFIG.cacheRoot, CALLE_CONFIG.serverUrl);
    const pending = cache.readPendingLogin(pendingPath);
    if (pending?.login_url) {
      return { success: true, loginUrl: pending.login_url };
    }
  } catch {}

  return { success: false, error: 'Could not generate CALL-E authorization session URL' };
}

/**
 * Resolves the telephone carrier network language supported by CALL-E PSTN gateway.
 * For India (+91 / 'IN'): CALL-E PSTN gateway natively supports 'English' and 'Hindi'.
 * For USA/Canada (+1 / 'US'): 'English' and 'Spanish'.
 * If the user's inquiry language is Telugu or other regional Indic languages,
 * we route the PSTN carrier audio via 'English' (or 'Hindi'), while embedding the regional context
 * and instructions into the task prompt.
 */
export function getCarrierLanguage(language: string = '', region: string = 'IN'): string {
  const norm = language.toLowerCase().trim();
  const isIndia = region === 'IN';

  if (isIndia) {
    if (norm === 'hindi' || norm === 'hi' || norm === 'hi-in') {
      return 'Hindi';
    }
    if (norm === 'tamil' || norm === 'ta' || norm === 'ta-in') {
      return 'Tamil';
    }
    // Default / fallback for India carrier: English
    return 'English';
  }

  if (region === 'US' || region === 'CA') {
    if (norm === 'spanish' || norm === 'es' || norm === 'es-us') {
      return 'Spanish';
    }
    return 'English';
  }

  return 'English';
}

// Start a real outbound call to physical phone number
export async function startRealCalleCall(params: {
  toPhone: string;
  goal: string;
  region?: string;
  language?: string;
}): Promise<CalleCallResult> {
  const { toPhone, goal, language = 'English' } = params;
  const region = params.region || (toPhone.includes('+91') ? 'IN' : 'US');
  const e164 = normalizeToE164(toPhone, region);

  // Determine carrier-compatible network language for CALL-E PSTN gateway
  let carrierLanguage = getCarrierLanguage(language, region);

  // Format goal to ensure date/time clarity and slot window so CALL-E planner doesn't stall on missing slot window
  let formattedGoal = goal;
  if (!/morning|afternoon|evening|hour|am|pm|\b\d{1,2}:\d{2}\b/i.test(formattedGoal)) {
    formattedGoal += ' Preferred timing: Morning or afternoon during clinic business hours, or earliest available open slot.';
  }
  if (!/confirm|book|reserve/i.test(formattedGoal)) {
    formattedGoal += ' Check open slots, requirements, and confirm earliest available appointment slot.';
  }

  // 1. Only try Developer API key if it is a genuine heycall-e.com key (and NOT an Airudder IAM token)
  const devApiKey = process.env.CALLE_API_KEY?.trim();
  if (devApiKey && !devApiKey.startsWith('iams_') && !devApiKey.includes('iams')) {
    try {
      const escapedGoal = formattedGoal.replace(/"/g, '\\"');
      const apiCmd = `node ./node_modules/@call-e/calle/dist/cli.js calls create --phone "${e164}" --task "${escapedGoal}" --api-key "${devApiKey}" --json`;
      const apiRes = await execPromise(apiCmd, { timeout: 35000 });
      let parsed: any = null;
      try {
        parsed = JSON.parse(apiRes.stdout);
      } catch {}

      if (parsed && (parsed.id || parsed.call_id)) {
        return {
          success: true,
          isLivePstn: true,
          runId: parsed?.id || parsed?.call_id || `calle-api-${Date.now()}`,
          to: e164,
          status: 'calling',
          provider: 'calle-api',
          message: `Dispatched real call to ${e164} via CALL-E Developer Cloud API`,
          raw: parsed,
        };
      }
    } catch {
      // Silently fall through to primary authenticated Airudder MCP Gateway
    }
  }

  // 2. Check and reconcile auth status for Airudder MCP Gateway
  const auth = await checkAndReconcileCalleAuth();

  if (!auth.usable) {
    const freshUrl = auth.loginUrl || (await getFreshCalleLoginUrl()).loginUrl;
    return {
      success: false,
      isLivePstn: false,
      authRequired: true,
      loginUrl: freshUrl,
      to: e164,
      status: 'auth_required',
      provider: 'calle-mcp',
      message: 'CALL-E authorization required to ring physical phone number.',
    };
  }

  // 3. Initiate call via CLI: `calle call start`
  const sanitizedGoal = formattedGoal.replace(/"/g, '“').replace(/'/g, '’');
  let startRes = await runCalleCli(
    `call start --to-phone "${e164}" --goal "${sanitizedGoal}" --region "${region}" --language "${carrierLanguage}" --json`,
    45000
  );

  // If carrier rejected the language, automatically fall back to English and retry immediately
  if (
    !startRes.success &&
    (startRes.error?.includes('not currently supported for calls to') ||
      startRes.stderr?.includes('not currently supported') ||
      startRes.stdout?.includes('not currently supported'))
  ) {
    console.log(`[CALL-E] Retrying with English fallback due to carrier regional limitation (${carrierLanguage} -> English)`);
    carrierLanguage = 'English';
    startRes = await runCalleCli(
      `call start --to-phone "${e164}" --goal "${sanitizedGoal}" --region "${region}" --language "English" --json`,
      45000
    );
  }

  if (startRes.success && startRes.parsed) {
    const runId =
      startRes.parsed.run_id ||
      startRes.parsed.result?.run_id ||
      startRes.parsed.result?.structuredContent?.run_id ||
      startRes.parsed.structuredContent?.run_id ||
      startRes.parsed.status_result?.structuredContent?.run_id ||
      `run-${Date.now()}`;

    return {
      success: true,
      isLivePstn: true,
      runId,
      planId: startRes.parsed.plan_id || startRes.parsed.result?.plan_id,
      to: e164,
      status: 'calling',
      provider: 'calle-mcp',
      message: `Outbound call to ${e164} placed successfully via Airudder Carrier Gateway (${carrierLanguage})`,
      raw: startRes.parsed,
    };
  }

  if (startRes.authRequired) {
    const freshUrl = (await getFreshCalleLoginUrl(true)).loginUrl;
    return {
      success: false,
      isLivePstn: false,
      authRequired: true,
      loginUrl: freshUrl,
      to: e164,
      status: 'auth_required',
      provider: 'calle-mcp',
      message: 'CALL-E auth token expired or requires re-authorization.',
      error: startRes.error,
    };
  }

  return {
    success: false,
    isLivePstn: false,
    to: e164,
    status: 'failed',
    provider: 'calle-mcp',
    message: startRes.error || 'Failed to place call via CALL-E CLI',
    raw: startRes.stdout || startRes.stderr,
    error: startRes.error,
  };
}
