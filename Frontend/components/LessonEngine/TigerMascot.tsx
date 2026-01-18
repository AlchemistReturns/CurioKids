import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    Easing
} from "react-native-reanimated";

type TigerMood = 'happy' | 'thinking' | 'sad' | 'success' | 'peeping';

interface TigerMascotProps {
    mood?: TigerMood;
    size?: 'small' | 'medium' | 'large';
    showSpeechBubble?: boolean;
    speechText?: string;
    style?: any;
}

/**
 * TigerMascot - A cute, animated tiger mascot for CurioKids games
 * 
 * Moods:
 * - happy: Default cheerful state
 * - thinking: Waiting for answer, gentle bobbing
 * - sad: Wrong answer, slight droop
 * - success: Correct answer, bouncing celebration
 * - peeping: Only shows head peeping from top/corner
 */
export default function TigerMascot({
    mood = 'happy',
    size = 'medium',
    showSpeechBubble = false,
    speechText = '',
    style
}: TigerMascotProps) {
    // Animation values
    const bounceY = useSharedValue(0);
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    // Size configurations
    const sizeConfig = {
        small: { body: 80, face: 60, emoji: 32 },
        medium: { body: 120, face: 90, emoji: 48 },
        large: { body: 160, face: 120, emoji: 64 }
    };
    const s = sizeConfig[size];

    useEffect(() => {
        // Reset animations
        bounceY.value = 0;
        scale.value = 1;
        rotation.value = 0;

        switch (mood) {
            case 'success':
                // Celebratory bounce
                bounceY.value = withRepeat(
                    withSequence(
                        withTiming(-20, { duration: 200, easing: Easing.out(Easing.quad) }),
                        withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) })
                    ),
                    4,
                    false
                );
                scale.value = withSequence(
                    withTiming(1.1, { duration: 150 }),
                    withTiming(1, { duration: 150 })
                );
                break;

            case 'thinking':
                // Gentle idle bobbing
                bounceY.value = withRepeat(
                    withSequence(
                        withTiming(-5, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
                        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) })
                    ),
                    -1, // Infinite
                    true
                );
                break;

            case 'sad':
                // Slight droop
                bounceY.value = withTiming(8, { duration: 300 });
                scale.value = withTiming(0.95, { duration: 300 });
                rotation.value = withSequence(
                    withTiming(-0.05, { duration: 100 }),
                    withTiming(0.05, { duration: 100 }),
                    withTiming(0, { duration: 100 })
                );
                break;

            case 'peeping':
                // Subtle peek animation
                bounceY.value = withRepeat(
                    withSequence(
                        withTiming(-3, { duration: 800 }),
                        withTiming(0, { duration: 800 })
                    ),
                    -1,
                    true
                );
                break;

            default: // happy
                // Gentle breathing
                scale.value = withRepeat(
                    withSequence(
                        withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
                        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) })
                    ),
                    -1,
                    true
                );
        }
    }, [mood]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: bounceY.value },
            { scale: scale.value },
            { rotate: `${rotation.value}rad` }
        ]
    }));

    // Get face emoji based on mood
    const getFaceEmoji = () => {
        switch (mood) {
            case 'success': return '😸';
            case 'sad': return '😿';
            case 'thinking': return '🤔';
            case 'peeping': return '🐯';
            default: return '😺';
        }
    };

    // Peeping variant (just head)
    if (mood === 'peeping') {
        return (
            <Animated.View style={[animatedStyle, style]} className="items-center">
                {/* Tiger head peeping */}
                <View
                    className="rounded-b-full overflow-hidden"
                    style={{
                        width: s.body * 0.8,
                        height: s.body * 0.5,
                        backgroundColor: '#F5A623'
                    }}
                >
                    {/* Ears */}
                    <View className="flex-row justify-between absolute -top-2 w-full px-2">
                        <View className="w-6 h-6 rounded-full bg-[#F5A623] border-2 border-[#D48806]" />
                        <View className="w-6 h-6 rounded-full bg-[#F5A623] border-2 border-[#D48806]" />
                    </View>
                    {/* Face */}
                    <View className="flex-1 justify-center items-center pt-4">
                        <Text style={{ fontSize: s.emoji * 0.8 }}>👀</Text>
                    </View>
                    {/* Stripes */}
                    <View className="absolute top-1 left-2 w-3 h-1 bg-[#8B4513] rounded-full" />
                    <View className="absolute top-1 right-2 w-3 h-1 bg-[#8B4513] rounded-full" />
                    <View className="absolute top-3 left-3 w-2 h-1 bg-[#8B4513] rounded-full" />
                    <View className="absolute top-3 right-3 w-2 h-1 bg-[#8B4513] rounded-full" />
                </View>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[animatedStyle, style]} className="items-center">
            {/* Speech Bubble */}
            {showSpeechBubble && speechText && (
                <View className="bg-white rounded-2xl px-4 py-3 mb-2 shadow-lg max-w-[200px]">
                    <Text className="text-gray-800 text-center font-medium text-base">
                        {speechText}
                    </Text>
                    {/* Speech bubble tail */}
                    <View
                        className="absolute -bottom-2 left-1/2 -ml-2 w-0 h-0"
                        style={{
                            borderLeftWidth: 8,
                            borderRightWidth: 8,
                            borderTopWidth: 10,
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderTopColor: 'white'
                        }}
                    />
                </View>
            )}

            {/* Tiger Body Container */}
            <View
                className="rounded-3xl justify-end items-center overflow-hidden shadow-lg"
                style={{
                    width: s.body,
                    height: s.body,
                    backgroundColor: '#FFF3E0'
                }}
            >
                {/* Background gradient effect */}
                <View
                    className="absolute inset-0 rounded-3xl"
                    style={{ backgroundColor: '#FFE0B2', opacity: 0.5 }}
                />

                {/* Tiger Face Circle */}
                <View
                    className="rounded-full justify-center items-center shadow-md border-4 mb-2"
                    style={{
                        width: s.face,
                        height: s.face,
                        backgroundColor: '#F5A623',
                        borderColor: '#D48806'
                    }}
                >
                    {/* Ears */}
                    <View className="absolute -top-3 flex-row justify-between w-full px-1">
                        <View className="w-8 h-8 rounded-full bg-[#F5A623] border-2 border-[#D48806]">
                            <View className="w-4 h-4 rounded-full bg-[#FFCC80] absolute top-1 left-1" />
                        </View>
                        <View className="w-8 h-8 rounded-full bg-[#F5A623] border-2 border-[#D48806]">
                            <View className="w-4 h-4 rounded-full bg-[#FFCC80] absolute top-1 right-1" />
                        </View>
                    </View>

                    {/* Stripes on forehead */}
                    <View className="absolute top-3 left-3 w-3 h-1 bg-[#8B4513] rounded-full" />
                    <View className="absolute top-3 right-3 w-3 h-1 bg-[#8B4513] rounded-full" />
                    <View className="absolute top-5 left-4 w-3 h-1 bg-[#8B4513] rounded-full rotate-12" />
                    <View className="absolute top-5 right-4 w-3 h-1 bg-[#8B4513] rounded-full -rotate-12" />

                    {/* Face emoji */}
                    <Text style={{ fontSize: s.emoji, marginTop: 8 }}>{getFaceEmoji()}</Text>
                </View>

                {/* Body decorations - Paws */}
                <View className="flex-row justify-center gap-4 mb-1">
                    <View className="w-8 h-6 rounded-full bg-[#F5A623]" />
                    <View className="w-8 h-6 rounded-full bg-[#F5A623]" />
                </View>
            </View>

            {/* Name Badge */}
            <View
                className="px-3 py-1 rounded-full -mt-3 border-2 border-white shadow-sm"
                style={{ backgroundColor: '#FF9800' }}
            >
                <Text className="text-white font-bold text-xs">LUMO</Text>
            </View>
        </Animated.View>
    );
}

// Export speech bubble as a separate component for flexible positioning
export function TigerSpeechBubble({
    text,
    position = 'left'
}: {
    text: string;
    position?: 'left' | 'right'
}) {
    return (
        <View
            className={`bg-white rounded-2xl px-4 py-3 shadow-lg max-w-[200px] ${position === 'left' ? 'mr-2' : 'ml-2'
                }`}
        >
            <Text className="text-gray-800 text-center font-medium text-base">
                {text}
            </Text>
            {/* Speech bubble tail */}
            <View
                className={`absolute top-1/2 -mt-2 w-0 h-0 ${position === 'left' ? '-right-2' : '-left-2'
                    }`}
                style={{
                    borderTopWidth: 8,
                    borderBottomWidth: 8,
                    [position === 'left' ? 'borderLeftWidth' : 'borderRightWidth']: 10,
                    borderTopColor: 'transparent',
                    borderBottomColor: 'transparent',
                    [position === 'left' ? 'borderLeftColor' : 'borderRightColor']: 'white'
                }}
            />
        </View>
    );
}
