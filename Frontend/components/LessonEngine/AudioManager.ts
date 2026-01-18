import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as Speech from 'expo-speech';

// --- TTS CONFIGURATION FOR CHILD-FRIENDLY VOICE ---
const TTS_CONFIG = {
  rate: 0.85,      // Slower for children to understand
  pitch: 1.1,      // Slightly higher pitch (friendlier)
  language: 'en-US',
};

// --- 1. SEPARATE ASSETS ---
// Keep these in memory (Fast response needed)
const SFX_FILES: Record<string, any> = {
  pop: require('@/assets/sounds/pop.mp3'),
  boing: require('@/assets/sounds/boing.mp3'),
  correct: require('@/assets/sounds/correct_ding.mp3'),
  sparkle: require('@/assets/sounds/cheer.mp3'),
};

// Load these ON DEMAND (Saves memory, prevents crash)
const VOICE_FILES: Record<string, any> = {
  // Letters (A-Z)
  voice_a: require('@/assets/sounds/voice_a.mp3'),
  voice_b: require('@/assets/sounds/voice_b.mp3'),
  voice_c: require('@/assets/sounds/voice_c.mp3'),
  voice_d: require('@/assets/sounds/voice_d.mp3'),
  voice_e: require('@/assets/sounds/voice_e.mp3'),
  voice_f: require('@/assets/sounds/voice_f.mp3'),
  voice_g: require('@/assets/sounds/voice_g.mp3'),
  voice_h: require('@/assets/sounds/voice_h.mp3'),
  voice_i: require('@/assets/sounds/voice_i.mp3'),
  voice_j: require('@/assets/sounds/voice_j.mp3'),
  voice_k: require('@/assets/sounds/voice_k.mp3'),
  voice_l: require('@/assets/sounds/voice_l.mp3'),
  voice_m: require('@/assets/sounds/voice_m.mp3'),
  voice_n: require('@/assets/sounds/voice_n.mp3'),
  voice_o: require('@/assets/sounds/voice_o.mp3'),
  voice_p: require('@/assets/sounds/voice_p.mp3'),
  voice_q: require('@/assets/sounds/voice_q.mp3'),
  voice_r: require('@/assets/sounds/voice_r.mp3'),
  voice_s: require('@/assets/sounds/voice_s.mp3'),
  voice_t: require('@/assets/sounds/voice_t.mp3'),
  voice_u: require('@/assets/sounds/voice_u.mp3'),
  voice_v: require('@/assets/sounds/voice_v.mp3'),
  voice_w: require('@/assets/sounds/voice_w.mp3'),
  voice_x: require('@/assets/sounds/voice_x.mp3'),
  voice_y: require('@/assets/sounds/voice_y.mp3'),
  voice_z: require('@/assets/sounds/voice_z.mp3'),

  // Numbers (0-9)
  voice_0: require('@/assets/sounds/voice_0.mp3'),
  voice_1: require('@/assets/sounds/voice_1.mp3'),
  voice_2: require('@/assets/sounds/voice_2.mp3'),
  voice_3: require('@/assets/sounds/voice_3.mp3'),
  voice_4: require('@/assets/sounds/voice_4.mp3'),
  voice_5: require('@/assets/sounds/voice_5.mp3'),
  voice_6: require('@/assets/sounds/voice_6.mp3'),
  voice_7: require('@/assets/sounds/voice_7.mp3'),
  voice_8: require('@/assets/sounds/voice_8.mp3'),
  voice_9: require('@/assets/sounds/voice_9.mp3'),
};

class AudioManager {
  // Only store SFX players permanently
  sfxSounds: Record<string, Audio.Sound> = {};
  isLoaded = false;
  isSpeaking = false;

  async loadSounds() {
    if (this.isLoaded) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        staysActiveInBackground: false,
      });

      // ONLY LOAD SFX (Safe amount for Android/iOS limits)
      const promises = Object.entries(SFX_FILES).map(async ([key, file]) => {
        try {
          const { sound } = await Audio.Sound.createAsync(file);
          this.sfxSounds[key] = sound;
        } catch (e) {
          console.warn(`Failed to load SFX: ${key}`);
        }
      });

      await Promise.all(promises);
      this.isLoaded = true;
      console.log("SFX Audio Loaded");

    } catch (error) {
      console.warn("Global audio load error:", error);
    }
  }

  /**
   * Speak a question or text aloud using child-friendly TTS
   * @param text - The text to speak
   * @param onDone - Optional callback when speech completes
   */
  async speakQuestion(text: string, onDone?: () => void) {
    if (!text || this.isSpeaking) return;

    try {
      // Stop any ongoing speech first
      await Speech.stop();
      this.isSpeaking = true;

      await Speech.speak(text, {
        rate: TTS_CONFIG.rate,
        pitch: TTS_CONFIG.pitch,
        language: TTS_CONFIG.language,
        onDone: () => {
          this.isSpeaking = false;
          onDone?.();
        },
        onError: () => {
          this.isSpeaking = false;
          console.warn('TTS Error');
        },
        onStopped: () => {
          this.isSpeaking = false;
        }
      });
    } catch (e) {
      this.isSpeaking = false;
      console.warn('TTS speak error:', e);
    }
  }

  /**
   * Stop any ongoing speech
   */
  async stopSpeaking() {
    try {
      await Speech.stop();
      this.isSpeaking = false;
    } catch (e) {
      console.warn('TTS stop error:', e);
    }
  }

  async play(name: string) {
    // 1. STRATEGY: PRELOADED SFX
    if (this.sfxSounds[name]) {
      try {
        await this.sfxSounds[name].replayAsync();
      } catch (e) {
        // If the player crashed/unloaded, reload it
        try {
          await this.sfxSounds[name].unloadAsync();
          await this.sfxSounds[name].loadAsync(SFX_FILES[name]);
          await this.sfxSounds[name].playAsync();
        } catch (reloadError) {
          console.log("SFX Recovery failed", reloadError);
        }
      }
      return;
    }

    // 2. STRATEGY: LAZY LOAD VOICE (Load -> Play -> Destroy)
    const voiceFile = VOICE_FILES[name];
    if (voiceFile) {
      try {
        // Create a disposable sound object
        const { sound } = await Audio.Sound.createAsync(voiceFile, { shouldPlay: true });

        // Auto-cleanup when done to free memory
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            await sound.unloadAsync();
          }
        });
      } catch (e) {
        console.log(`Error streaming voice: ${name}`, e);
      }
    } else {
      console.log(`Sound [${name}] not found in map.`);
    }
  }

  async unloadSounds() {
    // Stop TTS
    await this.stopSpeaking();

    // Unload SFX
    for (const sound of Object.values(this.sfxSounds)) {
      try {
        await sound.unloadAsync();
      } catch (e) { /* ignore */ }
    }
    this.sfxSounds = {};
    this.isLoaded = false;
  }
}

export const audioManager = new AudioManager();