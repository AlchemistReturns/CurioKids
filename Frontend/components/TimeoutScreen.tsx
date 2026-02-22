import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Asset } from 'expo-asset';
import * as Speech from 'expo-speech';
import { useSession } from '../context/SessionContext';

const { width, height } = Dimensions.get('window');

const FALLBACK_LOGOUT_DELAY = 10000; // 10 seconds fallback if video fails

export const TimeoutScreen = () => {
    const video = useRef<Video>(null);
    const [isReady, setIsReady] = useState(false);
    const hasLoggedOut = useRef(false);
    const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { logout } = useSession();

    const safeLogout = async () => {
        if (hasLoggedOut.current) return;
        hasLoggedOut.current = true;
        console.log('[TimeoutScreen] Triggering logout...');

        if (fallbackTimer.current) {
            clearTimeout(fallbackTimer.current);
            fallbackTimer.current = null;
        }

        Speech.stop();

        try {
            await logout();
        } catch (e) {
            console.error('[TimeoutScreen] Logout failed:', e);
        }
    };

    useEffect(() => {
        fallbackTimer.current = setTimeout(() => {
            console.warn('[TimeoutScreen] Fallback timer triggered — forcing logout');
            safeLogout();
        }, FALLBACK_LOGOUT_DELAY);

        // Speak the message after a short delay
        const speechTimer = setTimeout(() => {
            Speech.speak('Lumo is tired. Lumo is going to sleep.', {
                language: 'en-US',
                pitch: 1.1,
                rate: 0.85,
            });
        }, 800);

        const cacheVideo = async () => {
            try {
                const asset = Asset.fromModule(require('../assets/lumo_tired.mp4'));
                await asset.downloadAsync();
                setIsReady(true);
            } catch (e) {
                console.warn('[TimeoutScreen] Failed to cache video:', e);
                setIsReady(true);
            }
        };

        cacheVideo();

        return () => {
            if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
            clearTimeout(speechTimer);
            Speech.stop();
        };
    }, []);

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
            safeLogout();
        }
    };

    const handleVideoError = (error: string) => {
        console.error('[TimeoutScreen] Video error:', error);
        setTimeout(() => safeLogout(), 3000);
    };

    if (!isReady) {
        return (
            <View style={styles.container}>
                <View style={styles.overlay}>
                    <Text style={styles.title}>Time's Up!</Text>
                    <Text style={styles.subtitle}>Ask your parent for more time.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Video
                ref={video}
                style={styles.video}
                source={require('../assets/lumo_tired.mp4')}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping={false}
                isMuted={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onError={handleVideoError}
            />
            <View style={styles.overlay}>
                <Text style={styles.title}>Time's Up!</Text>
                <Text style={styles.subtitle}>Ask your parent for more time.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        backgroundColor: '#000',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    video: {
        width: width,
        height: height,
        position: 'absolute',
    },
    overlay: {
        position: 'absolute',
        bottom: 100,
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
    },
    title: {
        color: 'white',
        fontSize: 40,
        fontWeight: '900',
        marginBottom: 10,
    },
    subtitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
