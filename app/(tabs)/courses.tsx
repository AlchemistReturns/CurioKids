import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, getDocs, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { firestore } from "../../config/firebase";

export default function Courses() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            // Assuming 'order' field might not exist on root courses for now, but good practice.
            // If no order, just getDocs(collection(...))
            const q = query(collection(firestore, "courses"));
            const querySnapshot = await getDocs(q);
            const coursesData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setCourses(coursesData);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderCourseItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="bg-white mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-100"
            onPress={() => router.push({ pathname: "/child/course/[id]", params: { id: item.id, title: item.title, color: item.color } })}
        >
            <View
                className="h-32 justify-center items-center"
                style={{ backgroundColor: item.color || "#4CAF50" }}
            >
                <Ionicons name={item.icon || "school"} size={64} color="white" />
            </View>
            <View className="p-4">
                <Text className="text-xl font-bold text-gray-800 mb-1">
                    {item.title}
                </Text>
                <Text className="text-gray-500 text-sm" numberOfLines={2}>
                    {item.description}
                </Text>
                <View className="mt-4 flex-row items-center">
                    <Text className="text-primary font-semibold mr-1">Start Learning</Text>
                    <Ionicons name="arrow-forward" size={16} color="#5DADE2" />
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-base">
                <ActivityIndicator size="large" color="#F0E491" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-base" edges={["top"]}>
            <View className="px-6 flex-1">
                <Text className="text-primary font-bold text-3xl mt-6 mb-6">
                    Explore Courses
                </Text>
                <FlatList
                    data={courses}
                    renderItem={renderCourseItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </SafeAreaView>
    );
}
