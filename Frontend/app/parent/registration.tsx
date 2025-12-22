import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { AuthService } from "../../services/AuthService";

const RegistrationScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            await AuthService.register(email, password, name, null, 'parent');
            router.replace("/(tabs)/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6">
            <View className="bg-white px-6 py-12 rounded-xl">
                <Text className="text-3xl font-bold mb-8 text-center text-primary">
                    Create Account
                </Text>

                <TextInput
                    className="h-12 border border-primary rounded-lg px-4 mb-4"
                    placeholder="Name"
                    placeholderTextColor="#aaa"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="none"
                />

                <TextInput
                    className="h-12 border border-primary rounded-lg px-4 mb-4"
                    placeholder="Email"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    className="h-12 border border-primary rounded-lg px-4 mb-4"
                    placeholder="Password (min 6 characters)"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {error ? (
                    <Text className="text-primary mb-4 text-center">
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
                    <View className="rounded-lg overflow-hidden mb-4">
                        <TouchableOpacity
                            className="bg-secondary py-4 px-8 rounded-xl w-full"
                            onPress={handleSignUp}
                        >
                            <Text className="text-primary text-xl font-bold text-center">
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View className="flex-row justify-center mt-5">
                    <Text className="text-primary">
                        Already have an account?{" "}
                    </Text>
                    <Text
                        className="text-primary font-bold"
                        onPress={() => router.replace("../login")}
                    >
                        Sign In
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default RegistrationScreen;
