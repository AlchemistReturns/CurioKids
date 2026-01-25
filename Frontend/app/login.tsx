import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthService } from "../services/AuthService";
import { useSession } from "../context/SessionContext";

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useSession();

    const handleSignIn = async () => {
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const user = await AuthService.login(email, password);
            await login(user);
            router.replace("/(tabs)/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-tigerYellow">
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                        <View className="px-6 pb-8">
                            {/* Tiger Image */}
                            <View className="items-center mb-8">
                                <Image
                                    source={require('../assets/tiger.png')}
                                    className="w-48 h-48"
                                    resizeMode="contain"
                                />
                            </View>

                            <View className="bg-white/20 p-6 rounded-3xl">
                                <Text className="text-3xl font-bold mb-8 text-center text-white shadow-sm">
                                    Welcome Back!
                                </Text>

                                <TextInput
                                    className="h-14 bg-white rounded-full px-6 mb-4 text-primary text-base"
                                    placeholder="Email"
                                    placeholderTextColor="#aaa"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                <TextInput
                                    className="h-14 bg-white rounded-full px-6 mb-6 text-primary text-base"
                                    placeholder="Password"
                                    placeholderTextColor="#aaa"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />

                                {error ? (
                                    <View className="bg-red-100 p-3 rounded-xl mb-4">
                                        <Text className="text-red-500 text-center font-semibold">
                                            {error}
                                        </Text>
                                    </View>
                                ) : null}

                                {loading ? (
                                    <ActivityIndicator
                                        size="large"
                                        color="#FFF"
                                        className="my-4"
                                    />
                                ) : (
                                    <TouchableOpacity
                                        className="bg-tigerOrange py-4 rounded-full w-full shadow-sm mb-4"
                                        onPress={handleSignIn}
                                    >
                                        <Text className="text-white text-xl font-bold text-center">
                                            Sign In
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <View className="flex-row justify-center mt-2">
                                    <Text className="text-white text-base">
                                        Don't have an account?{" "}
                                    </Text>
                                    <Text
                                        className="text-white font-bold text-base underline"
                                        onPress={() => router.replace("/")}
                                    >
                                        Sign Up
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

export default LoginScreen;
