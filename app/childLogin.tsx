import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Button, Text, TextInput, View } from 'react-native';
import { auth } from '../config/firebase';

const ChildLoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);



    const handleSignIn = async () => {
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const user= await signInWithEmailAndPassword(auth, email, password);
            router.replace("/childDashboard");
        } catch (err: any) {
            console.error(err);
            let errorMessage = err.message || "An unknown error occurred.";
            if (errorMessage.includes("auth/")) {
                errorMessage = errorMessage.substring(
                    errorMessage.indexOf("auth/") + 5,
                    errorMessage.indexOf(")")
                ).replace(/-/g, ' ');
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6 bg-gray-100">
            <Text className="text-3xl font-bold mb-8 text-center text-gray-800">
                Welcome Back Kid
            </Text>

            <TextInput
                className="h-12 border border-gray-300 rounded-lg px-4 mb-4 bg-white text-gray-600"
                placeholder="Email"
                placeholderTextColor="#AAA"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                className="h-12 border border-gray-300 rounded-lg px-4 mb-4 bg-white text-gray-600"
                placeholder="Password"
                placeholderTextColor="#AAA"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            {error ? (
                <Text className="text-red-600 mb-4 text-center font-semibold">
                    {error}
                </Text>
            ) : null}

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" className="my-2" />
            ) : (
                <View className="rounded-lg overflow-hidden mb-4">
                    <Button title="Sign In" onPress={handleSignIn} color="#007AFF" />
                </View>
            )}

            <View className="flex-row justify-center mt-5">
                <Text className="text-gray-600">Don&#39;t have an account? </Text>
                <Text
                    className="text-blue-600 font-bold"
                    onPress={() => router.replace("/childRegistration")}
                >
                    Sign Up
                </Text>
            </View>
        </View>
    );
};

export default ChildLoginScreen;
