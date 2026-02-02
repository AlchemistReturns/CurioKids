import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Asset } from 'expo-asset';
import { useSession } from '../context/SessionContext';

const { width, height } = Dimensions.get('window');

export const TimeoutScreen = () => {
    const video = React.useRef<Video>(null);
    const [isReady, setIsReady] = useState(false);
    const { logout } = useSession();

    useEffect(() => {
        const cacheVideo = async () => {
            try {
                // Preload/Cache the video asset
                const asset = Asset.fromModule(require('../assets/lumo_tired.mp4'));
                await asset.downloadAsync();
                setIsReady(true);
            } catch (e) {
                console.warn("Failed to cache video:", e);
                // Even if cache fails, we try to render
                setIsReady(true);
            }
        };

        cacheVideo();
    }, []);

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
            // Video finished, logout the child
            logout();
        }
    };

    if (!isReady) {
        return <View style={styles.container} />;
    }

    return (
        <View style={styles.container}>
            <Video
                ref={video}
                style={styles.video}
                source={require('../assets/lumo_tired.mp4')}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping={false} // Run once
                isMuted={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
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
