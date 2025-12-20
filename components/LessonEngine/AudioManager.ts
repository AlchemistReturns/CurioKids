import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

const SOUND_FILES: Record<string, any> = {
  // Utility Sounds
  correct: require('@/assets/sounds/correct_ding.mp3'),
  sparkle: require('@/assets/sounds/cheer.mp3'),

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
  sounds: Record<string, Audio.Sound> = {};
  isLoaded = false;

  async loadSounds() {
    if (this.isLoaded) return; // Prevent double loading

    // --- AUDIO CONFIGURATION ---
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        // FIX: Use 'DuckOthers' (CamelCase), not 'DUCK_OTHERS'
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        staysActiveInBackground: false,
      });
    } catch (e) {
      console.warn("Error setting audio mode:", e);
    }

    // --- LOAD SOUNDS ---
    try {
      const promises = Object.entries(SOUND_FILES).map(async ([key, file]) => {
        try {
            const { sound } = await Audio.Sound.createAsync(file);
            this.sounds[key] = sound;
        } catch (e) {
            console.warn(`Failed to load sound: ${key}. Check filename.`);
        }
      });
      await Promise.all(promises);
      this.isLoaded = true;
    } catch (error) {
      console.warn("Global audio load error:", error);
    }
  }

  async play(name: string) {
    const sound = this.sounds[name];
    if (sound) {
      try {
        await sound.replayAsync();
      } catch (e) {
        console.log("Audio play error", e);
      }
    } else {
        // Safe fail - just log it, don't crash the app
        console.log(`Sound [${name}] requested but not loaded.`);
    }
  }

  async unloadSounds() {
    for (const sound of Object.values(this.sounds)) {
      await sound.unloadAsync();
    }
    this.sounds = {};
    this.isLoaded = false;
  }
}

export const audioManager = new AudioManager();