import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, firestore } from "../config/firebase";

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const normalizeError = (err: any) => {
        const code = err?.code ?? err?.message ?? "unknown";
        return String(code)
            .replace("auth/", "")
            .replace(/[-_.()]/g, " ")
            .trim();
    };

    const handleSignIn = async () => {
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            // 1) Sign in
            const cred = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            const uid = cred.user.uid as string;

            // 2) Read user doc to get role
            const userDocRef = doc(firestore, "users", uid);
            const userSnap = await getDoc(userDocRef);

            if (!userSnap.exists()) {
                // No user document — sign out and show helpful message
                await auth.signOut();
                throw new Error(
                    "No user profile found. Please complete registration."
                );
            }

            router.replace("/(tabs)/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(normalizeError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6">
            <View className="bg-white px-4 py-12 rounded-xl">
                <Text className="text-3xl font-bold mb-8 text-center text-primary">
                    Login
                </Text>

                <TextInput
                    className="h-12 border border-primary rounded-lg px-4 mb-4 text-primary"
                    placeholder="Email"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    className="h-12 border border-primary rounded-lg px-4 mb-4 text-primary"
                    placeholder="********"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {error ? (
                    <Text className="text-primary mb-4 text-center font-semibold">
                        {error}
                    </Text>
                ) : null}

                {loading ? (
                    <ActivityIndicator
                        size="large"
                        color="#3f51b5"
                        className="my-2"
                    />
                ) : (
                    <View className="rounded-lg overflow-hidden mb-4 bg-secondary">
                        <TouchableOpacity
                            className="bg-secondary py-4 px-8 rounded-xl w-full"
                            onPress={handleSignIn}
                        >
                            <Text className="text-primary text-xl font-bold text-center">
                                Sign in
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View className="flex-row justify-center mt-5">
                    <Text className="text-primary">
                        Don&#39;t have an account?{" "}
                    </Text>
                    <Text
                        className="text-primary font-bold"
                        onPress={() => router.replace("/")}
                    >
                        Sign Up
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default LoginScreen;
