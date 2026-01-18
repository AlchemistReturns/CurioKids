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
    ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import TigerMascot from "@/components/LessonEngine/TigerMascot";

// Level configurations with emojis
const LEVEL_EMOJIS: Record<number, { emoji: string; title: string }> = {
    1: { emoji: "🌈", title: "Rainbow Bridge" },
    2: { emoji: "🌲", title: "Number Forest" },
    3: { emoji: "⭐", title: "Star Valley" },
    4: { emoji: "🎯", title: "Challenge Peak" },
    5: { emoji: "🏆", title: "Champion Summit" },
};

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

    // Get level info for module
    const getLevelInfo = (order: number) => {
        return LEVEL_EMOJIS[order] || { emoji: "📚", title: `Level ${order}` };
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-[#FFF8E1]">
                <ActivityIndicator size="large" color="#FF9800" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#FFF8E1]">
            {/* Warm Gradient Header with Tiger */}
            <View
                className="pt-12 pb-8 px-6 overflow-hidden"
                style={{
                    backgroundColor: '#FFB74D',
                    borderBottomLeftRadius: 30,
                    borderBottomRightRadius: 30,
                }}
            >
                {/* Decorative clouds */}
                <View className="absolute top-8 left-8 w-16 h-8 bg-white/30 rounded-full" />
                <View className="absolute top-12 left-20 w-10 h-5 bg-white/20 rounded-full" />
                <View className="absolute top-16 right-32 w-12 h-6 bg-white/25 rounded-full" />

                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mb-4 bg-white/30 self-start p-2.5 rounded-full"
                >
                    <Ionicons name="arrow-back" size={24} color="#5D4037" />
                </TouchableOpacity>

                {/* Title and Tiger Row */}
                <View className="flex-row justify-between items-end">
                    <View className="flex-1">
                        <Text
                            className="text-3xl font-bold mb-1"
                            style={{ color: '#3E2723' }}
                        >
                            {title}
                        </Text>
                        <Text
                            className="text-lg"
                            style={{ color: '#5D4037' }}
                        >
                            {modules.length} Modules
                        </Text>
                    </View>

                    {/* Tiger Mascot */}
                    <View className="mr-[-20px] mb-[-20px]">
                        <TigerMascot mood="happy" size="medium" />
                    </View>
                </View>

                {/* Decorative leaves */}
                <View className="absolute bottom-4 right-4 w-8 h-12 bg-[#4CAF50]/30 rounded-full rotate-45" />
                <View className="absolute bottom-2 right-12 w-6 h-10 bg-[#8BC34A]/30 rounded-full rotate-[-30deg]" />
            </View>

            {/* Modules List */}
            <ScrollView
                className="flex-1 px-4 mt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {modules.map((module, moduleIndex) => {
                    const levelInfo = getLevelInfo(module.order);

                    return (
                        <View key={module.id} className="mb-6">
                            {/* Level Header with Wave Design */}
                            <View
                                className="rounded-t-2xl px-4 py-3 flex-row items-center"
                                style={{ backgroundColor: '#FFD54F' }}
                            >
                                <Text className="text-xl font-bold text-[#5D4037]">
                                    Level {module.order}: {module.title || levelInfo.title} {levelInfo.emoji}
                                </Text>
                            </View>

                            {/* Wavy Separator */}
                            <View
                                className="h-3 w-full"
                                style={{
                                    backgroundColor: '#FFD54F',
                                    borderBottomLeftRadius: 50,
                                    borderBottomRightRadius: 50,
                                }}
                            />

                            {/* Lessons Container */}
                            <View className="bg-[#FFF3E0] rounded-b-2xl pt-2 pb-1 px-2 shadow-sm">
                                {module.lessons.map((lesson: any, lessonIndex: number) => (
                                    <TouchableOpacity
                                        key={lesson.id}
                                        className="flex-row items-center p-3 my-1 bg-[#FFECB3] rounded-xl"
                                        onPress={() => handleLessonClick(lesson, module.id)}
                                        activeOpacity={0.7}
                                    >
                                        {/* Lesson Number Circle */}
                                        <View
                                            className="h-10 w-10 rounded-full justify-center items-center mr-3 shadow-sm"
                                            style={{ backgroundColor: '#FF9800' }}
                                        >
                                            <Text className="text-white font-bold text-lg">
                                                {lessonIndex + 1}
                                            </Text>
                                        </View>

                                        {/* Lesson Info */}
                                        <View className="flex-1">
                                            <Text
                                                className="font-bold text-lg"
                                                style={{ color: '#3E2723' }}
                                            >
                                                {lesson.title}
                                            </Text>
                                            <Text
                                                className="text-xs uppercase font-semibold tracking-wider"
                                                style={{ color: '#8D6E63' }}
                                            >
                                                {lesson.type.replace(/_/g, ' ')}
                                            </Text>
                                        </View>

                                        {/* Play Button */}
                                        <View
                                            className="h-10 w-10 rounded-full justify-center items-center shadow"
                                            style={{ backgroundColor: '#FF9800' }}
                                        >
                                            <Ionicons name="play" size={20} color="white" />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

