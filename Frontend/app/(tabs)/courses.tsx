import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { CourseService } from "../../services/CourseService";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Courses() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const coursesData = await CourseService.getCourses();
            setCourses(coursesData);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderCourseItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="bg-white mb-4 rounded-3xl overflow-hidden shadow-sm border-2 border-tigerCream"
            onPress={() => router.push({ pathname: "/child/course/[id]", params: { id: item.id, title: item.title, color: item.color } })}
        >
            <View
                className="h-32 justify-center items-center"
                style={{ backgroundColor: item.color || "#FF6E4F" }}
            >
                <Ionicons name={item.icon || "school"} size={64} color="white" />
            </View>
            <View className="p-4">
                <Text className="text-xl font-black text-tigerBrown mb-1">
                    {item.title}
                </Text>
                <Text className="text-tigerBrown/70 text-sm font-bold" numberOfLines={2}>
                    {item.description}
                </Text>
                <View className="mt-4 flex-row items-center">
                    <Text className="text-tigerOrange font-black mr-1 text-base">Start Learning</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FF6E4F" />
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-tigerCream">
                <ActivityIndicator size="large" color="#FF6E4F" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-tigerCream">
            {/* Custom Header */}
            <View className="bg-tigerYellow pt-12 pb-6 px-6 rounded-b-[40px] flex-row justify-between items-end shadow-sm z-10 mb-4">
                <View className="mb-2">
                    <Text className="text-tigerBrown text-3xl font-black">Learning Path</Text>
                    <Text className="text-tigerBrown/80 text-lg font-bold">Choose your adventure</Text>
                </View>
                <Image
                    source={require('../../assets/tiger_sitting.png')}
                    className="w-20 h-20"
                    resizeMode="contain"
                />
            </View>

            <View className="px-6 flex-1">
                <FlatList
                    data={courses}
                    renderItem={renderCourseItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </View>
    );
}
