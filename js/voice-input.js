/**
 * Smart GovReport Hub V3 - Thai Web Speech API Assistant
 * Provides real-time speech-to-text dictation for trainees and mentors
 * Free 0 THB, client-side, zero latency, accessible for all users
 * Author: ทีมงาน SmartGov 2026 (พี่แจ็ค M1 Architecture)
 */

class SmartGovVoiceAssistant {
  constructor(lang = 'th-TH') {
    this.lang = lang;
    this.recognition = null;
    this.isListening = false;
    this.currentTarget = null;
    this.currentBtn = null;
    this.onResultCb = null;
    this.toastEl = null;

    this.initRecognition();
  }

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  initRecognition() {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) {
      console.warn('[SmartGovVoice] Web Speech API is not supported in this browser.');
      return;
    }

    this.recognition = new SpeechClass();
    this.recognition.lang = this.lang;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateUI(true);
      this.showToast('🎙️ กำลังฟังเสียงพูดภาษาไทย... พูดเพื่อบันทึกข้อความได้เลยครับ');
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const textToAdd = finalTranscript || interimTranscript;
      if (textToAdd && this.currentTarget) {
        if (this.onResultCb) {
          this.onResultCb(finalTranscript, interimTranscript);
        } else {
          // Default behavior: append text to input/textarea
          if (finalTranscript) {
            const currentVal = this.currentTarget.value || '';
            const spacer = currentVal && !currentVal.endsWith(' ') && !currentVal.endsWith('\n') ? ' ' : '';
            this.currentTarget.value = currentVal + spacer + finalTranscript.trim();
            // Trigger input event for reactive frameworks
            this.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[SmartGovVoice] Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.showToast('⚠️ กรุณาอนุญาตการเข้าถึงไมโครโฟนในเบราว์เซอร์เพื่อพิมพ์ด้วยเสียง', 4000);
      } else if (event.error === 'no-speech') {
        // No speech detected, quietly ignore
      } else {
        this.showToast(`⚠️ การรับเสียงขัดข้อง: ${event.error}`, 3000);
      }
      this.stop();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateUI(false);
      this.hideToast();
    };
  }

  toggle(targetInputIdOrEl, btnEl, onResult) {
    if (this.isListening) {
      this.stop();
    } else {
      this.start(targetInputIdOrEl, btnEl, onResult);
    }
  }

  start(targetInputIdOrEl, btnEl, onResult) {
    if (!this.isSupported()) {
      alert('เบราว์เซอร์นี้ยังไม่รองรับระบบสั่งงานด้วยเสียง (แนะนำให้ใช้ Google Chrome หรือ Microsoft Edge)');
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    if (typeof targetInputIdOrEl === 'string') {
      this.currentTarget = document.getElementById(targetInputIdOrEl);
    } else {
      this.currentTarget = targetInputIdOrEl;
    }

    this.currentBtn = btnEl;
    this.onResultCb = onResult || null;

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('[SmartGovVoice] Start failed:', e);
      this.recognition.stop();
      setTimeout(() => this.recognition.start(), 200);
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    this.updateUI(false);
    this.hideToast();
  }

  updateUI(listening) {
    if (this.currentBtn) {
      if (listening) {
        this.currentBtn.classList.add('listening');
        this.currentBtn.title = 'กำลังฟังเสียง... กดอีกครั้งเพื่อหยุด';
      } else {
        this.currentBtn.classList.remove('listening');
        this.currentBtn.title = 'พิมพ์ด้วยเสียงพูดภาษาไทย (Speech-to-text)';
      }
    }
  }

  showToast(msg, duration = 0) {
    if (!this.toastEl) {
      this.toastEl = document.createElement('div');
      this.toastEl.className = 'voice-toast';
      document.body.appendChild(this.toastEl);
    }
    this.toastEl.innerHTML = `
      <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping mr-1"></span>
      <span>${msg}</span>
      <button onclick="window.SmartGovVoice.stop()" class="ml-2 text-slate-400 hover:text-white text-xs underline">หยุด</button>
    `;
    this.toastEl.style.display = 'flex';

    if (duration > 0) {
      setTimeout(() => this.hideToast(), duration);
    }
  }

  hideToast() {
    if (this.toastEl) {
      this.toastEl.style.display = 'none';
    }
  }
}

// Global Singleton Instance
window.SmartGovVoice = new SmartGovVoiceAssistant();
