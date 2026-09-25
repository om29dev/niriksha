import { useRef, useCallback } from 'react';

/**
 * Industrial Grade Emergency Siren Synthesizer
 * Uses Web Audio API to generate a realistic, high-urgency emergency alarm.
 * Features dual alternating oscillators with frequency glide (650Hz to 1100Hz),
 * subtle distortion/harmonics, and continuous cycling.
 */
export function useEmergencyAudio(audioMuted: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const cycleTimeoutRef = useRef<any>(null);

  const playSirenCycle = useCallback(() => {
    if (audioMuted || !isPlayingRef.current) return;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (!audioCtxRef.current) return;

      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const cycleDuration = 1.1; // 1.1s dual-tone warble sweep cycle

      // Primary tone oscillator (sawtooth for penetrating industrial edge)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';

      // Secondary tone oscillator (square wave slightly detuned for disorienting emergency urgency)
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.detune.setValueAtTime(14, now);

      // Main gain envelope
      const masterGain = ctx.createGain();
      // Low pass filter to remove piercing harshness while keeping authoritative alarm sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);

      // Urgent frequency sweep: Ramping up from 620Hz to 1150Hz then fast drop back
      osc1.frequency.setValueAtTime(620, now);
      osc1.frequency.exponentialRampToValueAtTime(1180, now + 0.55);
      osc1.frequency.exponentialRampToValueAtTime(620, now + 1.05);

      osc2.frequency.setValueAtTime(620, now);
      osc2.frequency.exponentialRampToValueAtTime(1180, now + 0.55);
      osc2.frequency.exponentialRampToValueAtTime(620, now + 1.05);

      // Volume envelope (pulse crescendo)
      masterGain.gain.setValueAtTime(0.01, now);
      masterGain.gain.linearRampToValueAtTime(0.35, now + 0.1);
      masterGain.gain.setValueAtTime(0.35, now + 0.95);
      masterGain.gain.linearRampToValueAtTime(0.01, now + cycleDuration);

      // Route audio nodes
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + cycleDuration);
      osc2.stop(now + cycleDuration);

      // Schedule next cycle seamlessly
      cycleTimeoutRef.current = setTimeout(() => {
        if (isPlayingRef.current && !audioMuted) {
          playSirenCycle();
        }
      }, cycleDuration * 1000 - 50);

    } catch {
      // Browser audio policy might require initial user gesture
    }
  }, [audioMuted]);

  const stopAlarm = useCallback(() => {
    isPlayingRef.current = false;
    if (cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
  }, []);

  const startAlarm = useCallback(() => {
    stopAlarm();
    isPlayingRef.current = true;
    playSirenCycle();
  }, [playSirenCycle, stopAlarm]);

  return {
    playEmergencyAlarmTone: playSirenCycle,
    startAlarm,
    stopAlarm
  };
}
