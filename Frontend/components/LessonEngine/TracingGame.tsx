import { Ionicons } from "@expo/vector-icons";
import {
  Canvas, Circle, Group, Image, Mask, Path, Skia, useImage
} from "@shopify/react-native-skia";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image as RNImage } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import {
  runOnJS, useSharedValue, withRepeat, withSequence, withTiming, withSpring
} from "react-native-reanimated";
import { audioManager } from "./AudioManager";
import { ParticleSystem } from "./ParticleSystem";

// --- THEME CONSTANTS ---
const THEME = {
  bg: '#FFF9E6', // Tiger Cream
  canvasBg: '#FFFFFF',
  stroke: '#FFC226', // Tiger Yellow
  filled: '#FF6E4F', // Tiger Orange
  outline: '#5A3E29', // Tiger Brown
  guide: '#4CAF50', // Green for start
  end: '#F44336'    // Red for end
};

const STROKE_WIDTH = 55;
const REVEAL_SIZE = 70;
const TOUCH_TOLERANCE = 60;

// --- HELPER: MATH FOR FAST SWIPES ---
const distanceToSegment = (p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }) => {
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

  // Transition Lock
  const isTransitioning = useSharedValue(false);

  // DATA BRIDGING
  const currentWaypointsSV = useSharedValue<any[]>([]);
  const currentTargetIndexSV = useSharedValue(0);

  const currentStroke = data.strokes[strokeIndex];

  // Load Tiger Image for nice effects? Optional, but let's stick to simple UI for canvas

  // 1. Sync Waypoints to UI Thread whenever stroke changes
  useEffect(() => {
    if (currentStroke) {
      currentWaypointsSV.value = currentStroke.waypoints;
      currentTargetIndexSV.value = 0; // Reset target to first point
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
  const nextPoint = currentStroke?.waypoints[1] || currentStroke?.waypoints[currentStroke.waypoints.length - 1]; // Fallback
  const endPoint = currentStroke?.waypoints[currentStroke.waypoints.length - 1];

  // --- ARROW CALCULATION ---
  const arrowPath = useMemo(() => {
    if (!startPoint || !nextPoint) return null;
    const angle = Math.atan2(nextPoint.y - startPoint.y, nextPoint.x - startPoint.x);

    // Offset from the center of the start point (radius ~22 + padding)
    const DISTANCE_FROM_DOT = 60;

    // Position "outside" the start dot along the path
    const dx = Math.cos(angle) * DISTANCE_FROM_DOT;
    const dy = Math.sin(angle) * DISTANCE_FROM_DOT;

    // Create a simple arrow shape pointing right
    const path = Skia.Path.Make();
    path.moveTo(-5, -10);
    path.lineTo(15, 0);
    path.lineTo(-5, 10);
    path.lineTo(0, 0); // Indented back
    path.close();

    // Transform matrix
    const matrix = Skia.Matrix();
    matrix.translate(startPoint.x + dx, startPoint.y + dy);
    matrix.rotate(angle * (180 / Math.PI)); // Skia uses degrees
    path.transform(matrix);

    return path;
  }, [startPoint, nextPoint]);


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
      withSequence(withTiming(1.3, { duration: 600 }), withTiming(1, { duration: 600 })),
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

        const dist = distanceToSegment(
          target,
          { x: prevX, y: prevY },
          { x: g.x, y: g.y }
        );

        if (dist < TOUCH_TOLERANCE) {
          const isLastPoint = targetIdx === points.length - 1;

          if (isLastPoint) {
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
        <RNImage
          source={require('../../assets/tiger_sitting.png')}
          style={{ width: 150, height: 150, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Text style={styles.bigText}>🌟 Amazing! 🌟</Text>
        <Text style={styles.subText}>You totally rocked that!</Text>
        <TouchableOpacity style={styles.btn} onPress={onExit}>
          <Text style={styles.btnText}>Let's Go!</Text>
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
            <Ionicons name="close" size={24} color="#5A3E29" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <View style={styles.headerBadge}>
              <Text style={styles.title}>{data.name}</Text>
            </View>
            <Text style={styles.modeText}>
              {mode === 'practice' ? "Let's Practice!" : "Your Turn!"}
            </Text>
          </View>

          {/* Tiny Tiger */}
          <RNImage source={require('../../assets/tiger_sitting.png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
        </View>

        {/* Canvas Area */}
        <View style={[styles.canvasContainer, mode === 'test' && styles.testBorder]}>
          <GestureDetector gesture={pan}>
            <Canvas style={{ flex: 1 }}>
              {/* 1. Underlying Character Stencil (Faint) */}
              {bgPath && <Path path={bgPath} style="stroke" strokeWidth={STROKE_WIDTH} color="#FFF3E0" strokeCap="round" strokeJoin="round" />}
              {bgPath && <Path path={bgPath} style="stroke" strokeWidth={2} color="#E0E0E0" strokeCap="round" strokeJoin="round" />}

              {/* 2. Committed (Correct) Ink - Previous Strokes */}
              <Path path={completedPath} style="stroke" strokeWidth={STROKE_WIDTH} color={THEME.filled} strokeCap="round" strokeJoin="round" />

              {/* 3. Active Drawing (Masked Reveal) */}
              {targetStrokePath && (
                <Group>
                  {/* Visual guide of current stroke (Dashed/Faint) - ONLY in Practice */}
                  {mode === 'practice' && (
                    <Path
                      path={targetStrokePath}
                      style="stroke"
                      strokeWidth={STROKE_WIDTH}
                      color="#FFECB3"
                      strokeCap="round"
                      strokeJoin="round"
                    />
                  )}

                  {/* Actual User Ink */}
                  <Mask
                    mode="luminance"
                    mask={
                      <Group>
                        <Path path={userPath} style="stroke" strokeWidth={REVEAL_SIZE} color="white" strokeCap="round" strokeJoin="round" />
                      </Group>
                    }
                  >
                    <Path path={targetStrokePath} style="stroke" strokeWidth={STROKE_WIDTH} color={THEME.filled} strokeCap="round" strokeJoin="round" />
                  </Mask>
                </Group>
              )}

              {/* 4. Guides (Start/End/Arrow) - Hidden in Test Mode */}
              {mode === 'practice' && (
                <Group>
                  {/* Start Dot */}
                  {startPoint && (
                    <Circle cx={startPoint.x} cy={startPoint.y} r={20} color={THEME.guide}>
                    </Circle>
                  )}

                  {/* Arrow Guide */}
                  {arrowPath && startPoint && (
                    <Path path={arrowPath} color={THEME.outline} style="fill" />
                  )}

                  {/* End Dot */}
                  {endPoint && (
                    <Circle cx={endPoint.x} cy={endPoint.y} r={15} color={THEME.end} style="stroke" strokeWidth={4} />
                  )}
                </Group>
              )}

              {/* Particles */}
              <ParticleSystem x={fingerX} y={fingerY} active={isDrawing} />
            </Canvas>
          </GestureDetector>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.hint}>
            {mode === 'practice' ? "Start at Green, go to Red!" : "You can do it!"}
          </Text>
        </View>

      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    alignItems: "center"
  },
  headerBadge: {
    backgroundColor: THEME.stroke,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 4
  },
  title: { color: "#5A3E29", fontSize: 28, fontWeight: "900" },
  modeText: { fontSize: 16, fontWeight: "700", color: THEME.outline, letterSpacing: 0.5 },
  closeBtn: {
    backgroundColor: "white",
    borderRadius: 20,
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#eee'
  },
  canvasContainer: {
    width: 340, height: 420,
    alignSelf: "center", marginTop: 30,
    backgroundColor: "white",
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: "#5A3E29", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 12,
    borderWidth: 8, borderColor: 'white'
  },
  testBorder: { borderColor: THEME.stroke },
  footerContainer: { marginTop: 40, alignItems: 'center' },
  hint: { color: "#8D6E63", textAlign: "center", fontSize: 20, fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: THEME.bg },
  bigText: { color: THEME.filled, fontSize: 36, fontWeight: "900", marginBottom: 10 },
  subText: { color: THEME.outline, fontSize: 18, marginBottom: 30, fontWeight: '600' },
  btn: { backgroundColor: THEME.stroke, paddingHorizontal: 50, paddingVertical: 18, borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4 },
  btnText: { color: "#5A3E29", fontSize: 22, fontWeight: "900" }
});