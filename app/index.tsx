import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const AppIndexScreen = () => {

    const goToLogin = () => {
        router.push('/login');
    };

    const goToChildLogin = () => {
        router.push('/childLogin')
    }

    return (
        <View className="flex-1 justify-center items-center px-6 bg-gray-100">
            <Text className="text-4xl font-bold mb-2 text-gray-800">
                Curiokids
            </Text>

            <Text className="text-lg text-gray-600 mb-12 text-center">
                Welcome to the learning platform!
            </Text>

            <TouchableOpacity
                className="bg-blue-600 py-4 px-8 rounded-xl shadow-md min-w-[200px] mb-4"
                onPress={goToLogin}
            >
                <Text className="text-white text-xl font-semibold text-center">
                    Parent Login
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="bg-blue-600 py-4 px-8 rounded-xl shadow-md min-w-[200px]"
                onPress={goToChildLogin}
            >
                <Text className="text-white text-xl font-semibold text-center">
                    Child Login
                </Text>
            </TouchableOpacity>

            <Text className="absolute bottom-10 text-xs text-gray-400">
                The entry point for your application.
            </Text>
        </View>
    );
};

export default AppIndexScreen;
