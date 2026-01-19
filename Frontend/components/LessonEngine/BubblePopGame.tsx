import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { audioManager } from './AudioManager';

const { width, height } = Dimensions.get('window');

// --- CONSTANTS ---
const COLORS = ['#FF5252', '#448AFF', '#69F0AE', '#FFD740', '#E040FB'];
const CHARACTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];

// Game Config
const ROUND_DURATION = 15000;
const PAUSE_DURATION = 3000;
const TOTAL_ROUNDS = 5;

interface BubbleGameProps {
  onComplete: (score: number, stars: number) => void;
  onExit: () => void;
}

const BubblePopGame = ({ onComplete, onExit }: BubbleGameProps) => {
  // State
  const [score, setScore] = useState(0);
  const [bubbles, setBubbles] = useState<any[]>([]);
  const [currentTarget, setCurrentTarget] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'ANNOUNCING' | 'PLAYING' | 'FINISHED'>('IDLE');
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION / 1000);
  const [roundCount, setRoundCount] = useState(0);

  // Refs
  const timerRef = useRef<number | null>(null);
  const spawnerRef = useRef<number | null>(null);

  // --- Lifecycle & Audio Setup ---
  useEffect(() => {
    const initGame = async () => {
      await audioManager.loadSounds();
      startNewRound();
    };
    initGame();
    return () => {
      stopGame();
      audioManager.unloadSounds();
    };
  }, []);

  // --- Audio Logic ---
  const playTargetSound = async (char: string) => {
    const key = `voice_${char.toLowerCase()}`;
    await audioManager.play(key);
  };

  // --- Game Control ---
  const startNewRound = () => {
    if (roundCount >= TOTAL_ROUNDS) {
      endGame();
      return;
    }

    setBubbles([]);
    setGameState('ANNOUNCING');

    const randomChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    setCurrentTarget(randomChar);
    playTargetSound(randomChar);

    setTimeout(() => {
      setGameState('PLAYING');
      setTimeLeft(ROUND_DURATION / 1000);
      startTimer();
      startSpawner(randomChar);
    }, PAUSE_DURATION);

    setRoundCount(prev => prev + 1);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(spawnerRef.current!);
          startNewRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startSpawner = (targetChar: string) => {
    if (spawnerRef.current) clearInterval(spawnerRef.current);
    spawnerRef.current = setInterval(() => {
      spawnBubble(targetChar);
    }, 800);
  };

  const spawnBubble = (targetChar: string) => {
    const id = Date.now() + Math.random();
    const size = Math.random() * 20 + 90; // Bigger balloons
    const x = Math.random() * (width - size);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    // 40% chance of target
    const isTarget = Math.random() < 0.4;
    const char = isTarget ? targetChar : CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

    const newBubble = { id, x, y: height + 50, size, color, char, speed: Math.random() * 2 + 1.5 };

    setBubbles((prev) => [...prev, newBubble]);
  };

  // --- Game Loop (Animation) ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      setBubbles((prevBubbles) => {
        return prevBubbles
          .map((b) => ({ ...b, y: b.y - b.speed }))
          .filter((b) => b.y + b.size > -200);
      });
    }, 16);

    return () => clearInterval(interval);
  }, [gameState]);

  const handlePop = (id: number, char: string) => {
    if (char === currentTarget) {
      setScore((prev) => prev + 10);
      audioManager.play('pop');
    } else {
      audioManager.play('boing');
    }
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  };

  const stopGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnerRef.current) clearInterval(spawnerRef.current);
  };

  const endGame = () => {
    stopGame();
    setGameState('FINISHED');
    audioManager.play('correct');

    const stars = score >= 100 ? 3 : score >= 50 ? 2 : 1;
    onComplete(score, stars);
  };

  // --- RENDER ---
  return (
    <ImageBackground
      source={require('../../assets/sky_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Exit Button */}
      <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
        <Text style={{ fontSize: 20 }}>❌</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
        <Image
          source={require('../../assets/tiger_sitting.png')}
          style={styles.headerTiger}
          resizeMode="contain"
        />
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>TARGET</Text>
          <Text style={styles.timerText}>{currentTarget || "?"}</Text>
        </View>
      </View>

      {/* Announcement Overlay (Tiger Holding Sign) */}
      {gameState === 'ANNOUNCING' && (
        <View style={styles.overlay}>
          <View style={styles.announcementCard}>
            <Image
              source={require('../../assets/tiger_sitting.png')}
              style={styles.tigerOverlay}
              resizeMode="contain"
            />
            <View style={styles.signBoard}>
              <Text style={styles.instructionText}>YOUR WORD IS</Text>
              <Text style={styles.targetBigText}>{currentTarget}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Balloons */}
      {gameState === 'PLAYING' && bubbles.map((bubble) => (
        <TouchableOpacity
          key={bubble.id}
          style={[
            styles.balloonWrapper,
            { left: bubble.x, top: bubble.y }
          ]}
          onPress={() => handlePop(bubble.id, bubble.char)}
          activeOpacity={0.8}
        >
          <View style={{ width: bubble.size, height: bubble.size * 1.2 }}>
            <Image
              source={require('../../assets/balloon_red.png')}
              style={{ width: '100%', height: '100%', tintColor: bubble.color }}
              resizeMode="contain"
            />
            <View style={styles.charContainer}>
              <Text style={[styles.bubbleText, { fontSize: bubble.size * 0.4 }]}>{bubble.char}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  exitBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    zIndex: 20,
  },
  scoreContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFC226'
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#5A3E29',
    letterSpacing: 1
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF6E4F',
  },
  timerContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFC226',
    minWidth: 80
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#5A3E29',
    letterSpacing: 1
  },
  timerText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF6E4F',
  },
  headerTiger: {
    width: 60,
    height: 60,
    marginTop: -10
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 30,
  },
  announcementCard: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  tigerOverlay: {
    width: 150,
    height: 150,
    marginBottom: -40,
    zIndex: 10
  },
  signBoard: {
    backgroundColor: '#FFC226',
    width: 280,
    height: 280,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#FFF'
  },
  instructionText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '900',
    marginBottom: 0,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1
  },
  targetBigText: {
    fontSize: 140,
    fontWeight: '900',
    color: '#FFF',
    includeFontPadding: false,
    lineHeight: 160
  },
  balloonWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  charContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '15%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bubbleText: {
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default BubblePopGame;