import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const AppIndexScreen = () => {

    const goToLogin = () => {
        router.push('/login');
    };

    return (
        <View className="flex-1 justify-center items-center px-6 bg-gray-100">
            <Text className="text-4xl font-bold mb-2 text-gray-800">
                Curiokids
            </Text>

            <Text className="text-lg text-gray-600 mb-12 text-center">
                Welcome to the learning platform!
            </Text>

            <TouchableOpacity
                className="bg-blue-600 py-4 px-8 rounded-xl shadow-md min-w-[200px]"
                onPress={goToLogin}
            >
                <Text className="text-white text-xl font-semibold text-center">
                    Log In / Sign Up
                </Text>
            </TouchableOpacity>

            <Text className="absolute bottom-10 text-xs text-gray-400">
                The entry point for your application.
            </Text>
        </View>
    );
};

export default AppIndexScreen;
