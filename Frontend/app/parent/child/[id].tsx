import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserService } from "../../../services/UserService";

export default function ChildDetailScreen() {
    const { id } = useLocalSearchParams();
    const [child, setChild] = useState<any>(null);
    const [progress, setProgress] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch User Details
                const childData = await UserService.getProfile(id as string);
                if (childData) {
                    setChild(childData);
                }

                // Fetch Progress Details
                const progressData = await UserService.getProgress(id as string);
                if (progressData) {
                    setProgress(progressData);
                }
            } catch (error) {
                console.error("Error fetching child details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-base">
                <ActivityIndicator size="large" color="#F0E491" />
            </View>
        );
    }

    if (!child) {
        return (
            <View className="flex-1 justify-center items-center bg-base">
                <Text className="text-primary font-bold">Child not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <View className="flex-row items-center px-4 py-4 border-b border-gray-100 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text className="text-xl font-bold flex-1 text-center mr-8">Child Profile</Text>
            </View>

            <ScrollView className="flex-1 bg-base">
                <View className="items-center py-8 bg-primary rounded-b-3xl shadow-lg">
                    <View className="h-24 w-24 bg-base rounded-full justify-center items-center mb-4 border-4 border-secondary">
                        <Text className="text-primary text-4xl font-bold">
                            {(child.name?.[0] || child.email?.[0] || "C").toUpperCase()}
                        </Text>
                    </View>
                    <Text className="text-white text-2xl font-bold mb-1">{child.name || "Explorer"}</Text>
                    <Text className="text-secondary text-sm">{child.email}</Text>
                </View>

                <View className="p-6">
                    <Text className="text-primary text-xl font-bold mb-4">Progress Overview</Text>

                    <View className="flex-row justify-between mb-4">
                        <View className="bg-white p-4 rounded-2xl w-[48%] items-center shadow-sm">
                            <View className="bg-yellow-100 p-3 rounded-full mb-2">
                                <Ionicons name="trophy" size={24} color="#F59E0B" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-800">{child.totalPoints || 0}</Text>
                            <Text className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Points</Text>
                        </View>
                        <View className="bg-white p-4 rounded-2xl w-[48%] items-center shadow-sm">
                            <View className="bg-purple-100 p-3 rounded-full mb-2">
                                <Ionicons name="star" size={24} color="#8B5CF6" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-800">{progress?.stars || 0}</Text>
                            <Text className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Stars</Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between mb-8">
                        <View className="bg-white p-4 rounded-2xl w-[48%] items-center shadow-sm">
                            <View className="bg-green-100 p-3 rounded-full mb-2">
                                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-800">{progress?.completedLessons?.length || 0}</Text>
                            <Text className="text-gray-500 text-xs uppercase font-bold tracking-wider">Lessons Done</Text>
                        </View>
                        <View className="bg-white p-4 rounded-2xl w-[48%] items-center shadow-sm">
                            <View className="bg-red-100 p-3 rounded-full mb-2">
                                <Ionicons name="flame" size={24} color="#EF4444" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-800">{progress?.streak || 0}</Text>
                            <Text className="text-gray-500 text-xs uppercase font-bold tracking-wider">Day Streak</Text>
                        </View>
                    </View>

                    {/* Recent Activity Section could go here */}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
