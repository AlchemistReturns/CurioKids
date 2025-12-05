import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { router } from 'expo-router';

const DashboardScreen = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.replace('/login');
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <ActivityIndicator size="large" color="#007AFF" />
                <Text className="mt-2 text-gray-600 text-base">
                    Checking authentication status...
                </Text>
            </View>
        );
    }

    if (!user) return null;

    return (
        <View className="flex-1 px-6 bg-gray-100 pt-20">
            <Text className="text-2xl font-bold text-center mb-10 text-gray-800">
                Welcome to Your Dashboard
            </Text>

            <View className="bg-white p-5 rounded-xl shadow-md mb-10">
                <Text className="text-gray-500 text-base mb-1">Authenticated User:</Text>

                <Text className="text-lg font-semibold text-blue-600 mb-2">
                    {user.email}
                </Text>

                <Text className="text-sm text-gray-500 font-mono">
                    UID: {user.uid}
                </Text>
            </View>

            <View className="rounded-lg overflow-hidden">
                <Button title="Sign Out" onPress={handleSignOut} color="#FF3B30" />
            </View>
        </View>
    );
};

export default DashboardScreen;
