import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const AppIndexScreen = () => {
    const goToRegistration = () => {
        router.push("/parent/registration");
    };

    const goToChildRegistration = () => {
        router.push("/child/registration");
    };

    const goToLogin = () => {
        router.push("/login");
    };

    return (
        <View className="flex-1 justify-center items-center px-6">
            <Text className="text-4xl font-bold mb-2 text-primary">
                Curiokids
            </Text>

            <Text className="text-lg text-secondary mb-8 text-center">
                Welcome to the learning platform!
            </Text>

            <TouchableOpacity
                className="bg-secondary py-4 px-8 rounded-xl shadow-md min-w-[200px] mb-8"
                onPress={goToLogin}
            >
                <Text className="text-base text-xl font-bold text-center">
                    Login
                </Text>
            </TouchableOpacity>

            <Text className="mb-4 text-3xl font-bold text-primary">
                Register
            </Text>

            <View className="flex flex-row gap-8 justify-center items-center">
                <TouchableOpacity
                    className="bg-secondary py-4 px-8 rounded-xl shadow-md"
                    onPress={goToRegistration}
                >
                    <Text className="text-base text-xl font-semibold text-center">
                        Parent
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-secondary py-4 px-8 rounded-xl shadow-md"
                    onPress={goToChildRegistration}
                >
                    <Text className="text-base text-xl font-semibold text-center">
                        Child
                    </Text>
                </TouchableOpacity>
            </View>

            <Text className="absolute bottom-10 text-xs text-secondary">
                All rights reserved
            </Text>
        </View>
    );
};

export default AppIndexScreen;
