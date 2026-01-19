import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, PanResponder, Animated as RNAnimated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import TigerMascot from "./TigerMascot";
import { audioManager } from "./AudioManager";

const { width, height } = Dimensions.get("window");

interface Weight {
    id: string;
    value: number;
    x: number;
    y: number;
}

interface BalanceScaleGameProps {
    leftTotal: number;
    availableWeights: number[];
    rightTotal?: number;
    theme?: string;
    mascot?: string;
    mode?: string;
    mysterySlots?: number;
    fruitConversion?: any;
    leftDisplay?: string;
    hint?: string;
    onComplete: (score: number, stars: number) => void;
    onExit: () => void;
}

const SCALE_DROP_ZONE = {
    x: width * 0.5,  // Expanded from 0.6 to 0.5
    y: height * 0.25, // Expanded from 0.3 to 0.25
    width: width * 0.35, // Expanded from 0.25 to 0.35
    height: height * 0.25, // Expanded from 0.15 to 0.25
};

export default function BalanceScaleGame({
    leftTotal,
    availableWeights,
    rightTotal: initialRightTotal = 0,
    theme = "jungle",
    mascot = "elephant",
    mode = "standard",
    mysterySlots = 0,
    fruitConversion,
    leftDisplay,
    hint,
    onComplete,
    onExit,
}: BalanceScaleGameProps) {
    const [rightTotal, setRightTotal] = useState(initialRightTotal);
    const [placedWeights, setPlacedWeights] = useState<Weight[]>([]);
    const [initialRightWeights, setInitialRightWeights] = useState<Weight[]>([]);
    const [inventoryWeights, setInventoryWeights] = useState<Weight[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes timer
    const [showTimeUp, setShowTimeUp] = useState(false);

    const tiltAngle = useSharedValue(0);
    const lastTiltDirection = useRef<string>("balanced");
    const winTimerRef = useRef<NodeJS.Timeout | null>(null);
    const soundTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Load sounds
        let tiltSound: Audio.Sound | null = null;
        let dropSound: Audio.Sound | null = null;
        let successSound: Audio.Sound | null = null;
        let timeUpSound: Audio.Sound | null = null;

        const loadSounds = async () => {
            try {
                // Use correct_ding for scale creak (replace with scale_creak.mp3 when available)
                const { sound: tilt } = await Audio.Sound.createAsync(
                    require("../../assets/sounds/correct_ding.mp3")
                );
                tiltSound = tilt;

                // Use correct_dinger for win sound (better than cheer)
                const { sound: success } = await Audio.Sound.createAsync(
                    require("../../assets/sounds/correct_dinger.mp3")
                );
                successSound = success;
            } catch (error) {
                console.log("Error loading sounds:", error);
            }
        };

        loadSounds();

        // Initialize inventory weights
        const weights: Weight[] = availableWeights.map((value, index) => ({
            id: `weight-${index}`,
            value,
            x: 0,
            y: 0,
        }));
        setInventoryWeights(weights);

        // Initialize right side weights for subtraction mode
        if (mode === "subtraction" && initialRightTotal > 0) {
            const initialWeights: Weight[] = [{
                id: 'initial-rock',
                value: initialRightTotal,
                x: 0,
                y: 0
            }];
            setInitialRightWeights(initialWeights);
        }

        // Speak instruction immediately when game loads
        const instructionText = mode === "subtraction"
            ? "Use balloons to lift weight away!"
            : mode === "mystery"
                ? "Fill the mystery boxes to balance!"
                : mode === "fruit"
                    ? "One pineapple equals two cherries"
                    : "Drag weights to balance the scale!";

        // Short delay to let UI render first
        const instructionTimer = setTimeout(() => {
            audioManager.speakQuestion(instructionText);
        }, 500);

        // Show hint after 10 seconds and speak it
        const hintTimer = setTimeout(() => {
            setShowHint(true);
            if (hint) {
                audioManager.speakQuestion(hint);
            }
        }, 10000);

        // Timer countdown
        const timerInterval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerInterval);
                    setShowTimeUp(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearTimeout(instructionTimer);
            clearTimeout(hintTimer);
            clearInterval(timerInterval);
            audioManager.stopSpeaking();
            // Unload sounds
            if (tiltSound) tiltSound.unloadAsync();
            if (successSound) successSound.unloadAsync();
        };
    }, []);

    useEffect(() => {
        // Calculate tilt angle based on balance
        const difference = leftTotal - rightTotal;

        const playTiltSound = async () => {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    require("../../assets/sounds/seesaw.mp3")
                );
                await sound.playAsync();
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        sound.unloadAsync();
                    }
                });
            } catch (error) {
                console.log("Error playing tilt sound:", error);
            }
        };

        if (difference > 0) {
            // Left is heavier, tilt left (-20deg)
            if (lastTiltDirection.current !== "left") {
                playTiltSound();
                lastTiltDirection.current = "left";
            }
            tiltAngle.value = withSpring(-20, {
                damping: 8,
                stiffness: 100,
            });
        } else if (difference < 0) {
            // Right is heavier, tilt right (+20deg)
            if (lastTiltDirection.current !== "right") {
                playTiltSound();
                lastTiltDirection.current = "right";
            }
            tiltAngle.value = withSpring(20, {
                damping: 8,
                stiffness: 100,
            });
        } else {
            // Balanced (0deg) - play sound when becoming balanced
            if (lastTiltDirection.current !== "balanced") {
                playTiltSound();
                lastTiltDirection.current = "balanced";
            }
            tiltAngle.value = withSpring(0, {
                damping: 8,
                stiffness: 100,
            });
        }

        // Check win condition - only if we have placed weights and not already showing success
        // For subtraction mode, allow rightTotal to equal leftTotal (even if 0 or negative)
        const isBalanced = leftTotal === rightTotal;
        const hasPlacedWeights = placedWeights.length > 0;

        if (isBalanced && hasPlacedWeights && !showSuccess) {
            soundTimerRef.current = setTimeout(async () => {
                try {
                    // Use correct_dinger for winning sound
                    const { sound } = await Audio.Sound.createAsync(
                        require("../../assets/sounds/correct_dinger.mp3")
                    );
                    await sound.playAsync();
                    sound.setOnPlaybackStatusUpdate((status) => {
                        if (status.isLoaded && status.didJustFinish) {
                            sound.unloadAsync();
                        }
                    });
                } catch (error) {
                    console.log("Error playing success sound:", error);
                }
                setShowSuccess(true);
            }, 1200); // Delay to let scale visually balance before showing success
        }

        // Cleanup timers on unmount or when dependencies change
        return () => {
            if (soundTimerRef.current) {
                clearTimeout(soundTimerRef.current);
            }
            if (winTimerRef.current) {
                clearTimeout(winTimerRef.current);
            }
        };
    }, [leftTotal, rightTotal, placedWeights, showSuccess, onComplete]);

    const beamStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${tiltAngle.value}deg` }],
        };
    });

    // Get theme colors
    const getThemeColors = () => {
        switch (theme) {
            case "jungle": return { bg: "#90EE90", primary: "#228B22", secondary: "#8B4513" };
            case "sky": return { bg: "#87CEEB", primary: "#4169E1", secondary: "#B0E0E6" };
            case "cave": return { bg: "#2F4F4F", primary: "#696969", secondary: "#FFD700" };
            case "market": return { bg: "#FFE4B5", primary: "#FF8C00", secondary: "#FFD700" };
            default: return { bg: "#FFF8E1", primary: "#FF9800", secondary: "#F57C00" };
        }
    };

    const themeColors = getThemeColors();

    // Render mascot icon - now uses tiger
    const getMascotIcon = () => {
        return "🐯"; // Always use tiger now
    };

    // Render weight display
    const renderWeightDisplay = (value: number, isLeft = false) => {
        if (mode === "fruit") {
            if (isLeft && leftDisplay) {
                if (leftDisplay === "pineapple") return "🍍";
                if (leftDisplay === "pineapple-2") return "🍍 🍍";
                if (leftDisplay === "pineapple-cherry") return "🍍 🍒";
            }
            // For cherries on the right
            return "🍒";
        }

        if (mode === "subtraction" && value < 0) {
            return `🎈${Math.abs(value)}`;
        }

        return value.toString();
    };

    const renderFruitDisplay = (display: string) => {
        if (display === "pineapple") {
            return <Text style={{ fontSize: 40 }}>🍍</Text>;
        }
        if (display === "pineapple-2") {
            return (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 36 }}>🍍</Text>
                    <Text style={{ fontSize: 36 }}>🍍</Text>
                </View>
            );
        }
        if (display === "pineapple-cherry") {
            return (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 36 }}>🍍</Text>
                    <Text style={{ fontSize: 36 }}>🍒</Text>
                </View>
            );
        }
        return <Text style={{ fontSize: 40 }}>{display}</Text>;
    };

    const handleWeightDrop = async (weightId: string, value: number, dropX: number, dropY: number, isFromScale: boolean = false) => {
        // Check if dropped on the right side of the scale
        const isOnScale =
            dropX >= SCALE_DROP_ZONE.x &&
            dropX <= SCALE_DROP_ZONE.x + SCALE_DROP_ZONE.width &&
            dropY >= SCALE_DROP_ZONE.y &&
            dropY <= SCALE_DROP_ZONE.y + SCALE_DROP_ZONE.height;

        if (isFromScale) {
            // Removing from scale back to inventory
            if (!isOnScale) {
                setRightTotal((prev) => prev - value);
                setPlacedWeights((prev) => prev.filter((w) => w.id !== weightId));
                setInventoryWeights((prev) => [...prev, { id: weightId, value, x: 0, y: 0 }]);
            }
        } else {
            // Adding from inventory to scale
            if (isOnScale) {
                setRightTotal((prev) => prev + value);
                setPlacedWeights((prev) => [
                    ...prev,
                    { id: weightId, value, x: SCALE_DROP_ZONE.x + 20, y: SCALE_DROP_ZONE.y + 40 },
                ]);
                setInventoryWeights((prev) => prev.filter((w) => w.id !== weightId));
            }
        }
        // If not on scale/inventory, weight will snap back (handled by gesture handler)
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => {
                        // Clean up all timers before exiting
                        if (soundTimerRef.current) clearTimeout(soundTimerRef.current);
                        if (winTimerRef.current) clearTimeout(winTimerRef.current);
                        setShowSuccess(false);
                        onExit();
                    }} style={styles.exitButton}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Balance the Scale!</Text>
                </View>

                <View style={styles.gameArea}>
                    {/* Instructions */}
                    <View style={[styles.instructionBox, { backgroundColor: "white" }]}>
                        <View style={[styles.mascotRow, { alignItems: 'flex-start' }]}>
                            <TigerMascot mood="thinking" size="small" />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.instructionText}>
                                    {mode === "subtraction"
                                        ? "Use balloons to lift weight away!"
                                        : mode === "mystery"
                                            ? "Fill the mystery boxes to balance!"
                                            : mode === "fruit"
                                                ? `1 🍍 = 2 🍒`
                                                : "Drag weights to balance the scale!"}
                                </Text>
                                <View style={styles.balanceInfo}>
                                    <Text style={[styles.balanceText, { color: themeColors.primary }]}>
                                        Left: {mode === "fruit" && leftDisplay ? renderWeightDisplay(leftTotal, true) : leftTotal}
                                    </Text>
                                    <Text style={[styles.balanceText, { color: themeColors.primary }]}>Right: {rightTotal}</Text>
                                </View>
                            </View>
                        </View>
                        {showHint && hint && (
                            <View style={styles.hintBox}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.hintText}>💡 {hint}</Text>
                                    <TouchableOpacity
                                        onPress={() => audioManager.speakQuestion(hint)}
                                        style={{ marginLeft: 8, padding: 4 }}
                                    >
                                        <Ionicons name="volume-high" size={20} color="#FF9800" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Scale */}
                    <View style={styles.scaleContainer}>
                        {/* Fulcrum (Triangle) */}
                        <View style={styles.fulcrum} />

                        {/* Beam */}
                        <Animated.View style={[styles.beam, beamStyle, { backgroundColor: themeColors.secondary }]}>
                            {/* Left Side */}
                            <View style={[styles.scaleSide, styles.leftSide, { borderColor: themeColors.secondary }]}>
                                <View style={styles.weightContainer}>
                                    {mode === "fruit" && leftDisplay ? (
                                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                                            {renderFruitDisplay(leftDisplay)}
                                        </View>
                                    ) : (
                                        <View style={[styles.weight, { backgroundColor: "#757575", width: 50, height: 50, borderRadius: 25 }]}>
                                            <Text style={[styles.weightText, { fontSize: 14 }]}>🪨{leftTotal}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Right Side - Drop Zone */}
                            <View style={[styles.scaleSide, styles.rightSide, { borderColor: themeColors.secondary }]}>
                                <View style={[styles.weightContainer, { flexWrap: "wrap", gap: 6 }]}>
                                    {/* Show initial weights (rocks) for subtraction mode */}
                                    {mode === "subtraction" && initialRightWeights.map((weight) => (
                                        <View
                                            key={weight.id}
                                            style={[styles.weight, { backgroundColor: "#757575", width: 45, height: 45 }]}
                                        >
                                            <Text style={styles.weightText}>🪨{weight.value}</Text>
                                        </View>
                                    ))}

                                    {placedWeights.map((weight) => (
                                        <DraggablePlacedWeight
                                            key={weight.id}
                                            weight={weight}
                                            mode={mode}
                                            themeColor={themeColors.primary}
                                            onDrop={handleWeightDrop}
                                        />
                                    ))}
                                    {mode === "mystery" && mysterySlots > placedWeights.length && (
                                        [...Array(mysterySlots - placedWeights.length)].map((_, i) => (
                                            <View key={`mystery-${i}`} style={styles.mysteryBox}>
                                                <Text style={styles.mysteryText}>?</Text>
                                            </View>
                                        ))
                                    )}
                                </View>
                            </View>
                        </Animated.View>
                    </View>

                    {/* Inventory */}
                    <View style={[styles.inventory, { backgroundColor: "white" }]}>
                        <Text style={styles.inventoryTitle}>
                            {mode === "subtraction" ? "Balloons 🎈" : mode === "fruit" ? "Cherries 🍒" : "Available Weights"}
                        </Text>
                        <View style={styles.inventoryWeights}>
                            {inventoryWeights.map((weight) => (
                                <DraggableWeight
                                    key={weight.id}
                                    weight={weight}
                                    mode={mode}
                                    themeColor={themeColors.primary}
                                    onDrop={handleWeightDrop}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Timer Display */}
                    <View style={styles.timerContainer}>
                        <Ionicons name="timer-outline" size={20} color={timeLeft < 30 ? "#FF5252" : "#666"} />
                        <Text style={[styles.timerText, { color: timeLeft < 30 ? "#FF5252" : "#666" }]}>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                        </Text>
                    </View>

                    {/* Success Overlay */}
                    {showSuccess && (
                        <View style={styles.successOverlay}>
                            <Ionicons name="trophy" size={80} color="#FFD700" />
                            <Text style={styles.successText}>Perfect Balance!</Text>
                            <Text style={styles.successSubtext}>🎉 Great Job! 🎉</Text>
                            <TouchableOpacity
                                style={styles.tryAgainButton}
                                onPress={() => {
                                    const score = 50;
                                    const stars = 3;
                                    onComplete(score, stars);
                                }}
                            >
                                <Text style={styles.tryAgainText}>Continue →</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Time Up Overlay */}
                    {showTimeUp && (
                        <View style={styles.successOverlay}>
                            <Ionicons name="hourglass-outline" size={80} color="#FF9800" />
                            <Text style={styles.successText}>Time's Up!</Text>
                            <Text style={styles.successSubtext}>Let's try again! 💪</Text>
                            <TouchableOpacity
                                style={styles.tryAgainButton}
                                onPress={() => {
                                    setShowTimeUp(false);
                                    setTimeLeft(120);
                                    setRightTotal(initialRightTotal);
                                    setPlacedWeights([]);
                                    const weights: Weight[] = availableWeights.map((value, index) => ({
                                        id: `weight-${index}`,
                                        value,
                                        x: 0,
                                        y: 0,
                                    }));
                                    setInventoryWeights(weights);
                                }}
                            >
                                <Text style={styles.tryAgainText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </GestureHandlerRootView>
        </SafeAreaView>
    );
}

interface DraggableWeightProps {
    weight: Weight;
    mode?: string;
    themeColor?: string;
    onDrop: (id: string, value: number, x: number, y: number, isFromScale?: boolean) => void;
}

// Component for weights already placed on the scale (can be dragged back)
function DraggablePlacedWeight({ weight, mode = "standard", themeColor = "#FF9800", onDrop }: DraggableWeightProps) {
    const pan = useRef(new RNAnimated.ValueXY()).current;
    const scale = useRef(new RNAnimated.Value(1)).current;

    const getWeightColor = () => {
        if (mode === "subtraction" && weight.value < 0) return "#87CEEB";
        if (mode === "fruit") return "#FF6B6B";
        if (mode === "mystery" || mode === "standard") return "#757575"; // Stone style for mystery and standard
        return "#2196F3";
    };

    const getWeightDisplay = () => {
        if (mode === "subtraction" && weight.value < 0) return `🎈${Math.abs(weight.value)}`;
        if (mode === "fruit") return "🍒";
        if (mode === "mystery" || mode === "standard") return `🪨${weight.value}`; // Stone emoji for mystery and standard
        return weight.value.toString();
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                RNAnimated.spring(scale, {
                    toValue: 1.2,
                    useNativeDriver: false,
                }).start();
            },
            onPanResponderMove: RNAnimated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gesture) => {
                const dropX = gesture.moveX;
                const dropY = gesture.moveY;

                // Call onDrop with isFromScale flag
                onDrop(weight.id, weight.value, dropX, dropY, true);

                RNAnimated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: false,
                }).start();

                RNAnimated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                }).start();
            },
        })
    ).current;

    return (
        <RNAnimated.View
            style={[
                styles.weight,
                {
                    backgroundColor: getWeightColor(),
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale: scale },
                    ],
                },
            ]}
            {...panResponder.panHandlers}
        >
            <Text style={styles.weightText}>{getWeightDisplay()}</Text>
        </RNAnimated.View>
    );
}

function DraggableWeight({ weight, mode = "standard", themeColor = "#FF9800", onDrop }: DraggableWeightProps) {
    const pan = useRef(new RNAnimated.ValueXY()).current;
    const scale = useRef(new RNAnimated.Value(1)).current;

    const getWeightColor = () => {
        if (mode === "subtraction" && weight.value < 0) return "#87CEEB";
        if (mode === "fruit") return "#FF6B6B";
        if (mode === "mystery" || mode === "standard") return "#757575"; // Stone style
        return themeColor;
    };

    const getWeightDisplay = () => {
        if (mode === "subtraction" && weight.value < 0) return `🎈${Math.abs(weight.value)}`;
        if (mode === "fruit") return "🍒";
        if (mode === "mystery" || mode === "standard") return `🪨${weight.value}`; // Stone emoji
        return weight.value.toString();
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                RNAnimated.spring(scale, {
                    toValue: 1.2,
                    useNativeDriver: false,
                }).start();
            },
            onPanResponderMove: RNAnimated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gesture) => {
                // Calculate absolute position
                const dropX = gesture.moveX;
                const dropY = gesture.moveY;

                // Call onDrop with final position and false for isFromScale
                onDrop(weight.id, weight.value, dropX, dropY, false);

                // Reset animations
                RNAnimated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: false,
                }).start();

                RNAnimated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                }).start();
            },
        })
    ).current;

    return (
        <RNAnimated.View
            style={[
                styles.draggableWeight,
                {
                    backgroundColor: getWeightColor(),
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale: scale },
                    ],
                },
            ]}
            {...panResponder.panHandlers}
        >
            <Text style={styles.weightText}>{getWeightDisplay()}</Text>
        </RNAnimated.View>
    );
}

// --- TIGER THEME CONSTANTS ---
const THEME = {
    bg: '#FFF9E6', // Tiger Cream
    headerBg: '#FFC226', // Tiger Yellow
    primaryText: '#5A3E29', // Tiger Brown
    secondaryText: '#8D6E63',
    accent: '#FF6E4F', // Tiger Orange
    cardBg: '#FFFFFF',
    borderColor: '#FFC226'
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.bg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 20,
        backgroundColor: THEME.headerBg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#5A3E29",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 10
    },
    exitButton: {
        marginRight: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
        padding: 8,
        borderRadius: 20
    },
    headerText: {
        fontSize: 24,
        fontWeight: "900",
        color: THEME.primaryText,
        flex: 1,
        textAlign: "center",
        marginRight: 44,
    },
    gameArea: {
        flex: 1,
        padding: 20,
    },
    instructionBox: {
        backgroundColor: THEME.cardBg,
        padding: 16,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: THEME.borderColor,
        shadowColor: "#5A3E29",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 3,
    },
    instructionText: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "left",
        color: THEME.primaryText,
        marginBottom: 8,
        lineHeight: 24
    },
    balanceInfo: {
        flexDirection: "row",
        justifyContent: "flex-start",
        gap: 20
    },
    balanceText: {
        fontSize: 16,
        fontWeight: "bold",
        color: THEME.accent,
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden'
    },
    scaleContainer: {
        height: height * 0.35,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    fulcrum: {
        width: 0,
        height: 0,
        backgroundColor: "transparent",
        borderStyle: "solid",
        borderLeftWidth: 30,
        borderRightWidth: 30,
        borderBottomWidth: 60,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: "#8D6E63", // Wood color
        position: "absolute",
        bottom: 40,
    },
    beam: {
        width: width * 0.75,
        height: 14,
        backgroundColor: "#A1887F", // Wood beam
        borderRadius: 7,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        position: "absolute",
        top: height * 0.15,
        borderWidth: 2,
        borderColor: '#5D4037'
    },
    scaleSide: {
        width: width * 0.32,
        height: 100,
        borderWidth: 3,
        borderColor: "#8D6E63",
        borderTopWidth: 0,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        marginTop: 12,
        overflow: "hidden",
    },
    leftSide: {
        marginLeft: 10,
    },
    rightSide: {
        marginRight: 10,
    },
    weightContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        padding: 4,
        gap: 3,
        justifyContent: "center",
        alignItems: "center",
        flex: 1
    },
    weight: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "rgba(0,0,0,0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    weightText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
    },
    inventory: {
        backgroundColor: "white",
        padding: 24,
        borderRadius: 30,
        shadowColor: "#5A3E29",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        flex: 1
    },
    inventoryTitle: {
        fontSize: 20,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 20,
        color: THEME.primaryText,
    },
    inventoryWeights: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 16,
    },
    draggableWeight: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: THEME.headerBg,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: "white",
        shadowColor: "#5A3E29",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 6,
    },
    successOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 249, 230, 0.95)", // Tiger cream but opaque
        justifyContent: "center",
        alignItems: "center",
    },
    successText: {
        fontSize: 36,
        fontWeight: "900",
        color: THEME.primaryText,
        marginTop: 20,
    },
    successSubtext: {
        fontSize: 24,
        color: THEME.accent,
        fontWeight: 'bold',
        marginTop: 10,
    },
    mascotRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    mascotIcon: {
        fontSize: 40,
    },
    hintBox: {
        marginTop: 12,
        padding: 10,
        backgroundColor: "#FFF3E0",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: THEME.headerBg,
    },
    hintText: {
        fontSize: 16,
        color: "#E65100",
        textAlign: "center",
        fontWeight: "bold",
    },
    mysteryBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#E0E0E0",
        borderWidth: 3,
        borderStyle: "dashed",
        borderColor: THEME.headerBg,
        justifyContent: "center",
        alignItems: "center",
    },
    mysteryText: {
        fontSize: 24,
        fontWeight: "bold",
        color: THEME.headerBg,
    },
    timerContainer: {
        position: "absolute",
        top: 100, // Move closer to top
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFEBEE',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        gap: 6,
    },
    timerText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    tryAgainButton: {
        backgroundColor: THEME.headerBg,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
        marginTop: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    tryAgainText: {
        color: THEME.primaryText,
        fontSize: 20,
        fontWeight: "900",
    },
});