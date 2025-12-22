import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, Dimensions, View } from "react-native";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming, 
  withDelay,
  Easing,
  runOnJS,
  cancelAnimation
} from "react-native-reanimated";
import { audioManager } from "./AudioManager";

const { height } = Dimensions.get('window');

interface BubbleProps {
  id: string;
  label: string | number; 
  isTarget: boolean;      
  onInteraction: (isCorrect: boolean, timeTaken: number) => void;
  speed: number;
  initialX: number;
  delay: number;
}

export default function Bubble({ label, isTarget, onInteraction, speed, initialX, delay }: BubbleProps) {
  const translateY = useSharedValue(height + 150); 
  const scale = useSharedValue(0); 
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0); 
  const translateX = useSharedValue(initialX);
  const isPopped = useSharedValue(false);
  
  // Track when this bubble appeared to calculate score
  const startTime = React.useRef(Date.now() + delay); 

  useEffect(() => {
    // 1. Grow
    scale.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.bounce }));

    // 2. Float Up
    const duration = speed * 1000; 
    translateY.value = withDelay(
      delay, 
      withRepeat(
        withTiming(-200, { duration: duration, easing: Easing.linear }), 
        -1 
      )
    );

    // 3. Wiggle
    translateX.value = withDelay(
        delay,
        withRepeat(
            withSequence(
                withTiming(initialX - 25, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
                withTiming(initialX + 25, { duration: 2000, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        )
    );
  }, []);

  const handlePress = () => {
    if (isPopped.value) return;

    if (isTarget) {
      // --- CORRECT ---
      isPopped.value = true;
      audioManager.play('pop');
      
      const timeTaken = Date.now() - startTime.current;

      cancelAnimation(translateY);
      
      // Explosion Animation
      scale.value = withTiming(2.0, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 }, (finished) => {
        if (finished) runOnJS(onInteraction)(true, timeTaken);
      });

    } else {
      // --- WRONG ---
      audioManager.play('boing');
      runOnJS(onInteraction)(false, 0); 
      
      // Wiggle Animation
      rotation.value = withSequence(
        withTiming(-20, { duration: 50 }),
        withTiming(20, { duration: 50 }),
        withTiming(-20, { duration: 50 }),
        withTiming(20, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
      opacity: opacity.value
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={[styles.balloon, { backgroundColor: isTarget ? '#ff4081' : '#3f51b5' }]}>
           <View style={styles.shine} />
           <Text style={styles.text}>{label}</Text>
        </View>
        <View style={styles.string} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, zIndex: 10 },
  balloon: {
    width: 90, height: 110,
    borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    borderBottomLeftRadius: 50, borderBottomRightRadius: 50,
    borderTopLeftRadius: 50, borderTopRightRadius: 50,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)'
  },
  shine: {
    position: 'absolute', top: 15, right: 20,
    width: 15, height: 25,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20, transform: [{ rotate: '45deg' }]
  },
  string: {
    width: 2, height: 40, backgroundColor: '#ccc', alignSelf: 'center', marginTop: -2, zIndex: -1
  },
  text: { fontSize: 40, fontWeight: 'bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 2 }
});