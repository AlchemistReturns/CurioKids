import { router } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AppIndexScreen = () => {
    const [showSignupOptions, setShowSignupOptions] = useState(false);

    const goToLogin = () => {
        router.push("/login"); // Ensure this matches your login route
    };

    const goToParentSignup = () => {
        router.push("/parent/registration");
    };

    const goToChildSignup = () => {
        router.push("/child/registration");
    };

    return (
        <View className="flex-1 bg-tigerYellow">
            <SafeAreaView className="flex-1">
                <View className="flex-1 justify-center items-center px-6">

                    {/* Tiger Image Area */}
                    <View className="flex-1 justify-center items-center w-full mt-10">
                        <Image
                            source={require('../assets/tiger.png')}
                            className="w-full h-96"
                            resizeMode="contain"
                        />
                    </View>

                    {/* Buttons Area */}
                    <View className="w-full mb-12">
                        {!showSignupOptions ? (
                            <>
                                <TouchableOpacity
                                    className="bg-tigerOrange py-4 rounded-full w-full mb-4 shadow-sm"
                                    onPress={goToLogin}
                                >
                                    <Text className="text-white text-xl font-bold text-center">
                                        Sign In
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="bg-white border-2 border-white py-4 rounded-full w-full shadow-sm"
                                    onPress={() => setShowSignupOptions(true)}
                                >
                                    <Text className="text-tigerOrange text-xl font-bold text-center">
                                        Sign Up
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View className="bg-white/90 p-6 rounded-3xl w-full">
                                <Text className="text-tigerOrange text-center font-bold mb-6 text-xl">Create Account</Text>
                                <TouchableOpacity
                                    className="bg-tigerOrange py-4 rounded-full w-full mb-4 shadow-sm"
                                    onPress={goToParentSignup}
                                >
                                    <Text className="text-white text-xl font-bold text-center">
                                        Parent
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="bg-white border-2 border-tigerOrange py-4 rounded-full w-full mb-4 shadow-sm"
                                    onPress={goToChildSignup}
                                >
                                    <Text className="text-tigerOrange text-xl font-bold text-center">
                                        Child
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="py-2"
                                    onPress={() => setShowSignupOptions(false)}
                                >
                                    <Text className="text-tigerOrange/60 font-bold text-center">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AppIndexScreen;
