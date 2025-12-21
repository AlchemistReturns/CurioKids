import { Ionicons } from "@expo/vector-icons";
import {
  Canvas, Circle, Group, Mask, Path, Skia
} from "@shopify/react-native-skia";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import {
  runOnJS, useSharedValue, withRepeat, withSequence, withTiming
} from "react-native-reanimated";
import { audioManager } from "./AudioManager";
import { ParticleSystem } from "./ParticleSystem";

const STROKE_WIDTH = 55;
const REVEAL_SIZE = 70;
const TOUCH_TOLERANCE = 60; 

// --- HELPER: MATH FOR FAST SWIPES ---
const distanceToSegment = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
    'worklet'; 
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
};

export interface GameResult {
  stars: number;
  score: number;
  mistakes: number;
}

interface TracingGameProps {
  data: any; 
  onComplete?: (result: GameResult) => void;
  onExit?: () => void;
}

type GameMode = 'practice' | 'test';

export default function TracingGame({ data, onComplete, onExit }: TracingGameProps) {
  // JS Thread State (Game Logic)
  const [mode, setMode] = useState<GameMode>('practice');
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [waypointIndex, setWaypointIndex] = useState(0); 
  const [gameWon, setGameWon] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  // UI Thread State (Animations & Gestures)
  const userPath = useSharedValue(Skia.Path.Make());
  const completedPath = useSharedValue(Skia.Path.Make());
  const isDrawing = useSharedValue(false);
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const dotScale = useSharedValue(1);

  // --- FIX START: TRANSITION LOCK ---
  // This value locks the gesture handler while the next stroke is loading
  const isTransitioning = useSharedValue(false);
  // --- FIX END ---

  // DATA BRIDGING
  const currentWaypointsSV = useSharedValue<any[]>([]);
  const currentTargetIndexSV = useSharedValue(0);

  const currentStroke = data.strokes[strokeIndex];
  
  // 1. Sync Waypoints to UI Thread whenever stroke changes
  useEffect(() => {
    if (currentStroke) {
        currentWaypointsSV.value = currentStroke.waypoints;
        currentTargetIndexSV.value = 0; // Reset target to first point
        
        // --- FIX: Unlock gestures only when new data is ready ---
        isTransitioning.value = false;
    }
  }, [currentStroke, strokeIndex]);

  // 2. Sync Target Index to UI Thread whenever logic advances
  useEffect(() => {
    currentTargetIndexSV.value = waypointIndex;
  }, [waypointIndex]);

  // Visual Paths (Memoized for performance)
  const bgPath = useMemo(() => Skia.Path.MakeFromSVGString(data.fullPath), [data.fullPath]);
  const targetStrokePath = useMemo(() => {
    return currentStroke ? Skia.Path.MakeFromSVGString(currentStroke.path) : null;
  }, [currentStroke]);

  const startPoint = currentStroke?.waypoints[0];
  const endPoint = currentStroke?.waypoints[currentStroke.waypoints.length - 1];

  // --- GAME LOGIC ---
  const resetCanvas = () => {
    setStrokeIndex(0);
    setWaypointIndex(1);
    currentTargetIndexSV.value = 1; // Sync UI thread
    
    completedPath.value = Skia.Path.Make(); 
    userPath.value = Skia.Path.Make();
    isDrawing.value = false;
    isTransitioning.value = false; // Ensure lock is off on reset
  };

  useEffect(() => {
    setMode('practice');
    setGameWon(false);
    setMistakes(0);
    resetCanvas();

    audioManager.loadSounds().then(() => {
        if (data.audio) audioManager.play(data.audio);
    });

    // Pulse animation
    dotScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1, true
    );
  }, [data]);

  const startTestMode = () => {
      audioManager.play('sparkle'); 
      setMode('test');
      setMistakes(0); 
      resetCanvas();
  };

  const handleStrokeSuccess = () => {
    audioManager.play('correct');

    // Commit the path
    const newCommitted = Skia.Path.Make();
    newCommitted.addPath(completedPath.value);
    if (targetStrokePath) newCommitted.addPath(targetStrokePath);
    completedPath.value = newCommitted;

    // Reset drawing
    userPath.value = Skia.Path.Make();
    isDrawing.value = false;

    // Advance
    if (strokeIndex < data.strokes.length - 1) {
        setStrokeIndex(prev => prev + 1);
        setWaypointIndex(1); 
    } else {
        // Level Complete
        if (mode === 'practice') {
            setTimeout(() => runOnJS(startTestMode)(), 500);
        } else {
            setGameWon(true);
            audioManager.play('sparkle');
            let stars = 3;
            if (mistakes > 1) stars = 2;
            if (mistakes > 4) stars = 1;
            const score = Math.max(10, 100 - (mistakes * 10));
            if (onComplete) onComplete({ stars, score, mistakes });
        }
    }
  };

  const handleMistake = () => {
    isDrawing.value = false;
    userPath.value = Skia.Path.Make(); 
    setWaypointIndex(1);
    setMistakes(prev => prev + 1);
  };

  // --- GESTURE HANDLER (THREAD SAFE) ---
  const pan = Gesture.Pan()
    .minDistance(1)
    .onStart((g) => {
       // Check if locked
       if (isTransitioning.value) return;

       // Access data via SharedValue (Safe for UI Thread)
       const points = currentWaypointsSV.value;
       if (points.length === 0) return;
       
       const start = points[0]; 
       const dist = Math.hypot(g.x - start.x, g.y - start.y);
       
       if (dist < TOUCH_TOLERANCE) {
           isDrawing.value = true;
           const p = Skia.Path.Make();
           p.moveTo(start.x, start.y);
           userPath.value = p;
           fingerX.value = g.x;
           fingerY.value = g.y;
       }
    })
    .onUpdate((g) => {
        if (!isDrawing.value) return;
        // --- FIX: Stop processing if we are transitioning ---
        if (isTransitioning.value) return;

        const prevX = fingerX.value;
        const prevY = fingerY.value;

        fingerX.value = g.x;
        fingerY.value = g.y;

        // Draw visual line
        const p = userPath.value;
        p.lineTo(g.x, g.y);
        userPath.value = p;

        // Logic Check: Read from SharedValues
        const points = currentWaypointsSV.value;
        const targetIdx = currentTargetIndexSV.value;
        
        if (targetIdx < points.length) {
            const target = points[targetIdx];
            
            // MATH FIX: Check line segment to prevent tunneling
            const dist = distanceToSegment(
                target, 
                { x: prevX, y: prevY }, 
                { x: g.x, y: g.y }
            );

            if (dist < TOUCH_TOLERANCE) {
                const isLastPoint = targetIdx === points.length - 1;
                
                if (isLastPoint) {
                    // --- FIX: Lock immediately so multiple hits are impossible ---
                    isTransitioning.value = true;
                    runOnJS(handleStrokeSuccess)();
                } else {
                    // Update JS state (for Logic)
                    runOnJS(setWaypointIndex)(targetIdx + 1);
                    // Update UI state (for Gesture) immediately
                    currentTargetIndexSV.value = targetIdx + 1;
                }
            }
        }
    })
    .onEnd(() => {
        if (isDrawing.value && !isTransitioning.value) {
            runOnJS(handleMistake)();
        }
    });

  // --- RENDER ---
  if (gameWon) {
    return (
      <View style={styles.center}>
        <Text style={styles.bigText}>🌟 Amazing! 🌟</Text>
        <Text style={styles.subText}>You mastered {data.name}!</Text>
        <TouchableOpacity style={styles.btn} onPress={onExit}>
          <Text style={styles.btnText}>Finish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={onExit} style={styles.closeBtn}>
                <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <View style={{alignItems: 'center'}}>
                <Text style={styles.title}>{data.name}</Text>
                <Text style={[styles.modeText, { color: mode === 'practice' ? '#4ADE80' : '#FBBF24' }]}>
                    {mode === 'practice' ? "GUIDED PRACTICE" : "YOUR TURN"}
                </Text>
            </View>
            <View style={{width: 40}} /> 
        </View>

        {/* Canvas Area */}
        <View style={[styles.canvasContainer, mode === 'test' && styles.testBorder]}>
            <GestureDetector gesture={pan}>
                <Canvas style={{ flex: 1 }}>
                    {/* Background Stencil */}
                    {bgPath && <Path path={bgPath} style="stroke" strokeWidth={STROKE_WIDTH} color="#334155" strokeCap="round" strokeJoin="round" />}
                    
                    {/* Committed (Correct) Ink */}
                    <Path path={completedPath} style="stroke" strokeWidth={STROKE_WIDTH} color="#FBBF24" strokeCap="round" strokeJoin="round" />
                    
                    {/* Active Drawing (Masked Reveal) */}
                    {targetStrokePath && (
                        <Mask 
                            mode="luminance" 
                            mask={
                                <Group>
                                    <Path path={userPath} style="stroke" strokeWidth={REVEAL_SIZE} color="white" strokeCap="round" strokeJoin="round" />
                                </Group>
                            }
                        >
                            <Path path={targetStrokePath} style="stroke" strokeWidth={STROKE_WIDTH} color="#FBBF24" strokeCap="round" strokeJoin="round" />
                        </Mask>
                    )}
                    
                    {/* Guide Dots (Hidden in Test Mode) */}
                    {startPoint && mode === 'practice' && <Circle cx={startPoint.x} cy={startPoint.y} r={22} color="#4ADE80" />}
                    {endPoint && mode === 'practice' && <Circle cx={endPoint.x} cy={endPoint.y} r={22} color="#F87171" />}
                    
                    {/* Particles */}
                    <ParticleSystem x={fingerX} y={fingerY} active={isDrawing} />
                </Canvas>
            </GestureDetector>
        </View>

        <Text style={styles.hint}>{mode === 'practice' ? "Trace from Green to Red" : "Trace from Memory!"}</Text>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 20, paddingTop: 50, alignItems: "center" },
  title: { color: "white", fontSize: 32, fontWeight: "bold" },
  modeText: { fontSize: 14, fontWeight: "700", marginTop: 4, letterSpacing: 1 },
  closeBtn: { backgroundColor: "#ef4444", borderRadius: 20, padding: 8 },
  canvasContainer: { width: 320, height: 400, alignSelf: "center", marginTop: 20, backgroundColor: "#1e293b", borderRadius: 24, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8, borderWidth: 2, borderColor: 'transparent' },
  testBorder: { borderColor: '#FBBF24' },
  hint: { color: "#94a3b8", textAlign: "center", marginTop: 30, fontSize: 18, fontWeight: "500" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" },
  bigText: { color: "#fbbf24", fontSize: 40, fontWeight: "bold", marginBottom: 10 },
  subText: { color: "white", fontSize: 18, marginBottom: 30, opacity: 0.8 },
  btn: { backgroundColor: "#3b82f6", paddingHorizontal: 50, paddingVertical: 18, borderRadius: 30 },
  btnText: { color: "white", fontSize: 22, fontWeight: "bold" }
});