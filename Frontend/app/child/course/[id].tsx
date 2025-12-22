import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { CourseService } from "../../../services/CourseService";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";


export default function CourseDetailsScreen() {
    const { id, title, color } = useLocalSearchParams();
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchModules();
        }
    }, [id]);

    const fetchModules = async () => {
        try {
            const modulesData = await CourseService.getModules(id as string);

            // Note: The previous logic fetched lessons for each module. 
            // My default `getModules` endpoint only returns modules.
            // I should technically enhance the backend to return modules WITH lessons or fetch them here.
            // Given the requirement "no DB connection", I must use API.
            // Option 1: Enhance Backend `getModules` to include lessons (Best for performance).
            // Option 2: Loop fetch lessons here (Slow).
            // Let's loop fetch for now as it's safer without altering backend schema too much, 
            // OR better: I will assume the backend `getModules` handles deep fetch IF I modified it. 
            // Actually, I didn't modify it to be deep. 
            // Let's do the loop here using CourseService.getLessons.

            const modulesWithLessons = await Promise.all(modulesData.map(async (module: any) => {
                const lessons = await CourseService.getLessons(id as string, module.id);
                const sortedLessons = lessons.sort((a: any, b: any) => a.order - b.order);
                return {
                    ...module,
                    lessons: sortedLessons
                };
            }));

            // Sort modules
            const sortedModules = modulesWithLessons.sort((a: any, b: any) => a.order - b.order);

            setModules(sortedModules);
        } catch (error) {
            console.error("Error fetching modules:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLessonClick = (lesson: any, moduleId: string) => {
        router.push({
            pathname: "/child/course/lesson/[id]",
            params: {
                courseId: id,
                moduleId: moduleId,
                id: lesson.id,
                title: lesson.title
            }
        });
    }

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-base">
                <ActivityIndicator size="large" color={color as string || "#F0E491"} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-base">
            {/* Header */}
            <View
                className="pt-12 pb-6 px-6 rounded-b-3xl shadow-lg"
                style={{ backgroundColor: color as string || "#4CAF50" }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mb-4 bg-white/20 self-start p-2 rounded-full"
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-3xl font-bold">{title}</Text>
                <Text className="text-white/80 text-lg">{modules.length} Modules</Text>
            </View>

            <ScrollView className="flex-1 px-4 mt-4" showsVerticalScrollIndicator={false}>
                {modules.map((module, index) => (
                    <View key={module.id} className="mb-6">
                        <Text className="text-primary text-xl font-bold mb-3 ml-2">
                            {module.title}
                        </Text>

                        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                            {module.lessons.map((lesson: any, i: number) => (
                                <TouchableOpacity
                                    key={lesson.id}
                                    className={`flex-row items-center p-4 border-b border-gray-100 ${i === module.lessons.length - 1 ? 'border-b-0' : ''}`}
                                    onPress={() => handleLessonClick(lesson, module.id)}
                                >
                                    <View className="h-10 w-10 rounded-full bg-secondary/20 justify-center items-center mr-4">
                                        <Text className="text-primary font-bold">{i + 1}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-800 font-semibold text-lg">{lesson.title}</Text>
                                        <Text className="text-gray-500 text-xs uppercase font-bold tracking-wider">{lesson.type}</Text>
                                    </View>
                                    <Ionicons name="play-circle" size={32} color="#F0E491" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
