/**
 * Temporal Echo - Audio Synthesizer Engine
 * Synthesizes organic, zen-like sounds using the Web Audio API.
 * Avoids the need for external asset loading.
 */

class AudioSynthesizer {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.masterVolume = 0.3; // Low master volume for premium, subtle audio
    }

    /**
     * Lazy initialization of the AudioContext to comply with browser autoplay restrictions.
     */
    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
        }
    }

    resume() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(muted) {
        this.muted = muted;
    }

    toggleMuted() {
        this.muted = !this.muted;
        return this.muted;
    }

    createLimiter(destination) {
        if (!this.ctx) return destination;
        const dynamicsCompressor = this.ctx.createDynamicsCompressor();
        dynamicsCompressor.threshold.setValueAtTime(-10, this.ctx.currentTime);
        dynamicsCompressor.knee.setValueAtTime(4, this.ctx.currentTime);
        dynamicsCompressor.ratio.setValueAtTime(12, this.ctx.currentTime);
        dynamicsCompressor.attack.setValueAtTime(0, this.ctx.currentTime);
        dynamicsCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);
        dynamicsCompressor.connect(destination);
        return dynamicsCompressor;
    }

    /**
     * Plays a woodblock/kalimba-like pluck sound.
     * Perfect for player steps.
     */
    playMove(pitchFactor = 1.0) {
        this.resume();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        // Base frequency of ~330Hz (E4), scaled by pitchFactor
        const baseFreq = 330 * pitchFactor;
        osc.frequency.setValueAtTime(baseFreq, now);

        // Add a subtle second harmonic for organic timber
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(baseFreq * 2.0, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.12);

        gainNode.gain.setValueAtTime(this.masterVolume * 0.8, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        subGain.gain.setValueAtTime(this.masterVolume * 0.25, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + 0.16);
        subOsc.stop(now + 0.16);
    }

    /**
     * Plays a reverse sweep with a resonant chime.
     * Denotes rewinding time.
     */
    playRewind() {
        this.resume();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 0.6;
        
        // 1. Rising sweep (the reverse action)
        const sweepOsc = this.ctx.createOscillator();
        const sweepGain = this.ctx.createGain();
        sweepOsc.type = 'sine';
        sweepOsc.frequency.setValueAtTime(100, now);
        sweepOsc.frequency.exponentialRampToValueAtTime(800, now + duration);

        sweepGain.gain.setValueAtTime(0.001, now);
        sweepGain.gain.linearRampToValueAtTime(this.masterVolume * 0.6, now + duration * 0.7);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // 2. High-pass noise breath
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;
        
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(400, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(2000, now + duration);
        noiseFilter.Q.setValueAtTime(3.0, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(this.masterVolume * 0.25, now + duration * 0.6);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        sweepOsc.connect(sweepGain);
        sweepGain.connect(this.ctx.destination);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        sweepOsc.start(now);
        noiseNode.start(now);
        sweepOsc.stop(now + duration + 0.1);
        noiseNode.stop(now + duration + 0.1);
    }

    /**
     * Plays a double organic pluck.
     * Triggered when a switch is depressed.
     */
    playSwitchPress(isActive = true) {
        this.resume();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'triangle';
        // Active gets a warm, higher tone; release gets a lower dull click
        const freq = isActive ? 180 : 120;
        osc.frequency.setValueAtTime(freq, now);
        if (isActive) {
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.08);
        }

        gainNode.gain.setValueAtTime(this.masterVolume * 0.7, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Low frequency marble-rolling rumble.
     * Played when gates or doors move.
     */
    playDoorOpen() {
        this.resume();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 0.5;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gainNode = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, now); // C2
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, now);
        filter.Q.setValueAtTime(5, now);

        // LFO to modulate filter frequency to create a rumble/sliding feel
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(25, now); // Fast modulation
        lfoGain.gain.setValueAtTime(40, now);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.9, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + duration + 0.05);
        osc.stop(now + duration + 0.05);
    }

    /**
     * Sparkling arpeggio in the pentatonic scale.
     * Played when level completes.
     */
    playSuccess() {
        this.resume();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        // Pentatonic scale (C major pentatonic: C4, D4, E4, G4, A4, C5, D5)
        const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
        const delay = 0.08;

        notes.forEach((freq, index) => {
            const time = now + index * delay;
            
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq * 2, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1500, time);

            gainNode.gain.setValueAtTime(0.001, time);
            gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.35, time + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

            osc.connect(filter);
            osc2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            osc.start(time);
            osc2.start(time);
            osc.stop(time + 0.45);
            osc2.stop(time + 0.45);
        });
    }

    /**
     * A deep, hollow descending note.
     * Played when player hits spikes / fails.
     */
    playFail() {
        this.resume();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 0.45;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(90, now + duration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);

        gainNode.gain.setValueAtTime(this.masterVolume * 1.0, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.05);
    }
}

// Export singleton
const synth = new AudioSynthesizer();
window.audioSynth = synth;
