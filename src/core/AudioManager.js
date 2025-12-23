/**
 * AudioManager - Procedural Sound Effects System
 * Generates all sounds using Web Audio API - no external files needed
 */

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = false; // Default: muted
        this.volume = 0.5;

        // Footstep timing
        this.lastFootstepTime = 0;
        this.footstepInterval = 400; // ms between steps
        this.footstepAlt = false; // Alternate between left/right foot
    }

    /**
     * Update the footstep interval
     */
    setFootstepRate(interval) {
        this.footstepInterval = interval;
    }


    /**
     * Initialize the audio context (must be called after user interaction)
     */
    init() {
        if (this.audioContext) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
            console.log('🔊 AudioManager initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }

    /**
     * Resume audio context if suspended (needed for some browsers)
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Set master volume (0-1)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // ========== SOUND EFFECTS ==========

    /**
     * Coin collection - bright, satisfying "ding" sound
     */
    playCoinCollect() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Main tone
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.3);

        // Harmonic
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, now);
        osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.1);
        gain2.gain.setValueAtTime(0.15, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(now);
        osc2.stop(now + 0.25);
    }

    /**
     * Snake discovery - mysterious rustling/reveal sound
     */
    playSnakeDiscovery() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Low mysterious tone
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.5);

        // Rustling noise
        const bufferSize = this.audioContext.sampleRate * 0.3;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 3000;
        noiseFilter.Q.value = 1;

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.1, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.3);

        // Rising accent
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(400, now + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(600, now + 0.4);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.15, now + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(now);
        osc2.stop(now + 0.5);
    }

    /**
     * Snake capture - triumphant success sound
     */
    playSnakeCapture() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Ascending fanfare notes
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const noteDuration = 0.12;

        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'square';
            osc.frequency.value = freq;

            const startTime = now + i * noteDuration;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration + 0.1);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + noteDuration + 0.15);
        });

        // Final sparkle
        setTimeout(() => {
            this.playSparkle();
        }, notes.length * noteDuration * 1000);
    }

    /**
     * Sparkle effect - magical shimmer
     */
    playSparkle() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(2000 + i * 500, now + i * 0.05);
            osc.frequency.exponentialRampToValueAtTime(3000 + i * 500, now + i * 0.05 + 0.1);

            gain.gain.setValueAtTime(0.08, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.2);
        }
    }

    /**
     * Footstep sound - soft grass/dirt step
     */
    playFootstep() {
        if (!this.enabled || !this.audioContext) return;

        const now = Date.now();
        if (now - this.lastFootstepTime < this.footstepInterval) return;
        this.lastFootstepTime = now;
        this.resume();

        const currentTime = this.audioContext.currentTime;

        // Create noise burst for footstep
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;

        // Low-pass filter for a soft thud
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = this.footstepAlt ? 400 : 350; // Alternate pitch slightly
        filter.Q.value = 1;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.12, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(currentTime);
        noise.stop(currentTime + 0.1);

        this.footstepAlt = !this.footstepAlt;
    }

    /**
     * UI Click - soft button press sound
     */
    playUIClick() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * Panel open - soft swoosh up
     */
    playPanelOpen() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    /**
     * Panel close - soft swoosh down
     */
    playPanelClose() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Error/negative sound - for incorrect actions
     */
    playError() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Two descending tones
        [0, 0.1].forEach((delay, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300 - i * 50, now + delay);
            osc.frequency.exponentialRampToValueAtTime(200 - i * 50, now + delay + 0.1);

            gain.gain.setValueAtTime(0.1, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + delay);
            osc.stop(now + delay + 0.15);
        });
    }

    /**
     * Teleport/warp sound - for going home
     */
    playTeleport() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Descending sweep
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.5);

        // Sparkle overlay
        for (let i = 0; i < 5; i++) {
            const sparkOsc = this.audioContext.createOscillator();
            const sparkGain = this.audioContext.createGain();

            sparkOsc.type = 'sine';
            sparkOsc.frequency.value = 800 + Math.random() * 1200;

            const startTime = now + i * 0.08;
            sparkGain.gain.setValueAtTime(0.05, startTime);
            sparkGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

            sparkOsc.connect(sparkGain);
            sparkGain.connect(this.masterGain);

            sparkOsc.start(startTime);
            sparkOsc.stop(startTime + 0.1);
        }
    }

    /**
     * Snake nearby indicator - subtle alert
     * @param {number} pan - Panning value (-1 to 1)
     */
    playSnakeNearby(pan = 0) {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Stereo panner
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        panner.connect(this.masterGain);

        // Subtle pulse
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = 440;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);

        osc.connect(gain);
        gain.connect(panner); // Connect to panner instead of master directly

        osc.start(now);
        osc.stop(now + 0.3);
    }
}

// Global audio manager instance
export const audioManager = new AudioManager();
