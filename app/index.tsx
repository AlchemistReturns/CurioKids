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

            <Text className="text-lg mb-12 text-center bg-orange-200 p-4 rounded-full text-orange-500 font-bold">
                Learning made fun and effective
            </Text>

            <Text className="text-6xl font-bold mb-8 text-center text-primary">
                Unlock Your Child's Potential
            </Text>

            <Text className="text-xl mb-12 text-center">
                CurioKids is a gamified learning app that uses engaging lessons to teach skills, featuring AI support tutor and parental dashboard for monitoring progress.
            </Text>

            <TouchableOpacity
                className="bg-secondary py-4 px-8 rounded-xl w-full mb-4"
                onPress={goToLogin}
            >
                <Text className="text-primary text-3xl font-bold text-center">
                    Get Started
                </Text>
            </TouchableOpacity>

            {/* <Text className="mb-4 text-3xl font-bold text-primary">
                Register
            </Text> */}

            <View className="flex flex-row justify-between items-center w-full bg-white rounded-xl p-1">
                <TouchableOpacity
                    className="bg-base py-4 px-8 rounded-xl"
                    onPress={goToRegistration}
                >
                    <Text className="text-primary text-xl font-semibold text-center">
                        Parent Signup
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-white py-4 px-8 rounded-xl"
                    onPress={goToChildRegistration}
                >
                    <Text className="text-primary text-xl font-semibold text-center">
                        Child Signup
                    </Text>
                </TouchableOpacity>
            </View>

            <Text className="absolute bottom-10 text-xs text-primary">
                All rights reserved
            </Text>
        </View>
    );
};

export default AppIndexScreen;
