import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { audioManager } from './AudioManager';

const { width, height } = Dimensions.get('window');

// --- CONSTANTS ---
const COLORS = ['#E64A19', '#388E3C', '#1976D2', '#C2185B', '#FBC02D', '#0097A7'];
const CHARACTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];

// Game Config
const ROUND_DURATION = 10000; // 10 seconds of active play
const PAUSE_DURATION = 4000;  // 4 seconds to listen/pause
const TOTAL_ROUNDS = 3;       

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
    }, 700); 
  };

  const spawnBubble = (targetChar: string) => {
    const id = Date.now() + Math.random();
    const size = Math.random() * 30 + 70; 
    const x = Math.random() * (width - size);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    const isTarget = Math.random() < 0.4;
    const char = isTarget ? targetChar : CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

    const newBubble = { id, x, y: height + size + 50, size, color, char, speed: Math.random() * 2 + 1.5 };

    setBubbles((prev) => [...prev, newBubble]);
  };

  // --- Game Loop (Animation) ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      setBubbles((prevBubbles) => {
        return prevBubbles
          .map((b) => ({ ...b, y: b.y - b.speed }))
          .filter((b) => b.y + b.size > -100); 
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
    
    // Calculate Stars based on score
    const stars = score >= 100 ? 3 : score >= 50 ? 2 : 1;
    onComplete(score, stars);
  };

  // --- RENDER ---
  return (
    <View style={styles.container}>
      {/* Exit Button */}
      <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
        <Text style={{fontSize: 24}}>❌</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.timerText}>
          {gameState === 'ANNOUNCING' ? 'Listen...' : `Time: ${timeLeft}`}
        </Text>
      </View>

      {/* Announcement Overlay */}
      {gameState === 'ANNOUNCING' && (
        <View style={styles.overlay}>
          <Text style={styles.instructionText}>Find this:</Text>
          <Text style={styles.targetBigText}>{currentTarget}</Text>
          <TouchableOpacity 
            onPress={() => playTargetSound(currentTarget!)} 
            style={styles.speakBtn}
          >
             <Text style={styles.speakBtnText}>🔊 Listen Again</Text>
          </TouchableOpacity>
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
          <View style={[styles.balloonBody, { 
              width: bubble.size, 
              height: bubble.size, 
              backgroundColor: bubble.color 
          }]}>
             <View style={styles.balloonHighlight} />
             <Text style={styles.bubbleText}>{bubble.char}</Text>
          </View>
          <View style={styles.balloonString} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA', // Sky color
  },
  exitBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    backgroundColor: 'white',
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
    padding: 20,
    paddingTop: 50,
    zIndex: 20,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D84315',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 30,
  },
  instructionText: {
    fontSize: 28,
    color: '#555',
    marginBottom: 10,
  },
  targetBigText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  speakBtn: {
      padding: 10,
      backgroundColor: '#3357FF',
      borderRadius: 10
  },
  speakBtnText: {
      color: '#fff',
      fontSize: 16
  },
  balloonWrapper: {
    position: 'absolute',
    alignItems: 'center', 
    zIndex: 10,
  },
  balloonBody: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6, 
  },
  balloonHighlight: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '25%',
    height: '20%',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
    transform: [{ rotate: '-45deg' }]
  },
  balloonString: {
    width: 2,
    height: 50,
    backgroundColor: '#90A4AE', 
    marginTop: -4, 
    zIndex: -1, 
  },
  bubbleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
    zIndex: 5, 
  },
});

export default BubblePopGame;