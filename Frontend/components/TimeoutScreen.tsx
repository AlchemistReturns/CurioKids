import React, { useEffect } from 'react';
import { View, Text, Image, BackHandler, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import * as Speech from 'expo-speech';
import { useSession } from '../context/SessionContext';
import { AuthService } from '../services/AuthService';

const MemoizedLottie = React.memo(() => (
    <LottieView
        source={require('../assets/lumo_tired.json')}
        style={styles.video}
        autoPlay
        loop
        resizeMode="cover"
    />
));

export default function TimeoutScreen() {
    const { isTimeout, logout } = useSession();
    // ... inside return ...
    <View style={styles.videoContainer}>
        <MemoizedLottie />
    </View>
    const scale = useSharedValue(1);

    // Audio: Speak once
    useEffect(() => {
        if (isTimeout) {
            Speech.speak("lumo is tired lumo need some rest ", {
                pitch: 0.9,
                rate: 0.8,
            });

            // Auto-Logout after 10 seconds
            const timer = setTimeout(async () => {
                await logout(); // Context logout
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [isTimeout]);

    // Block Back Button when Active
    useEffect(() => {
        const onBackPress = () => {
            if (isTimeout) {
                return true; // Prevent default behavior (going back)
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
    }, [isTimeout]);

    if (!isTimeout) return null;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.videoContainer}>
                    <View style={styles.videoContainer}>
                        <MemoizedLottie />
                    </View>
                </View>

                <Text style={styles.title}>Lumo Needs Rest</Text>
                <Text style={styles.subtitle}>
                    It's time for a break! See you later, explorer!
                </Text>

                {/* Optional: Add some floating 'Zzz' icons here if needed */}
                <View style={styles.zzzContainer}>
                    <Text style={styles.zzz}>z</Text>
                    <Text style={[styles.zzz, { fontSize: 40, marginTop: -20, marginLeft: 20 }]}>Z</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#5A3E29', // Dark comfort color
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999, // Ensure it sits on top of everything
    },
    content: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    videoContainer: {
        width: '100%',
        height: 400,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'red', // Debug: check bounds
    },
    video: {
        width: '100%',
        height: '100%',
    },
    title: {
        color: '#FFF9E6',
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255, 249, 230, 0.8)',
        fontSize: 18,
        textAlign: 'center',
        maxWidth: 300,
    },
    zzzContainer: {
        position: 'absolute',
        top: 20,
        right: 40,
    },
    zzz: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        opacity: 0.8,
    }
});
