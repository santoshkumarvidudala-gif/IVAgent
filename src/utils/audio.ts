// Audio helper for realistic telephone sounds and speech synthesis

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play phone DTMF beep
  playDtmfTone(freq1 = 697, freq2 = 1209, duration = 0.12) {
    try {
      const ctx = this.getContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freq1;
      osc2.frequency.value = freq2;

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + duration);
      osc2.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  // Play realistic ringing tone (US Standard: 440Hz + 480Hz dual tone)
  playRingTone(duration = 1.6) {
    try {
      const ctx = this.getContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime + duration - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + duration);
      osc2.stop(ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  // Play standard dial tone (350Hz + 440Hz)
  playDialTone(duration = 0.5) {
    try {
      const ctx = this.getContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 350;
      osc2.frequency.value = 440;

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + duration);
      osc2.stop(ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  // Play call connected chime
  playConnectChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } catch {
      // ignore
    }
  }

  // Play call end click
  playEndChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      [440, 330, 220].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.18);
      });
    } catch {
      // ignore
    }
  }

  // Play subtle UI blip
  playBlip() {
    this.playDtmfTone(1209, 1336, 0.04);
  }

  // Play UI chirp
  playChirp() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // ignore
    }
  }

  // Play operation success fanfare
  playSuccess() {
    this.playConnectChime();
  }

  // Play audio from base64 string (WAV or MP3)
  async playBase64Audio(base64Data: string, mimeType = 'audio/mp3'): Promise<void> {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(`data:${mimeType};base64,${base64Data}`);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      } catch {
        resolve();
      }
    });
  }

  // Asynchronously retrieve voices with browser event fallback
  private getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve([]);
        return;
      }
      const initialVoices = window.speechSynthesis.getVoices();
      if (initialVoices && initialVoices.length > 0) {
        resolve(initialVoices);
        return;
      }

      const handler = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);

      // Fallback timeout if voiceschanged doesn't fire
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(window.speechSynthesis.getVoices());
      }, 350);
    });
  }

  // Play text via Web Speech API with full regional Indic language support
  async speakText(
    text: string,
    role: 'agent' | 'receptionist',
    languageCode?: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (!('speechSynthesis' in window) || !text) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
    } catch {}

    const voices = await this.getVoicesAsync();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Map language codes to standard BCP-47 tags
      const rawCode = (languageCode || 'te-IN').trim().toLowerCase();
      let targetLang = 'te-IN';
      let langPrefix = 'te';

      if (rawCode.startsWith('hi')) {
        targetLang = 'hi-IN';
        langPrefix = 'hi';
      } else if (rawCode.startsWith('ta')) {
        targetLang = 'ta-IN';
        langPrefix = 'ta';
      } else if (rawCode.startsWith('kn')) {
        targetLang = 'kn-IN';
        langPrefix = 'kn';
      } else if (rawCode.startsWith('ml')) {
        targetLang = 'ml-IN';
        langPrefix = 'ml';
      } else if (rawCode.startsWith('mr')) {
        targetLang = 'mr-IN';
        langPrefix = 'mr';
      } else if (rawCode.startsWith('bn')) {
        targetLang = 'bn-IN';
        langPrefix = 'bn';
      } else if (rawCode.startsWith('gu')) {
        targetLang = 'gu-IN';
        langPrefix = 'gu';
      } else if (rawCode.startsWith('pa')) {
        targetLang = 'pa-IN';
        langPrefix = 'pa';
      } else if (rawCode.startsWith('ur')) {
        targetLang = 'ur-IN';
        langPrefix = 'ur';
      } else if (rawCode === 'en-us' || rawCode.startsWith('en-us')) {
        targetLang = 'en-US';
        langPrefix = 'en';
      } else if (rawCode === 'en-gb' || rawCode.startsWith('en-gb')) {
        targetLang = 'en-GB';
        langPrefix = 'en';
      } else if (rawCode === 'en-in' || rawCode.startsWith('en-in')) {
        targetLang = 'en-IN';
        langPrefix = 'en';
      } else if (rawCode.startsWith('en')) {
        targetLang = 'en-US';
        langPrefix = 'en';
      } else if (rawCode.startsWith('es')) {
        targetLang = 'es-ES';
        langPrefix = 'es';
      } else if (rawCode.startsWith('fr')) {
        targetLang = 'fr-FR';
        langPrefix = 'fr';
      } else if (rawCode.startsWith('de')) {
        targetLang = 'de-DE';
        langPrefix = 'de';
      } else if (rawCode.startsWith('ja')) {
        targetLang = 'ja-JP';
        langPrefix = 'ja';
      } else if (rawCode.startsWith('ar')) {
        targetLang = 'ar-SA';
        langPrefix = 'ar';
      } else if (rawCode.startsWith('pt')) {
        targetLang = 'pt-BR';
        langPrefix = 'pt';
      } else if (rawCode.startsWith('it')) {
        targetLang = 'it-IT';
        langPrefix = 'it';
      } else if (rawCode.startsWith('zh')) {
        targetLang = 'zh-CN';
        langPrefix = 'zh';
      } else if (rawCode.startsWith('ko')) {
        targetLang = 'ko-KR';
        langPrefix = 'ko';
      } else if (rawCode.includes('-')) {
        targetLang = rawCode;
        langPrefix = rawCode.split('-')[0];
      } else {
        targetLang = rawCode;
        langPrefix = rawCode;
      }

      utterance.lang = targetLang;

      // Find matching voices for this specific regional or global language
      const matchingVoices = voices.filter((v) => {
        const vl = v.lang.toLowerCase().replace('_', '-');
        const vn = v.name.toLowerCase();
        return (
          vl.startsWith(langPrefix) ||
          vl === targetLang.toLowerCase() ||
          vn.includes(langPrefix)
        );
      });

      const isEnglish = langPrefix === 'en';

      if (matchingVoices.length > 0) {
        // Find best dialect match if possible
        const exactDialectVoice = matchingVoices.find((v) => {
          const vl = v.lang.toLowerCase().replace('_', '-');
          return vl === targetLang.toLowerCase();
        });
        const primaryVoice = exactDialectVoice || matchingVoices[0];

        if (role === 'agent') {
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          utterance.voice = primaryVoice;
        } else {
          utterance.rate = 0.98;
          utterance.pitch = 1.06;
          utterance.voice = matchingVoices.length > 1 ? matchingVoices[1] : primaryVoice;
        }
      } else if (isEnglish) {
        // Fallback for English: Indian English or general English
        const inEnVoice =
          voices.find((v) => v.lang.toLowerCase().includes('en-in')) ||
          voices.find((v) => v.lang.startsWith('en'));

        if (role === 'agent') {
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          if (inEnVoice) utterance.voice = inEnVoice;
        } else {
          utterance.rate = 1.05;
          utterance.pitch = 1.12;
          const altVoice = voices.find((v) => v.lang.startsWith('en') && v !== inEnVoice);
          if (altVoice) utterance.voice = altVoice;
          else if (inEnVoice) utterance.voice = inEnVoice;
        }
      } else {
        // For regional or international languages when no specific voice was listed in getVoices(),
        // setting utterance.lang allows browser/OS cloud TTS engine to synthesize the native language cleanly.
        utterance.rate = 0.92;
        utterance.pitch = role === 'agent' ? 1.0 : 1.05;
      }

      let hasFinished = false;
      const finish = () => {
        if (!hasFinished) {
          hasFinished = true;
          if (onEnd) onEnd();
          resolve();
        }
      };

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = finish;
      utterance.onerror = (e) => {
        console.warn('Speech synthesis notice:', e);
        finish();
      };

      // Safety timeout in case browser speech engine stalls
      const wordCount = text.split(/\s+/).length;
      const maxDurationMs = Math.max(3000, wordCount * 500);
      setTimeout(finish, maxDurationMs);

      window.speechSynthesis.speak(utterance);
    });
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const soundEngine = new SoundEngine();
