import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthService } from "../../services/AuthService";

const ChildRegistrationScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [parentKey, setParentKey] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password || !parentKey) {
            setError("Please enter name, email, password and parent key.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            await AuthService.register(email, password, name, null, 'child', parentKey);
            router.replace("/(tabs)/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Registration failed");
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
                            <View className="items-center mb-6">
                                <Image
                                    source={require('../../assets/tiger.png')}
                                    className="w-40 h-40"
                                    resizeMode="contain"
                                />
                            </View>

                            <View className="bg-white/20 p-6 rounded-3xl">
                                <Text className="text-3xl font-bold mb-6 text-center text-white shadow-sm">
                                    Child Signup
                                </Text>

                                <TextInput
                                    className="h-14 bg-white rounded-full px-6 mb-4 text-primary text-base"
                                    placeholder="Child's Name"
                                    placeholderTextColor="#aaa"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />

                                <TextInput
                                    className="h-14 bg-white rounded-full px-6 mb-4 text-primary text-base"
                                    placeholder="Child's Email"
                                    placeholderTextColor="#aaa"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                <TextInput
                                    className="h-14 bg-white rounded-full px-6 mb-4 text-primary text-base"
                                    placeholder="Password (min 6 chars)"
                                    placeholderTextColor="#aaa"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />

                                <TextInput
                                    className="h-14 bg-white rounded-full px-6 mb-6 text-primary text-base"
                                    placeholder="Parent Key"
                                    placeholderTextColor="#aaa"
                                    value={parentKey}
                                    onChangeText={setParentKey}
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
                                        onPress={handleSignUp}
                                    >
                                        <Text className="text-white text-xl font-bold text-center">
                                            Create Account
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <View className="flex-row justify-center mt-2">
                                    <Text className="text-white text-base">
                                        Already have an account?{" "}
                                    </Text>
                                    <Text
                                        className="text-white font-bold text-base underline"
                                        onPress={() => router.replace("../login")}
                                    >
                                        Sign In
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

export default ChildRegistrationScreen;
